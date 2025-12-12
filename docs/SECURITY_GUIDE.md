# Security Guide for Kind Kandles Admin Panel

This document outlines the security measures implemented in the Kind Kandles admin panel and provides recommendations for maximizing data protection.

## Table of Contents

1. [Current Security Measures](#current-security-measures)
2. [Environment Variables Setup](#environment-variables-setup)
3. [Database Security (Supabase)](#database-security-supabase)
4. [Additional Security Recommendations](#additional-security-recommendations)
5. [Compliance Checklist](#compliance-checklist)

---

## Current Security Measures

### 1. Data Encryption (AES-256-GCM)

All sensitive customer data is encrypted at rest using industry-standard AES-256-GCM encryption:

- **Customer emails**
- **Phone numbers**
- **Names**
- **Shipping addresses**

**Files:**
- `src/lib/encryption.ts` - Encryption utilities

### 2. Authentication & Authorization

- **2-Factor Authentication (2FA)** - Email-based OTP codes
- **Trusted Device Memory** - 30-day device recognition
- **Role-Based Access Control (RBAC)**:
  - `super_admin` - Full access
  - `admin` - Most features, no user management
  - `user` - Limited access
- **Sub-levels/Teams** - Additional permission granularity

### 3. Security Headers

All responses include these security headers:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
Content-Security-Policy: [strict policy for admin pages]
```

### 4. Rate Limiting

- **API Routes**: 100 requests per minute per IP
- **Authentication Routes**: 10 requests per minute per IP
- Automatic lockout after exceeded limits

### 5. Audit Logging

All sensitive operations are logged:

- Data views (who accessed what)
- Create/Update/Delete operations
- Login attempts (successful and failed)
- Data exports
- Settings changes

**Files:**
- `src/lib/auditLog.ts` - Audit logging utilities
- Database table: `audit_logs`

### 6. Session Management

- JWT tokens with configurable expiration
- Secure, httpOnly cookies
- Session tracking in database
- Automatic cleanup of expired sessions

---

## Environment Variables Setup

Add these to your Vercel environment variables:

### Required for Encryption

```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-character-hex-key-here

# Used for searchable hashes of encrypted data
SEARCH_HASH_SALT=your-unique-salt-for-search-hashes
```

### Required for Authentication

```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-secure-jwt-secret-at-least-32-chars

# Session timeout (1 hour default)
SESSION_TIMEOUT_MS=3600000
```

### Required for 2FA Email

```bash
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=Kind Kandles <noreply@kindkandlesboutique.com>
```

### Generate Secure Keys

Run this in your terminal to generate secure keys:

```bash
# For ENCRYPTION_KEY (64 hex characters = 32 bytes)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# For JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# For SEARCH_HASH_SALT
node -e "console.log('SEARCH_HASH_SALT=' + require('crypto').randomBytes(16).toString('hex'))"
```

---

## Database Security (Supabase)

### 1. Row Level Security (RLS)

Ensure RLS is enabled on ALL tables:

```sql
-- Check which tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS on a table
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### 2. Recommended RLS Policies

```sql
-- Example: Only allow authenticated service role to access customers
CREATE POLICY "Service role only" ON customers
  FOR ALL USING (auth.role() = 'service_role');

-- Example: Audit logs are append-only
CREATE POLICY "Prevent audit log modifications" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "Prevent audit log deletions" ON audit_logs
  FOR DELETE USING (false);
```

### 3. API Key Security

- **NEVER expose the service role key** to the client
- Use the anon key for client-side operations
- The service role key should only be used server-side

```typescript
// ✅ CORRECT - Server-side only
export function createServerClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ❌ WRONG - Never do this
const client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY); // Client-side
```

### 4. Database Backup

Enable Point-in-Time Recovery (PITR) in Supabase:

1. Go to Supabase Dashboard → Settings → Database
2. Enable "Point in Time Recovery"
3. Set backup retention period (recommended: 7+ days)

### 5. Connection Security

- Supabase uses SSL by default
- Ensure your connection strings use `sslmode=require`

---

## Additional Security Recommendations

### 1. Vercel Security Settings

In your Vercel project settings:

1. **Enable Deployment Protection**
   - Settings → Security → Deployment Protection
   - Require authentication for preview deployments

2. **Environment Variable Security**
   - Mark sensitive variables as "Sensitive"
   - Use different values for Preview vs Production

3. **Enable Attack Challenge Mode** (if available)
   - Protects against DDoS and bot attacks

### 2. DNS Security (Cloudflare Recommended)

If using Cloudflare:

1. **Enable "Under Attack" mode** when needed
2. **Enable Bot Fight Mode**
3. **Set up WAF Rules**:
   ```
   - Block requests from known bad IPs
   - Rate limit login endpoints
   - Block SQL injection patterns
   ```

4. **Enable DNSSEC**

### 3. Domain Security

1. **Enable HSTS Preloading**
   - Submit to https://hstspreload.org/
   
2. **Set up CAA Records**
   ```
   kindkandlesboutique.com. CAA 0 issue "letsencrypt.org"
   kindkandlesboutique.com. CAA 0 issuewild ";"
   ```

### 4. Monitoring & Alerts

Set up monitoring for:

1. **Failed login attempts** - Alert after 5+ failures
2. **Unusual data access patterns** - Large exports, off-hours access
3. **API rate limit hits** - Potential attack indicator
4. **Error rate spikes** - Could indicate exploitation attempts

### 5. Regular Security Tasks

| Task | Frequency |
|------|-----------|
| Review audit logs | Weekly |
| Rotate API keys | Quarterly |
| Update dependencies | Monthly |
| Security scan (npm audit) | Weekly |
| Review user access | Monthly |
| Test backup restoration | Quarterly |

---

## Compliance Checklist

### PCI DSS (if handling payments)

- [x] Encrypt cardholder data at rest
- [x] Use strong cryptography (AES-256)
- [x] Implement access controls
- [x] Track and monitor all access
- [x] Regularly test security systems
- [ ] Maintain security policies (document yours)

### GDPR (if serving EU customers)

- [x] Encrypt personal data
- [x] Implement data access logging
- [ ] Provide data export functionality
- [ ] Implement data deletion on request
- [ ] Document data processing activities
- [ ] Obtain explicit consent for marketing

### CCPA (if serving California residents)

- [x] Know what data you collect
- [x] Secure personal information
- [ ] Provide opt-out mechanism
- [ ] Honor deletion requests
- [ ] Disclose data practices

---

## SQL Migrations to Run

Run these in your Supabase SQL Editor:

### 1. Trusted Devices Table (for 2FA)

```sql
-- From: supabase/migrations/20241212_trusted_devices.sql
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL DEFAULT 'Unknown Device',
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_token ON trusted_devices(device_token);
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on trusted_devices" ON trusted_devices FOR ALL USING (true);
```

### 2. Audit Logs Table

```sql
-- From: supabase/migrations/20241212_security_audit.sql
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs should be append-only
CREATE POLICY "Allow insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Prevent audit log updates" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "Prevent audit log deletes" ON audit_logs FOR DELETE USING (false);
```

### 3. Failed Login Tracking

```sql
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
CREATE POLICY "Allow insert failed logins" ON failed_login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select failed logins" ON failed_login_attempts FOR SELECT USING (true);
```

### 4. Add Search Hash Columns (for encrypted data search)

```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_email_hash ON customers(email_hash);
CREATE INDEX IF NOT EXISTS idx_customers_phone_hash ON customers(phone_hash);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_email_hash ON orders(customer_email_hash);
```

---

## Emergency Procedures

### If You Suspect a Data Breach

1. **Immediately rotate all API keys**
   - Supabase service role key
   - JWT secret
   - Encryption key (requires re-encrypting data)

2. **Review audit logs** for suspicious activity

3. **Revoke all active sessions**
   ```sql
   DELETE FROM active_sessions;
   DELETE FROM trusted_devices;
   ```

4. **Force password reset** for all admin users

5. **Notify affected parties** as required by law

### Key Rotation Procedure

1. Generate new keys
2. Update Vercel environment variables
3. Redeploy application
4. Verify functionality
5. Document the rotation

---

## Support

For security concerns or to report vulnerabilities:
- Email: security@kindkandlesboutique.com
- Do not publicly disclose vulnerabilities

---

*Last updated: December 2024*

