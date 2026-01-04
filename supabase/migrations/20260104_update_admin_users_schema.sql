-- =====================================================
-- Update admin_users table schema
-- Migration: 2026-01-04
-- Adds sub_levels column and updates role constraint
-- =====================================================

-- Add sub_levels column to store team/sub-level assignments
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS sub_levels TEXT[] DEFAULT '{}';

-- Add index for better query performance on sub_levels
CREATE INDEX IF NOT EXISTS idx_admin_users_sub_levels ON admin_users USING GIN (sub_levels);

-- Update role constraint to include 'user' role
-- First drop the old constraint
ALTER TABLE admin_users 
DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Add new constraint with all three roles
ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN ('user', 'admin', 'super_admin', 'editor'));

-- Add comments for documentation
COMMENT ON COLUMN admin_users.sub_levels IS 'Array of sub-level/team IDs that the user belongs to';
COMMENT ON COLUMN admin_users.role IS 'User role: user (view only), admin (store access), super_admin (full access), editor (content management)';

-- Update existing users to have empty array if null
UPDATE admin_users 
SET sub_levels = '{}' 
WHERE sub_levels IS NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
  AND column_name IN ('sub_levels', 'role')
ORDER BY ordinal_position;

