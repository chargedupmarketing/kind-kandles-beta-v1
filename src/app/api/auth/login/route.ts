import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { 
  asyncHandler, 
  ValidationError, 
  AuthenticationError, 
  RateLimitError,
  validateRequired,
  sanitizeInput
} from '@/lib/errorHandler';

// Rate limiting storage (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Configuration from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'test@kindkandlesboutique.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234'; // Will be hashed in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';
const RATE_LIMIT_MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5');
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '3600000'); // 1 hour

interface LoginRequest {
  username: string;
  password: string;
}

// Simple password verification (in production, use bcrypt)
function verifyPassword(plainPassword: string, storedPassword: string): boolean {
  // TODO: Replace with bcrypt.compare(plainPassword, hashedPassword) in production
  return plainPassword === storedPassword;
}

// Rate limiting check
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(clientId);
  
  if (!attempts) {
    loginAttempts.set(clientId, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(clientId, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if exceeded max attempts
  if (attempts.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }
  
  // Increment attempts
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

// Create JWT token
async function createToken(username: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const alg = 'HS256';
  
  const jwt = await new SignJWT({ username, role: 'admin' })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TIMEOUT_MS / 1000)
    .sign(secret);
    
  return jwt;
}

export async function POST(request: NextRequest) {
  try {
    // Get client identifier for rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check rate limiting
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: RATE_LIMIT_WINDOW_MS / 1000 
        },
        { status: 429 }
      );
    }
    
    const body: LoginRequest = await request.json();
    
    // Validate input
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Verify credentials
    if (body.username !== ADMIN_USERNAME || !verifyPassword(body.password, ADMIN_PASSWORD)) {
      // Add delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create JWT token
    const token = await createToken(body.username);
    
    // Create response with secure HTTP-only cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Login successful',
      expiresAt: Date.now() + SESSION_TIMEOUT_MS
    });
    
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_TIMEOUT_MS / 1000,
      path: '/'
    });
    
    // Clear rate limiting on successful login
    loginAttempts.delete(clientId);
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify JWT token (utility function)
export async function verifyToken(token: string): Promise<{ username: string; role: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      username: payload.username as string,
      role: payload.role as string
    };
  } catch (error) {
    return null;
  }
}
