import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long';

// Verify JWT token
async function verifyToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin route protection
  if (pathname.startsWith('/restricted/admin')) {
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/restricted/login', request.url));
    }

    try {
      // Verify the token
      const payload = await verifyToken(adminToken);
      if (!payload) {
        // If token is invalid, redirect to login and clear cookie
        const response = NextResponse.redirect(new URL('/restricted/login', request.url));
        response.cookies.set('admin-token', '', { maxAge: 0, path: '/' });
        return response;
      }
      // Token is valid, proceed
      return NextResponse.next();
    } catch (error) {
      console.error('Token verification failed in middleware:', error);
      const response = NextResponse.redirect(new URL('/restricted/login', request.url));
      response.cookies.set('admin-token', '', { maxAge: 0, path: '/' });
      return response;
    }
  }

  // Handle maintenance mode bypass for public pages
  if (!pathname.startsWith('/restricted') && !pathname.startsWith('/api')) {
    const maintenanceBypass = request.cookies.get('maintenance-bypass')?.value;
    if (maintenanceBypass === 'granted') {
      // If maintenance bypass cookie is present, allow access
      return NextResponse.next();
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP for admin pages
  if (pathname.startsWith('/restricted')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/restricted/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
};
