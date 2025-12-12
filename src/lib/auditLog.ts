/**
 * Audit Logging System
 * 
 * Tracks all sensitive data access and modifications for security compliance.
 */

import { createServerClient, isSupabaseConfigured } from './supabase';

export type AuditAction = 
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'SETTINGS_CHANGE'
  | 'DATA_EXPORT'
  | 'DATA_WIPE';

export type AuditResource = 
  | 'customer'
  | 'order'
  | 'product'
  | 'discount'
  | 'admin_user'
  | 'settings'
  | 'email_template'
  | 'survey'
  | 'database';

export interface AuditLogEntry {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));
  }

  // Log to database if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createServerClient();
      
      await supabase.from('audit_logs').insert({
        action: logEntry.action,
        resource: logEntry.resource,
        resource_id: logEntry.resourceId,
        user_id: logEntry.userId,
        user_email: logEntry.userEmail,
        user_role: logEntry.userRole,
        ip_address: logEntry.ipAddress,
        user_agent: logEntry.userAgent,
        details: logEntry.details,
        created_at: logEntry.timestamp,
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to write audit log:', error);
    }
  }
}

/**
 * Extract user info from request for audit logging
 */
export function extractRequestInfo(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}

/**
 * Create audit logger with pre-filled user context
 */
export function createAuditLogger(userContext: {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return {
    log: async (
      action: AuditAction,
      resource: AuditResource,
      resourceId?: string,
      details?: Record<string, any>
    ) => {
      await logAuditEvent({
        action,
        resource,
        resourceId,
        details,
        ...userContext,
      });
    },
    
    // Convenience methods
    view: (resource: AuditResource, resourceId?: string, details?: Record<string, any>) =>
      logAuditEvent({ action: 'VIEW', resource, resourceId, details, ...userContext }),
    
    create: (resource: AuditResource, resourceId?: string, details?: Record<string, any>) =>
      logAuditEvent({ action: 'CREATE', resource, resourceId, details, ...userContext }),
    
    update: (resource: AuditResource, resourceId?: string, details?: Record<string, any>) =>
      logAuditEvent({ action: 'UPDATE', resource, resourceId, details, ...userContext }),
    
    delete: (resource: AuditResource, resourceId?: string, details?: Record<string, any>) =>
      logAuditEvent({ action: 'DELETE', resource, resourceId, details, ...userContext }),
    
    export: (resource: AuditResource, details?: Record<string, any>) =>
      logAuditEvent({ action: 'EXPORT', resource, details, ...userContext }),
  };
}

/**
 * Log sensitive data access (for compliance)
 */
export async function logSensitiveAccess(
  userId: string,
  userEmail: string,
  resource: AuditResource,
  resourceId: string,
  accessedFields: string[],
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action: 'VIEW',
    resource,
    resourceId,
    userId,
    userEmail,
    ipAddress,
    details: {
      accessedFields,
      sensitiveAccess: true,
    },
  });
}

/**
 * Log data export for compliance
 */
export async function logDataExport(
  userId: string,
  userEmail: string,
  resource: AuditResource,
  recordCount: number,
  format: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action: 'DATA_EXPORT',
    resource,
    userId,
    userEmail,
    ipAddress,
    details: {
      recordCount,
      format,
      exportedAt: new Date().toISOString(),
    },
  });
}

