import { NextRequest, NextResponse } from 'next/server';

const MAINTENANCE_ACCESS_CODE = process.env.MAINTENANCE_ACCESS_CODE || 'ADMIN123';

interface VerifyRequest {
  accessCode: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();
    
    // Validate input
    if (!body.accessCode) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }
    
    // Add delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify access code
    if (body.accessCode !== MAINTENANCE_ACCESS_CODE) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }
    
    // Set maintenance access cookie (24 hours)
    const response = NextResponse.json({ 
      success: true,
      message: 'Access granted'
    });
    
    response.cookies.set('maintenance-access', 'granted', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Maintenance access verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
