import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

// Rate limiting storage (in production, use Redis or database)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Configuration from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';
const RATE_LIMIT_MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5');
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '3600000'); // 1 hour
const OTP_EXPIRY_MINUTES = 10;

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Kind Kandles <noreply@kindkandlesboutique.com>';

interface LoginRequest {
  username: string;
  password: string;
}

interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  two_factor_enabled: boolean;
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Verify password with bcrypt
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    // First try bcrypt comparison
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch {
    // Fallback to plain text comparison for legacy passwords
    return plainPassword === hashedPassword;
  }
}

// Check credentials against database
async function checkDatabaseCredentials(email: string, password: string): Promise<AdminUser | null> {
  try {
    if (!isSupabaseConfigured()) {
      return null;
    }
    
    const supabase = createServerClient();
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (error || !user) {
      return null;
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }
    
    return user as AdminUser;
  } catch (error) {
    console.error('Database auth error:', error);
    return null;
  }
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

// Create JWT token (for fallback non-2FA login)
async function createToken(
  email: string, 
  role: string = 'admin',
  userId?: string,
  subLevels: string[] = []
): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const alg = 'HS256';
  
  const jwt = await new SignJWT({ 
    email, 
    role,
    userId,
    subLevels 
  })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TIMEOUT_MS / 1000)
    .sign(secret);
    
  return jwt;
}

// Send OTP email
async function sendOTPEmail(email: string, firstName: string, otp: string): Promise<boolean> {
  if (!resend) {
    console.warn('Resend API key not configured - OTP email not sent');
    return false;
  }
  
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your Kind Kandles Admin Login Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #14b8a6; margin: 0;">Kind Kandles</h1>
            <p style="color: #666; margin: 5px 0 0;">Admin Portal</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px;">
            <p style="color: rgba(255,255,255,0.9); margin: 0 0 15px; font-size: 16px;">
              Hi ${firstName || 'there'},
            </p>
            <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px; font-size: 14px;">
              Your verification code is:
            </p>
            <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 200px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: white;">${otp}</span>
            </div>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px; font-size: 14px;">
              <strong>⏱️ This code expires in ${OTP_EXPIRY_MINUTES} minutes.</strong>
            </p>
            <p style="margin: 0; font-size: 14px; color: #666;">
              If you didn't request this code, please ignore this email or contact support if you have concerns.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 0;">
              🔒 Never share this code with anyone. Kind Kandles staff will never ask for your verification code.
            </p>
          </div>
        </body>
        </html>
      `
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
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
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // First try database authentication
    const dbUser = await checkDatabaseCredentials(body.username, body.password);
    
    if (dbUser) {
      // Database user found - check if 2FA is enabled (default: true)
      const requires2FA = dbUser.two_factor_enabled !== false;
      
      if (requires2FA && isSupabaseConfigured()) {
        const supabase = createServerClient();
        
        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        
        // Invalidate any existing unused codes
        await supabase
          .from('two_factor_codes')
          .update({ used: true })
          .eq('user_id', dbUser.id)
          .eq('used', false);
        
        // Store OTP in database
        const { error: insertError } = await supabase
          .from('two_factor_codes')
          .insert({
            user_id: dbUser.id,
            code: otp,
            expires_at: expiresAt.toISOString(),
            used: false,
            attempts: 0
          });
        
        if (insertError) {
          console.error('Error storing OTP:', insertError);
          return NextResponse.json(
            { error: 'Failed to generate verification code' },
            { status: 500 }
          );
        }
        
        // Send OTP email
        const emailSent = await sendOTPEmail(dbUser.email, dbUser.first_name, otp);
        
        // In development, log the OTP for testing
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] OTP for ${dbUser.email}: ${otp}`);
        }
        
        // Clear rate limiting on successful credential validation
        loginAttempts.delete(clientId);
        
        return NextResponse.json({
          success: true,
          requires2FA: true,
          userId: dbUser.id,
          email: dbUser.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
          message: emailSent 
            ? 'Verification code sent to your email' 
            : 'Verification code generated (check server logs in development)',
          expiresAt: expiresAt.toISOString()
        });
      }
      
      // 2FA not enabled - create session directly (legacy behavior)
      const { data: subLevelAssignments } = await createServerClient()
        .from('user_sub_level_assignments')
        .select('user_sub_levels(slug)')
        .eq('user_id', dbUser.id);
      
      const subLevels = subLevelAssignments?.map(
        (a: any) => a.user_sub_levels?.slug
      ).filter(Boolean) || [];
      
      const token = await createToken(dbUser.email, dbUser.role, dbUser.id, subLevels);
      
      // Update last login
      await createServerClient()
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', dbUser.id);
      
      const response = NextResponse.json({ 
        success: true,
        message: 'Login successful',
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: `${dbUser.first_name} ${dbUser.last_name}`,
          role: dbUser.role,
          subLevels
        },
        expiresAt: Date.now() + SESSION_TIMEOUT_MS
      });
      
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_TIMEOUT_MS / 1000,
        path: '/'
      });
      
      loginAttempts.delete(clientId);
      return response;
    }
    
    // Fallback to environment variable authentication (no 2FA for env var login)
    if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
      const token = await createToken(body.username, 'admin');
      
      const response = NextResponse.json({ 
        success: true,
        message: 'Login successful',
        user: {
          email: body.username,
          role: 'admin',
          subLevels: []
        },
        expiresAt: Date.now() + SESSION_TIMEOUT_MS
      });
      
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_TIMEOUT_MS / 1000,
        path: '/'
      });
      
      loginAttempts.delete(clientId);
      return response;
    }
    
    // Authentication failed
    await new Promise(resolve => setTimeout(resolve, 1000)); // Prevent timing attacks
    
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify JWT token (utility function)
export async function verifyToken(token: string): Promise<{ 
  email: string; 
  role: string;
  userId?: string;
  subLevels?: string[];
} | null> {
  try {
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      email: payload.email as string,
      role: payload.role as string,
      userId: payload.userId as string | undefined,
      subLevels: payload.subLevels as string[] | undefined
    };
  } catch (error) {
    return null;
  }
}
