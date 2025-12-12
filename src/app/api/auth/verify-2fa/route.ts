import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '3600000'); // 1 hour
const MAX_OTP_ATTEMPTS = 3;

interface Verify2FARequest {
  userId: string;
  code: string;
}

// Create JWT token with role and sub-levels
async function createToken(
  email: string, 
  role: string, 
  userId: string,
  subLevels: string[]
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

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const body: Verify2FARequest = await request.json();
    const { userId, code } = body;
    
    // Validate input
    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and verification code are required' },
        { status: 400 }
      );
    }
    
    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }
    
    const supabase = createServerClient();
    
    // Get the most recent valid OTP for this user
    const { data: otpRecord, error: otpError } = await supabase
      .from('two_factor_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Verification code expired or not found. Please request a new code.' },
        { status: 400 }
      );
    }
    
    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      // Mark as used to prevent further attempts
      await supabase
        .from('two_factor_codes')
        .update({ used: true })
        .eq('id', otpRecord.id);
      
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 429 }
      );
    }
    
    // Verify the code
    if (otpRecord.code !== code) {
      // Increment attempts
      await supabase
        .from('two_factor_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);
      
      const remainingAttempts = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
      
      return NextResponse.json(
        { 
          error: 'Invalid verification code',
          remainingAttempts 
        },
        { status: 401 }
      );
    }
    
    // Code is valid - mark as used
    await supabase
      .from('two_factor_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);
    
    // Get user details with sub-levels
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active
      `)
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }
    
    // Get user's sub-levels
    const { data: subLevelAssignments } = await supabase
      .from('user_sub_level_assignments')
      .select(`
        sub_level_id,
        user_sub_levels (
          slug,
          name
        )
      `)
      .eq('user_id', userId);
    
    const subLevels = subLevelAssignments?.map(
      (a: any) => a.user_sub_levels?.slug
    ).filter(Boolean) || [];
    
    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
    
    // Create JWT token
    const token = await createToken(user.email, user.role, user.id, subLevels);
    
    // Create response with secure HTTP-only cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
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
    
    // Clean up old OTP codes for this user
    await supabase
      .from('two_factor_codes')
      .delete()
      .eq('user_id', userId)
      .neq('id', otpRecord.id);
    
    return response;
    
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

