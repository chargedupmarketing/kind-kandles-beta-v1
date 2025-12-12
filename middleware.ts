import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long'
);

interface TokenPayload {
  email: string;
  role: string;
  userId?: string;
  subLevels?: string[];
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window for general API
const RATE_LIMIT_AUTH_MAX = 10; // Max auth attempts per window

// In-memory rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return `${ip}:${request.nextUrl.pathname}`;
}

function checkRateLimit(key: string, maxRequests: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      email: payload.email as string,
      role: payload.role as string,
      userId: payload.userId as string | undefined,
      subLevels: payload.subLevels as string[] | undefined
    };
  } catch {
    return null;
  }
}

// Routes that require super_admin role
const SUPER_ADMIN_ONLY_ROUTES = [
  '/api/admin/users',
  '/api/admin/database'
];

// Public admin routes (no auth required)
const PUBLIC_ADMIN_ROUTES = [
  '/api/admin/seed-super-admin'
];

// Routes that require super_admin OR developer sub-level
const DEVELOPER_ROUTES = [
  '/api/admin/sub-levels'
];

// Check if path matches any of the protected routes
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const isAuthRoute = pathname.includes('/auth/');
    const maxRequests = isAuthRoute ? RATE_LIMIT_AUTH_MAX : RATE_LIMIT_MAX_REQUESTS;
    const rateLimitKey = getRateLimitKey(request);
    const { allowed, remaining, resetIn } = checkRateLimit(rateLimitKey, maxRequests);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(resetIn / 1000).toString(),
            'Retry-After': Math.ceil(resetIn / 1000).toString(),
          }
        }
      );
    }
  }
  
  // Handle admin subdomain
  const isAdminSubdomain = hostname.startsWith('admin.');
  
  // Redirect admin subdomain root to login
  if (isAdminSubdomain && pathname === '/') {
    return NextResponse.redirect(new URL('/restricted/login', request.url));
  }

  // Handle admin route protection
  if (pathname.startsWith('/restricted/admin')) {
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      return NextResponse.redirect(new URL('/restricted/login', request.url));
    }

    try {
      const payload = await verifyToken(adminToken);
      if (!payload) {
        const response = NextResponse.redirect(new URL('/restricted/login', request.url));
        response.cookies.set('admin-token', '', { 
          maxAge: 0, 
          path: '/',
          domain: hostname.includes('kindkandlesboutique.com') ? '.kindkandlesboutique.com' : undefined
        });
        return response;
      }
      
      // Add user info to headers for downstream use
      const response = NextResponse.next();
      response.headers.set('x-user-role', payload.role);
      response.headers.set('x-user-email', payload.email);
      if (payload.subLevels) {
        response.headers.set('x-user-sub-levels', payload.subLevels.join(','));
      }
      
      return response;
    } catch (error) {
      console.error('Token verification failed:', error);
      const response = NextResponse.redirect(new URL('/restricted/login', request.url));
      response.cookies.set('admin-token', '', { 
        maxAge: 0, 
        path: '/',
        domain: hostname.includes('kindkandlesboutique.com') ? '.kindkandlesboutique.com' : undefined
      });
      return response;
    }
  }

  // Handle API route protection
  if (pathname.startsWith('/api/admin/')) {
    // Allow public admin routes without authentication
    if (matchesRoute(pathname, PUBLIC_ADMIN_ROUTES)) {
      return NextResponse.next();
    }
    
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      const payload = await verifyToken(adminToken);
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      const role = payload.role;
      const subLevels = payload.subLevels || [];

      // Check super admin only routes
      if (matchesRoute(pathname, SUPER_ADMIN_ONLY_ROUTES)) {
        if (role !== 'super_admin') {
          return NextResponse.json(
            { error: 'Access denied. Super admin privileges required.' },
            { status: 403 }
          );
        }
      }

      // Check developer routes (super_admin OR developer sub-level)
      if (matchesRoute(pathname, DEVELOPER_ROUTES)) {
        if (role !== 'super_admin' && !subLevels.includes('developer')) {
          return NextResponse.json(
            { error: 'Access denied. Developer or super admin privileges required.' },
            { status: 403 }
          );
        }
      }

      // Check if user role is at least 'admin' for other admin routes
      if (role === 'user') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      // Add user info to request headers
      const response = NextResponse.next();
      response.headers.set('x-user-role', role);
      response.headers.set('x-user-email', payload.email);
      if (payload.userId) {
        response.headers.set('x-user-id', payload.userId);
      }
      if (subLevels.length > 0) {
        response.headers.set('x-user-sub-levels', subLevels.join(','));
      }
      
      return response;
    } catch (error) {
      console.error('API auth error:', error);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
  }

  // Create response with security headers
  const response = NextResponse.next();
  
  // Security headers for all routes
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy for admin pages
  if (pathname.startsWith('/restricted')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sandbox.web.squarecdn.com https://web.squarecdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://connect.squareup.com https://connect.squareupsandbox.com; frame-src 'self' https://sandbox.web.squarecdn.com https://web.squarecdn.com;"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
};
