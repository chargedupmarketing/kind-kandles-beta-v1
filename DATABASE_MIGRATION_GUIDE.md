# Database Migration Guide - User Management Update

## Issue
The user management system requires the `sub_levels` column in the `admin_users` table, but it doesn't exist in the current database schema.

**Error Message:**
```
Could not find the 'sub_levels' column of 'admin_users' in the schema cache
```

## Solution
Run the migration script to add the missing column and update the role constraint.

---

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration Script**
   - Copy the contents of `supabase/migrations/20260104_update_admin_users_schema.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**
   - You should see a success message
   - The query results will show the updated columns

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project root
cd /path/to/website-custom

# Run the migration
supabase db push

# Or run the specific migration file
supabase db execute -f supabase/migrations/20260104_update_admin_users_schema.sql
```

---

## What This Migration Does

### 1. Adds `sub_levels` Column
```sql
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS sub_levels TEXT[] DEFAULT '{}';
```
- **Type**: `TEXT[]` (array of text/strings)
- **Default**: Empty array `{}`
- **Purpose**: Store team/sub-level IDs that a user belongs to

### 2. Creates Index
```sql
CREATE INDEX IF NOT EXISTS idx_admin_users_sub_levels 
ON admin_users USING GIN (sub_levels);
```
- **Purpose**: Improve query performance when searching by sub-levels
- **Type**: GIN index (optimized for array operations)

### 3. Updates Role Constraint
```sql
ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN ('user', 'admin', 'super_admin', 'editor'));
```
- **Purpose**: Allow all four role types
- **Roles**:
  - `user`: View-only access
  - `admin`: Store management access
  - `super_admin`: Full system access
  - `editor`: Content management (legacy)

### 4. Initializes Existing Records
```sql
UPDATE admin_users 
SET sub_levels = '{}' 
WHERE sub_levels IS NULL;
```
- **Purpose**: Ensure all existing users have an empty array instead of NULL

---

## Verification

After running the migration, verify it worked:

### Check Column Exists
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
  AND column_name = 'sub_levels';
```

**Expected Result:**
| column_name | data_type | column_default |
|-------------|-----------|----------------|
| sub_levels  | ARRAY     | '{}'::text[]   |

### Check Existing Users
```sql
SELECT id, email, role, sub_levels 
FROM admin_users 
LIMIT 5;
```

**Expected Result:**
All users should have `sub_levels` as an empty array `{}` or with team IDs.

### Test User Update
```sql
-- Test updating a user's sub_levels
UPDATE admin_users 
SET sub_levels = ARRAY['team-id-1', 'team-id-2']
WHERE email = 'test@example.com';

-- Verify the update
SELECT email, sub_levels 
FROM admin_users 
WHERE email = 'test@example.com';
```

---

## Rollback (If Needed)

If you need to undo this migration:

```sql
-- Remove the sub_levels column
ALTER TABLE admin_users DROP COLUMN IF EXISTS sub_levels;

-- Drop the index
DROP INDEX IF EXISTS idx_admin_users_sub_levels;

-- Revert role constraint (if needed)
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users 
ADD CONSTRAINT admin_users_role_check 
CHECK (role IN ('admin', 'super_admin', 'editor'));
```

---

## Troubleshooting

### Error: "permission denied for table admin_users"
**Solution**: Make sure you're running the query with sufficient permissions (service role or postgres role).

### Error: "column sub_levels already exists"
**Solution**: The migration has already been run. Check if the column exists:
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'admin_users' AND column_name = 'sub_levels';
```

### Error: "constraint admin_users_role_check already exists"
**Solution**: The constraint already exists. You can skip that part or drop it first:
```sql
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
```

### Sub-levels Not Saving
**Problem**: Updates to sub_levels don't persist
**Check**:
1. Verify the column exists: `\d admin_users` (in psql)
2. Check RLS policies aren't blocking updates
3. Verify the API is sending the correct data format

---

## After Migration

Once the migration is complete:

1. ✅ **Test User Editing** - Try editing a user in the admin panel
2. ✅ **Assign Teams** - Test assigning teams to users
3. ✅ **Verify Persistence** - Refresh the page and verify teams are still assigned
4. ✅ **Check Logs** - Monitor for any errors in the browser console or server logs

---

## Related Files

- **Migration Script**: `supabase/migrations/20260104_update_admin_users_schema.sql`
- **API Route**: `src/app/api/admin/users/[id]/route.ts`
- **Component**: `src/components/admin/UserManagement.tsx`
- **Documentation**: `USER_MANAGEMENT_GUIDE.md`

---

## Support

If you encounter issues:

1. Check the Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you have the correct permissions
4. Check the browser console for client-side errors

