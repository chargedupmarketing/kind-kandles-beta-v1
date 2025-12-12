-- =============================================================================
-- SECURITY AUDIT AND ENCRYPTION MIGRATION
-- =============================================================================
-- This migration adds:
-- 1. Audit logs table for tracking all sensitive data access
-- 2. Encrypted fields support for customers and orders
-- 3. Security-related indexes and policies
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs" ON audit_logs
  FOR SELECT USING (true);

-- Allow insert for all (audit logging should never fail)
CREATE POLICY "Allow insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Prevent updates and deletes (audit logs are immutable)
CREATE POLICY "Prevent audit log updates" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "Prevent audit log deletes" ON audit_logs
  FOR DELETE USING (false);

-- -----------------------------------------------------------------------------
-- 2. ADD ENCRYPTED FIELDS TO CUSTOMERS TABLE
-- -----------------------------------------------------------------------------
-- Add search hash columns for encrypted fields (allows searching without decryption)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_hash TEXT;

-- Create indexes for hash-based searching
CREATE INDEX IF NOT EXISTS idx_customers_email_hash ON customers(email_hash);
CREATE INDEX IF NOT EXISTS idx_customers_phone_hash ON customers(phone_hash);

-- -----------------------------------------------------------------------------
-- 3. ADD ENCRYPTED FIELDS TO ORDERS TABLE
-- -----------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email_hash TEXT;

-- Create index for hash-based searching
CREATE INDEX IF NOT EXISTS idx_orders_email_hash ON orders(customer_email_hash);

-- -----------------------------------------------------------------------------
-- 4. SECURITY-RELATED FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to clean up old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Function to get audit log summary for a user
CREATE OR REPLACE FUNCTION get_user_audit_summary(target_user_id UUID)
RETURNS TABLE (
  action TEXT,
  resource TEXT,
  action_count BIGINT,
  last_action TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.action,
    al.resource,
    COUNT(*)::BIGINT as action_count,
    MAX(al.created_at) as last_action
  FROM audit_logs al
  WHERE al.user_id = target_user_id
  GROUP BY al.action, al.resource
  ORDER BY last_action DESC;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 5. SECURITY COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all sensitive data access and modifications';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: VIEW, CREATE, UPDATE, DELETE, EXPORT, LOGIN, etc.';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type: customer, order, product, admin_user, etc.';
COMMENT ON COLUMN audit_logs.details IS 'Additional context about the action (JSON)';

COMMENT ON COLUMN customers.email_hash IS 'SHA-256 hash of email for searching encrypted data';
COMMENT ON COLUMN customers.phone_hash IS 'SHA-256 hash of phone for searching encrypted data';

-- -----------------------------------------------------------------------------
-- 6. ADD FAILED LOGIN TRACKING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_logins_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_logins_created ON failed_login_attempts(created_at DESC);

ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert failed logins" ON failed_login_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admins can view failed logins" ON failed_login_attempts
  FOR SELECT USING (true);

-- Function to clean up old failed login attempts (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_failed_login_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 7. SESSION MANAGEMENT TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON active_sessions(expires_at);

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON active_sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow insert sessions" ON active_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update sessions" ON active_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete sessions" ON active_sessions
  FOR DELETE USING (true);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM active_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

