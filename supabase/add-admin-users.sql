-- =====================================================
-- ADMIN USERS TABLE
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'editor')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access admin_users
CREATE POLICY "Service role full access admin_users" ON admin_users FOR ALL USING (auth.role() = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin (you should change this!)
-- Note: This is using a simple hash for demo purposes.
-- In production, use proper bcrypt hashing.
-- =====================================================
INSERT INTO admin_users (email, password_hash, first_name, last_name, role)
VALUES (
  'admin@kindkandlesboutique.com',
  'admin', -- Plain text for now - will be hashed by the app
  'Admin',
  'User',
  'super_admin'
)
ON CONFLICT (email) DO NOTHING;

-- You can also add your personal admin account:
-- INSERT INTO admin_users (email, password_hash, first_name, last_name, role)
-- VALUES (
--   'your-email@example.com',
--   'your-password',
--   'Your',
--   'Name',
--   'super_admin'
-- )
-- ON CONFLICT (email) DO NOTHING;

