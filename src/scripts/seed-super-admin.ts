/**
 * Seed Script: Create Super Admin Account
 * 
 * Run this script to create the initial super admin account
 * Usage: npx ts-node src/scripts/seed-super-admin.ts
 * 
 * Or run via API endpoint: POST /api/admin/seed-super-admin (with secret key)
 */

import bcrypt from 'bcryptjs';

export interface SeedSuperAdminData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'super_admin';
  sub_levels: string[];
}

export const SUPER_ADMIN_SEED_DATA: SeedSuperAdminData = {
  email: 'dominic@chargedupmarketing.com',
  password: '73105121De!Dominic311$2005',
  first_name: 'Dominic',
  last_name: 'Engrassia',
  role: 'super_admin',
  sub_levels: ['chargedup-marketing', 'developer']
};

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function generateSeedSQL(): Promise<string> {
  const hashedPassword = await hashPassword(SUPER_ADMIN_SEED_DATA.password);
  
  return `
-- Seed Super Admin Account
-- Generated: ${new Date().toISOString()}

-- 1. Insert Super Admin user
INSERT INTO admin_users (email, password_hash, first_name, last_name, role, is_active, two_factor_enabled, created_at)
VALUES (
    '${SUPER_ADMIN_SEED_DATA.email}',
    '${hashedPassword}',
    '${SUPER_ADMIN_SEED_DATA.first_name}',
    '${SUPER_ADMIN_SEED_DATA.last_name}',
    'super_admin',
    TRUE,
    TRUE,
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'super_admin',
    is_active = TRUE,
    two_factor_enabled = TRUE;

-- 2. Get the user ID and sub-level IDs, then create assignments
DO $$
DECLARE
    v_user_id UUID;
    v_sub_level_id UUID;
BEGIN
    -- Get the super admin user ID
    SELECT id INTO v_user_id FROM admin_users WHERE email = '${SUPER_ADMIN_SEED_DATA.email}';
    
    -- Assign ChargedUp - Marketing Team sub-level
    SELECT id INTO v_sub_level_id FROM user_sub_levels WHERE slug = 'chargedup-marketing';
    IF v_sub_level_id IS NOT NULL THEN
        INSERT INTO user_sub_level_assignments (user_id, sub_level_id, assigned_at)
        VALUES (v_user_id, v_sub_level_id, NOW())
        ON CONFLICT (user_id, sub_level_id) DO NOTHING;
    END IF;
    
    -- Assign Developer sub-level
    SELECT id INTO v_sub_level_id FROM user_sub_levels WHERE slug = 'developer';
    IF v_sub_level_id IS NOT NULL THEN
        INSERT INTO user_sub_level_assignments (user_id, sub_level_id, assigned_at)
        VALUES (v_user_id, v_sub_level_id, NOW())
        ON CONFLICT (user_id, sub_level_id) DO NOTHING;
    END IF;
END $$;
`;
}

// If running directly
if (require.main === module) {
  generateSeedSQL().then(sql => {
    console.log('Generated SQL:');
    console.log(sql);
  });
}

