-- Fix RLS policies for admin_users and related tables
-- Run this in Supabase SQL Editor

-- Option 1: Disable RLS on admin_users (simpler, since this is an internal admin table)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Option 2 (Alternative): If you want to keep RLS enabled, create permissive policies
-- Uncomment the below if you prefer to keep RLS enabled:

/*
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Allow insert for service role" ON admin_users;
DROP POLICY IF EXISTS "Allow update for service role" ON admin_users;
DROP POLICY IF EXISTS "Allow delete for service role" ON admin_users;
DROP POLICY IF EXISTS "Allow select for service role" ON admin_users;

-- Create policies that allow the service role (used by your app) to perform all operations
CREATE POLICY "Allow all for service role" ON admin_users
    FOR ALL
    USING (true)
    WITH CHECK (true);
*/

-- Also disable RLS on the new auth tables (they're internal admin tables)
ALTER TABLE IF EXISTS user_sub_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sub_level_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS two_factor_codes DISABLE ROW LEVEL SECURITY;

-- If the tables have RLS enabled, this ensures the service role can access them
-- Grant permissions to service role
GRANT ALL ON admin_users TO service_role;
GRANT ALL ON user_sub_levels TO service_role;
GRANT ALL ON user_sub_level_assignments TO service_role;
GRANT ALL ON two_factor_codes TO service_role;

