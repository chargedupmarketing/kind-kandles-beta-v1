import { NextRequest, NextResponse } from 'next/server';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  timestamp: string;
}

export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status });
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): NextResponse {
  const response: APIResponse = {
    success: false,
    error: {
      message,
      code,
      details
    },
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status });
}

export function validateRequestBody(body: any, requiredFields: string[]): void {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const missingFields = requiredFields.filter(field => 
    !body[field] || (typeof body[field] === 'string' && !body[field].trim())
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, maxLength);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(identifier);
  
  if (!current || current.resetTime < windowStart) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetTime: current.resetTime 
  };
}

export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof Error) {
        // Handle validation errors
        if (error.message.includes('Missing required fields') || 
            error.message.includes('Request body is required')) {
          return createErrorResponse(error.message, 400, 'VALIDATION_ERROR');
        }

        // Handle authentication errors
        if (error.message.includes('Invalid credentials') || 
            error.message.includes('Authentication')) {
          return createErrorResponse(error.message, 401, 'AUTHENTICATION_ERROR');
        }

        // Handle authorization errors
        if (error.message.includes('Unauthorized') || 
            error.message.includes('Permission')) {
          return createErrorResponse(error.message, 403, 'AUTHORIZATION_ERROR');
        }

        // Handle rate limiting
        if (error.message.includes('Too many requests')) {
          return createErrorResponse(error.message, 429, 'RATE_LIMIT_ERROR');
        }

        // Generic error
        return createErrorResponse(
          process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          500,
          'INTERNAL_ERROR',
          process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
        );
      }

      return createErrorResponse('An unexpected error occurred', 500);
    }
  };
}
