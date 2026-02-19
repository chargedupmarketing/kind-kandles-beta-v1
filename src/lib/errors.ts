/**
 * Consolidated Error Handling Module
 * Provides standardized error classes, API response helpers, and validation utilities
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Error Classes
// ============================================================================

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
  constructor(message: string = 'Too many requests', resetTime?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, { resetTime });
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

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR', true);
  }
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  path?: string;
}

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

// ============================================================================
// API Response Helpers
// ============================================================================

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

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Handle API errors and return standardized response
 */
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

  // Log error for monitoring
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

/**
 * Log errors to external service (placeholder for production)
 */
function logErrorToService(apiError: APIError, originalError: unknown) {
  const errorLog = {
    ...apiError,
    originalError: originalError instanceof Error ? {
      name: originalError.name,
      message: originalError.message,
      stack: originalError.stack
    } : originalError,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  // In production, send to error tracking service (e.g., Sentry, LogRocket)
  console.error('Error logged:', JSON.stringify(errorLog, null, 2));
}

/**
 * Async error wrapper for API routes
 */
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

/**
 * Error handling wrapper with automatic error classification
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      // Handle AppError subclasses
      if (error instanceof AppError) {
        return createErrorResponse(
          error.message,
          error.statusCode,
          error.code,
          error.details
        );
      }

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

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate required fields in request body
 */
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

/**
 * Validate request body exists and has required fields
 */
export function validateRequestBody(body: any, requiredFields: string[]): void {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body is required');
  }

  validateRequired(body, requiredFields);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Sanitization Utilities
// ============================================================================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, maxLength);
}

/**
 * Sanitize object values recursively
 */
export function sanitizeObject(obj: Record<string, any>, maxLength: number = 1000): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value, maxLength);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, maxLength);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for an identifier
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < windowStart) {
        rateLimitStore.delete(key);
      }
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

/**
 * Enforce rate limit and throw error if exceeded
 */
export function enforceRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): void {
  const result = checkRateLimit(identifier, maxRequests, windowMs);
  if (!result.allowed) {
    throw new RateLimitError('Too many requests, please try again later', result.resetTime);
  }
}

// ============================================================================
// Request Utilities
// ============================================================================

/**
 * Get client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

// ============================================================================
// Client-side Error Handler
// ============================================================================

/**
 * Handle client-side errors
 */
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

    // Send to error tracking service (implement as needed)
    console.error('Client error logged:', errorData);
  }
}

// ============================================================================
// Validation Schema System
// ============================================================================

export type ValidatorFn = (value: any, fieldName: string) => string | null;

export interface FieldSchema {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'phone' | 'url' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
  custom?: ValidatorFn;
  arrayItemSchema?: FieldSchema;
}

export interface ValidationSchema {
  [fieldName: string]: FieldSchema;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

/**
 * Validate data against a schema
 */
export function validateSchema(
  data: Record<string, any>,
  schema: ValidationSchema
): ValidationResult {
  const errors: Record<string, string> = {};
  const sanitizedData: Record<string, any> = {};

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = data[fieldName];
    
    // Check required
    if (fieldSchema.required) {
      if (value === undefined || value === null || value === '') {
        errors[fieldName] = `${fieldName} is required`;
        continue;
      }
    } else if (value === undefined || value === null || value === '') {
      // Optional field with no value - skip validation
      sanitizedData[fieldName] = value;
      continue;
    }

    // Type validation
    if (fieldSchema.type) {
      const typeError = validateFieldType(value, fieldSchema.type, fieldName);
      if (typeError) {
        errors[fieldName] = typeError;
        continue;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors[fieldName] = `${fieldName} must be at least ${fieldSchema.minLength} characters`;
        continue;
      }
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors[fieldName] = `${fieldName} must be at most ${fieldSchema.maxLength} characters`;
        continue;
      }
      if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
        errors[fieldName] = fieldSchema.patternMessage || `${fieldName} has invalid format`;
        continue;
      }
      // Sanitize string
      sanitizedData[fieldName] = sanitizeInput(value, fieldSchema.maxLength || 1000);
    } else {
      sanitizedData[fieldName] = value;
    }

    // Number validations
    if (typeof value === 'number') {
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        errors[fieldName] = `${fieldName} must be at least ${fieldSchema.min}`;
        continue;
      }
      if (fieldSchema.max !== undefined && value > fieldSchema.max) {
        errors[fieldName] = `${fieldName} must be at most ${fieldSchema.max}`;
        continue;
      }
    }

    // Array validations
    if (Array.isArray(value) && fieldSchema.arrayItemSchema) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = validateSchema(
          { item: value[i] },
          { item: fieldSchema.arrayItemSchema }
        );
        if (!itemResult.isValid) {
          errors[`${fieldName}[${i}]`] = Object.values(itemResult.errors)[0];
        }
      }
    }

    // Custom validation
    if (fieldSchema.custom) {
      const customError = fieldSchema.custom(value, fieldName);
      if (customError) {
        errors[fieldName] = customError;
        continue;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
}

function validateFieldType(value: any, type: string, fieldName: string): string | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') return `${fieldName} must be a string`;
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) return `${fieldName} must be a number`;
      break;
    case 'boolean':
      if (typeof value !== 'boolean') return `${fieldName} must be a boolean`;
      break;
    case 'array':
      if (!Array.isArray(value)) return `${fieldName} must be an array`;
      break;
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) 
        return `${fieldName} must be an object`;
      break;
    case 'email':
      if (!validateEmail(value)) return `${fieldName} must be a valid email`;
      break;
    case 'phone':
      if (!validatePhone(value)) return `${fieldName} must be a valid phone number`;
      break;
    case 'url':
      if (!validateURL(value)) return `${fieldName} must be a valid URL`;
      break;
    case 'date':
      if (isNaN(Date.parse(value))) return `${fieldName} must be a valid date`;
      break;
  }
  return null;
}

// Pre-built validation schemas for common forms
export const CommonSchemas = {
  // Shipping address schema
  shippingAddress: {
    firstName: { required: true, type: 'string' as const, minLength: 1, maxLength: 50 },
    lastName: { required: true, type: 'string' as const, minLength: 1, maxLength: 50 },
    address1: { required: true, type: 'string' as const, minLength: 5, maxLength: 200 },
    address2: { type: 'string' as const, maxLength: 200 },
    city: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    state: { 
      required: true, 
      type: 'string' as const, 
      pattern: /^[A-Z]{2}$/,
      patternMessage: 'State must be a 2-letter code (e.g., CA, NY)'
    },
    postalCode: { 
      required: true, 
      type: 'string' as const,
      pattern: /^\d{5}(-\d{4})?$/,
      patternMessage: 'Postal code must be 5 digits or 5+4 format'
    },
    country: { required: true, type: 'string' as const, minLength: 2, maxLength: 50 },
    phone: { type: 'phone' as const }
  },

  // Contact form schema
  contactForm: {
    name: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    email: { required: true, type: 'email' as const },
    subject: { required: true, type: 'string' as const, minLength: 5, maxLength: 200 },
    message: { required: true, type: 'string' as const, minLength: 10, maxLength: 5000 }
  },

  // Product schema
  product: {
    title: { required: true, type: 'string' as const, minLength: 2, maxLength: 200 },
    description: { type: 'string' as const, maxLength: 5000 },
    price: { required: true, type: 'number' as const, min: 0 },
    compareAtPrice: { type: 'number' as const, min: 0 },
    sku: { type: 'string' as const, maxLength: 50 },
    inventory: { type: 'number' as const, min: 0 },
    category: { type: 'string' as const, maxLength: 100 }
  },

  // Order item schema
  orderItem: {
    productId: { required: true, type: 'string' as const },
    title: { required: true, type: 'string' as const },
    quantity: { required: true, type: 'number' as const, min: 1, max: 100 },
    price: { required: true, type: 'number' as const, min: 0 }
  },

  // User registration schema
  userRegistration: {
    email: { required: true, type: 'email' as const },
    password: { 
      required: true, 
      type: 'string' as const, 
      minLength: 8, 
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      patternMessage: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    },
    firstName: { required: true, type: 'string' as const, minLength: 1, maxLength: 50 },
    lastName: { required: true, type: 'string' as const, minLength: 1, maxLength: 50 }
  }
};

/**
 * Validate and throw if invalid
 */
export function validateOrThrow(
  data: Record<string, any>,
  schema: ValidationSchema,
  errorMessage?: string
): Record<string, any> {
  const result = validateSchema(data, schema);
  
  if (!result.isValid) {
    const firstError = Object.values(result.errors)[0];
    throw new ValidationError(
      errorMessage || firstError,
      { errors: result.errors }
    );
  }
  
  return result.sanitizedData;
}

// ============================================================================
// Retry Utility
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    shouldRetry = () => true
  } = options;

  let lastError: unknown;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${currentDelay}ms...`, error);
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}
