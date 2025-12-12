import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Create response and clear the authentication cookie
    const response = NextResponse.json({ 
      success: true,
      message: 'Logout successful'
    });
    
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
      ...(process.env.NODE_ENV === 'production' && {
        domain: '.kindkandlesboutique.com'
      })
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
