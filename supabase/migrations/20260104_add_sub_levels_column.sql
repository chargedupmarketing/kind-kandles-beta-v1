-- =====================================================
-- Add sub_levels column to admin_users table
-- Migration: 2026-01-04
-- =====================================================

-- Add sub_levels column to store team/sub-level assignments
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS sub_levels TEXT[] DEFAULT '{}';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_sub_levels ON admin_users USING GIN (sub_levels);

-- Add comment for documentation
COMMENT ON COLUMN admin_users.sub_levels IS 'Array of sub-level/team IDs that the user belongs to';

-- Update existing users to have empty array if null
UPDATE admin_users 
SET sub_levels = '{}' 
WHERE sub_levels IS NULL;

