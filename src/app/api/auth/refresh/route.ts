import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MS || '3600000'); // 1 hour
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000; // Refresh if less than 15 minutes remaining

/**
 * Token Refresh Endpoint
 * 
 * Refreshes the JWT token if it's close to expiring.
 * This allows users to stay logged in without re-authenticating.
 */
export async function POST(request: NextRequest) {
  try {
    // Get current token from cookie
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    // Verify current token
    const secret = new TextEncoder().encode(JWT_SECRET);
    let payload;
    
    try {
      const result = await jwtVerify(token, secret);
      payload = result.payload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Check if token needs refresh (less than threshold remaining)
    const exp = payload.exp as number;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = (exp - now) * 1000;
    
    // If token has plenty of time remaining, just return success without refresh
    if (timeRemaining > REFRESH_THRESHOLD_MS) {
      return NextResponse.json({
        success: true,
        refreshed: false,
        message: 'Token still valid',
        expiresAt: exp * 1000
      });
    }
    
    // Verify user is still active in database
    if (payload.userId && isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data: user, error } = await supabase
        .from('admin_users')
        .select('is_active, role')
        .eq('id', payload.userId)
        .single();
      
      if (error || !user || !user.is_active) {
        // User no longer active, don't refresh
        const response = NextResponse.json(
          { error: 'Account is no longer active' },
          { status: 403 }
        );
        
        // Clear the cookie
        response.cookies.set('admin-token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0,
          path: '/',
          ...(process.env.NODE_ENV === 'production' && {
            domain: '.kindkandlesboutique.com'
          })
        });
        
        return response;
      }
      
      // Use current role from database (in case it changed)
      payload.role = user.role;
    }
    
    // Get fresh sub-levels if user has userId
    let subLevels = (payload.subLevels as string[]) || [];
    if (payload.userId && isSupabaseConfigured()) {
      try {
        const supabase = createServerClient();
        const { data: assignments } = await supabase
          .from('user_sub_level_assignments')
          .select('user_sub_levels(slug)')
          .eq('user_id', payload.userId);
        
        if (assignments) {
          subLevels = assignments
            .map((a: { user_sub_levels: { slug: string }[] }) => a.user_sub_levels?.[0]?.slug)
            .filter((slug): slug is string => Boolean(slug));
        }
      } catch (error) {
        console.error('Error fetching sub-levels during refresh:', error);
        // Continue with existing sub-levels
      }
    }
    
    // Create new token with extended expiration
    const newToken = await new SignJWT({
      email: payload.email,
      role: payload.role,
      userId: payload.userId,
      subLevels
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TIMEOUT_MS / 1000)
      .sign(secret);
    
    const newExpiresAt = Date.now() + SESSION_TIMEOUT_MS;
    
    const response = NextResponse.json({
      success: true,
      refreshed: true,
      message: 'Token refreshed successfully',
      expiresAt: newExpiresAt
    });
    
    // Set new cookie
    response.cookies.set('admin-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TIMEOUT_MS / 1000,
      path: '/',
      ...(process.env.NODE_ENV === 'production' && {
        domain: '.kindkandlesboutique.com'
      })
    });
    
    return response;
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
