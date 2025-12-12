-- Authentication System Upgrade Migration
-- Adds 2FA support, role hierarchy, and sub-levels

-- 1. Create user_sub_levels table (stores available teams/sub-levels)
CREATE TABLE IF NOT EXISTS user_sub_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_system BOOLEAN DEFAULT FALSE -- System sub-levels cannot be deleted
);

-- 2. Create user_sub_level_assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_sub_level_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    sub_level_id UUID NOT NULL REFERENCES user_sub_levels(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sub_level_id)
);

-- 3. Create two_factor_codes table (temporary OTP storage)
CREATE TABLE IF NOT EXISTS two_factor_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update admin_users table - add new columns
-- First check if columns exist before adding
DO $$ 
BEGIN
    -- Add role column if it doesn't exist or update its type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'role') THEN
        ALTER TABLE admin_users ADD COLUMN role VARCHAR(20) DEFAULT 'admin';
    END IF;
    
    -- Add two_factor_enabled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_users' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE admin_users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_id ON two_factor_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expires_at ON two_factor_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sub_level_assignments_user_id ON user_sub_level_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sub_level_assignments_sub_level_id ON user_sub_level_assignments(sub_level_id);

-- 6. Insert system sub-levels (cannot be deleted)
INSERT INTO user_sub_levels (name, slug, description, is_system, created_at)
VALUES 
    ('Kind Kandles', 'kind-kandles', 'Kind Kandles team members', TRUE, NOW()),
    ('ChargedUp - Marketing Team', 'chargedup-marketing', 'ChargedUp Marketing team members', TRUE, NOW()),
    ('Developer', 'developer', 'Developers with extended access', TRUE, NOW())
ON CONFLICT (slug) DO NOTHING;

-- 7. Create function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM two_factor_codes WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Add check constraint for valid roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'admin_users_role_check'
    ) THEN
        ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
        CHECK (role IN ('user', 'admin', 'super_admin'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 9. Update existing admin users to have valid role
UPDATE admin_users SET role = 'admin' WHERE role IS NULL OR role NOT IN ('user', 'admin', 'super_admin');

