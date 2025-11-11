import { NextResponse } from 'next/server';

export interface APIError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR', true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service ${service} is unavailable`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { service }
    );
  }
}

// Error handler for API routes
export function handleAPIError(error: unknown, request?: Request): NextResponse {
  console.error('API Error:', error);

  // Default error response
  let apiError: APIError = {
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: request?.url
  };

  // Handle known error types
  if (error instanceof AppError) {
    apiError = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: new Date().toISOString(),
      path: request?.url
    };
  } else if (error instanceof Error) {
    // Handle generic JavaScript errors
    apiError.message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred';
    
    if (process.env.NODE_ENV === 'development') {
      apiError.details = {
        stack: error.stack,
        name: error.name
      };
    }
  }

  // Log error for monitoring (in production, send to external service)
  if (process.env.NODE_ENV === 'production') {
    logErrorToService(apiError, error);
  }

  return NextResponse.json(
    {
      error: apiError,
      success: false
    },
    { 
      status: apiError.statusCode,
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
}

// Log errors to external service (placeholder)
function logErrorToService(apiError: APIError, originalError: unknown) {
  // In production, send to error tracking service
  const errorLog = {
    ...apiError,
    originalError: originalError instanceof Error ? {
      name: originalError.name,
      message: originalError.message,
      stack: originalError.stack
    } : originalError,
    environment: process.env.NODE_ENV,
    userAgent: 'server-side',
    timestamp: new Date().toISOString()
  };

  // Example: Send to external service
  // await fetch('https://api.errortracking.com/errors', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(errorLog)
  // });

  console.error('Error logged to service:', errorLog);
}

// Async error wrapper for API routes
export function asyncHandler(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleAPIError(error, request);
    }
  };
}

// Client-side error handler
export function handleClientError(error: unknown, context?: string): void {
  console.error(`Client Error${context ? ` (${context})` : ''}:`, error);

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    const errorData = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // Send to error tracking service
    // fetch('/api/client-errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // }).catch(console.error);
  }
}

// Form validation helper
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    !data[field] || (typeof data[field] === 'string' && !data[field].trim())
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitMap.delete(key);
    }
  }

  const current = rateLimitMap.get(identifier);
  
  if (!current) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now });
    return true;
  }

  if (current.resetTime < windowStart) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}
