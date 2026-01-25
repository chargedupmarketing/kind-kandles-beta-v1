# Database Migration Instructions - Event System

## ⚠️ IMPORTANT: Run These Migrations to Enable Event System

The event system requires database tables that haven't been created yet. You're seeing these errors because the tables don't exist:

```
Could not find the table 'public.events' in the schema cache
Could not find the table 'public.event_bookings' in the schema cache
```

## How to Run the Migrations

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **Kind Kandles & Boutique**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Main Events System Migration

1. Open the file: `supabase/migrations/20260118_events_system.sql`
2. Copy the **entire contents** of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for confirmation: "Success. No rows returned"

This will create:
- ✅ 5 new tables (`events`, `event_occurrences`, `event_bookings`, `event_categories`, `event_category_mappings`)
- ✅ All necessary indexes
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for `updated_at` timestamps
- ✅ Default event categories

### Step 3: Run the Enum Update Migration

1. Open the file: `supabase/migrations/20260125_update_events_enums.sql`
2. Copy the **entire contents** of the file
3. Paste it into a new query in the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for confirmation: "Success. No rows returned"

This will:
- ✅ Add `'no_show'` to `booking_status` enum
- ✅ Update `payment_status` enum values to match the TypeScript implementation
- ✅ Migrate any existing data (if any)

## Verification

After running both migrations, verify the tables exist:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'event%'
ORDER BY table_name;
```

You should see:
- `event_bookings`
- `event_categories`
- `event_category_mappings`
- `event_occurrences`
- `events`

## What Happens After Migration

Once the migrations are complete:

1. **Admin Panel** - Event management sections will work:
   - Navigate to Admin → Events → All Events
   - Create your first event
   - Add event occurrences
   - View bookings

2. **Public Pages** - Event pages will load:
   - `/events` - Will show "No Events Available Yet" (until you create one)
   - `/events/[slug]` - Will show individual event details

3. **Booking System** - Customers can:
   - Browse events
   - View event details
   - Submit booking requests
   - Receive confirmation emails

## Troubleshooting

### Error: "type X already exists"
This means you've already run part of the migration. You can either:
- Skip that specific CREATE TYPE statement
- Or run: `DROP TYPE X CASCADE;` first (⚠️ be careful with CASCADE)

### Error: "relation X already exists"
The table already exists. You can either:
- Skip that CREATE TABLE statement
- Or verify the table structure matches what's expected

### Error: "permission denied"
Make sure you're logged in as a database admin/owner in Supabase.

### Still Getting "table not found" Errors
1. Verify the migrations ran successfully (check for error messages)
2. Refresh your browser cache (Ctrl+Shift+R)
3. Restart your Next.js development server
4. Check Supabase logs for any RLS policy issues

## Migration Files Location

Both migration files are located in:
```
supabase/migrations/
├── 20260118_events_system.sql       ← Run this FIRST
└── 20260125_update_events_enums.sql ← Run this SECOND
```

## Need Help?

If you encounter any issues:
1. Check the Supabase SQL Editor for error messages
2. Review the error details in the Supabase logs
3. Verify your database user has sufficient permissions
4. Make sure you're running the migrations in the correct order

## After Successful Migration

You can now:
1. ✅ Create events in the admin panel
2. ✅ Schedule event occurrences
3. ✅ Accept customer bookings
4. ✅ Manage bookings and payments
5. ✅ View event analytics

The event system is fully functional once these migrations are complete!
