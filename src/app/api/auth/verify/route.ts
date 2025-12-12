import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long'
);

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    // Verify token
    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      // Clear invalid cookie
      const response = NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
      
      response.cookies.set('admin-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      });
      
      return response;
    }
    
    // Get additional user info from database if available
    let userName = payload.email as string;
    let subLevels = (payload.subLevels as string[]) || [];
    
    if (payload.userId && isSupabaseConfigured()) {
      try {
        const supabase = createServerClient();
        
        // Get user details
        const { data: user } = await supabase
          .from('admin_users')
          .select('first_name, last_name')
          .eq('id', payload.userId)
          .single();
        
        if (user) {
          userName = `${user.first_name} ${user.last_name}`;
        }
        
        // Get fresh sub-levels
        const { data: assignments } = await supabase
          .from('user_sub_level_assignments')
          .select('user_sub_levels(slug)')
          .eq('user_id', payload.userId);
        
        if (assignments) {
          subLevels = assignments
            .map((a: any) => a.user_sub_levels?.slug)
            .filter(Boolean);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        // Continue with token data
      }
    }
    
    return NextResponse.json({ 
      success: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        username: payload.email, // For backwards compatibility
        name: userName,
        role: payload.role,
        subLevels
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
