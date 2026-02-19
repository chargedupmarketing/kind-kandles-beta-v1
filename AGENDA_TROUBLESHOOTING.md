# Team Agenda - Troubleshooting Guide

## Error: "Failed to load agenda items"

This error appears when the Team Agenda page tries to load but encounters a database issue.

### Solution Steps

#### Step 1: Run the Database Migration

The enhanced agenda features require new database tables. You need to run the migration:

1. **Open Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Open the file: `supabase/migrations/agenda_schema_enhanced.sql`
   - Copy ALL the contents (600+ lines)
   - Paste into the SQL Editor
   - Click **"Run"** button

4. **Verify Tables Created**
   Run this query to verify:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name LIKE 'agenda%'
   ORDER BY table_name;
   ```

   You should see these tables:
   - `agenda_items` (existing, now enhanced)
   - `agenda_activity_log`
   - `agenda_attachments`
   - `agenda_comments` (existing)
   - `agenda_dependencies`
   - `agenda_item_tags`
   - `agenda_subtasks`
   - `agenda_tags`
   - `agenda_time_logs`
   - `agenda_watchers`

#### Step 2: Restart Your Development Server

After running the migration:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

#### Step 3: Clear Browser Cache

Sometimes the browser caches old API responses:

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or use incognito/private mode to test.

---

## Error: "column au_assigned.name does not exist"

This error occurs if you tried to run the migration before the fix was applied.

### Solution

1. **Drop the old view** (if it exists):
   ```sql
   DROP VIEW IF EXISTS agenda_items_detailed;
   ```

2. **Run the updated migration**:
   - Use the latest `agenda_schema_enhanced.sql` file
   - It now uses `COALESCE(full_name, name, email)` to handle different column names

---

## Error: "relation 'agenda_subtasks' does not exist"

This means the migration hasn't been run yet, but the API is trying to query the new tables.

### Solution

**Good news!** The API has been updated to handle this gracefully. It will:
1. Try to query with enhanced fields
2. Fall back to basic fields if new tables don't exist
3. Still work with the original schema

**To get full functionality:**
- Run the migration (see Step 1 above)

---

## Error: "Database not configured"

This means Supabase credentials are missing or incorrect.

### Solution

1. **Check `.env.local` file** exists in project root

2. **Verify it contains**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Get credentials from Supabase**:
   - Dashboard → Settings → API
   - Copy URL and keys

4. **Restart server** after updating `.env.local`

---

## Items Load But Features Don't Work

If items load but advanced features (subtasks, time tracking, etc.) don't work:

### Checklist

- [ ] Migration run successfully?
- [ ] All tables created? (verify with query above)
- [ ] Server restarted after migration?
- [ ] Browser cache cleared?

### Verify Specific Features

**Test Subtasks:**
```sql
-- Should return empty result, not error
SELECT * FROM agenda_subtasks LIMIT 1;
```

**Test Tags:**
```sql
-- Should return empty result, not error
SELECT * FROM agenda_tags LIMIT 1;
```

**Test Time Logs:**
```sql
-- Should return empty result, not error
SELECT * FROM agenda_time_logs LIMIT 1;
```

If any query returns an error, the table doesn't exist. Re-run the migration.

---

## Statistics Show Zero

If the dashboard shows all zeros:

### Causes
1. No agenda items created yet (expected)
2. Migration not run (tables don't exist)
3. RLS policies blocking access

### Solution

**Create a test item:**
1. Click "New Item"
2. Fill in title: "Test Item"
3. Click "Create Item"
4. Statistics should update

**Check RLS policies:**
```sql
-- Verify you can see items
SELECT COUNT(*) FROM agenda_items;
```

If this returns 0 but you created items, check RLS policies.

---

## Can't Create Items

If the "Create Item" button doesn't work:

### Debug Steps

1. **Open Browser Console** (F12 → Console tab)
2. **Click "New Item"**
3. **Look for errors**

Common errors:

**"Not authenticated"**
- Solution: Log out and log back in

**"Title is required"**
- Solution: Fill in the title field

**"Failed to create agenda item"**
- Check console for detailed error
- Verify database connection

---

## Timers Don't Start

If clicking the play button doesn't start a timer:

### Causes
1. `agenda_time_logs` table doesn't exist
2. API endpoint not accessible
3. Authentication issue

### Solution

1. **Verify table exists:**
   ```sql
   SELECT * FROM agenda_time_logs LIMIT 1;
   ```

2. **Check API endpoint:**
   - Open DevTools → Network tab
   - Click play button
   - Look for `/api/admin/agenda/[id]/time-logs` request
   - Check response for errors

3. **Verify authentication:**
   - Check that `admin-token` cookie exists
   - Try logging out and back in

---

## Subtasks Don't Show

If you can't see or add subtasks:

### Causes
1. `agenda_subtasks` table doesn't exist
2. Item not expanded
3. API error

### Solution

1. **Expand the item** - Click on the item card to expand it

2. **Verify table exists:**
   ```sql
   SELECT * FROM agenda_subtasks LIMIT 1;
   ```

3. **Check console for errors**

---

## Tags Don't Work

If you can't create or assign tags:

### Causes
1. `agenda_tags` table doesn't exist
2. `agenda_item_tags` table doesn't exist
3. Modal not opening

### Solution

1. **Click "Manage Tags"** - Should open a modal

2. **Verify tables exist:**
   ```sql
   SELECT * FROM agenda_tags LIMIT 1;
   SELECT * FROM agenda_item_tags LIMIT 1;
   ```

3. **Create a tag:**
   - Enter name (e.g., "urgent")
   - Pick a color
   - Click "Create Tag"

---

## Activity Log Empty

If activity log shows no entries:

### Causes
1. `agenda_activity_log` table doesn't exist
2. Trigger not installed
3. No changes made yet

### Solution

1. **Verify table and trigger:**
   ```sql
   -- Check table exists
   SELECT * FROM agenda_activity_log LIMIT 1;
   
   -- Check trigger exists
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE trigger_name = 'agenda_items_activity_log';
   ```

2. **Make a change to trigger logging:**
   - Edit an item
   - Change status or priority
   - Activity should be logged

---

## Progress Not Updating

If progress percentage doesn't update when checking subtasks:

### Causes
1. Trigger not installed
2. Subtasks not properly linked
3. Cache issue

### Solution

1. **Verify trigger exists:**
   ```sql
   SELECT trigger_name 
   FROM information_schema.triggers 
   WHERE trigger_name = 'agenda_subtasks_update_progress';
   ```

2. **Manually trigger update:**
   - Refresh the page
   - Check/uncheck a subtask again

3. **Verify subtasks are linked:**
   ```sql
   SELECT * FROM agenda_subtasks 
   WHERE agenda_item_id = 'your-item-id';
   ```

---

## Recurring Items Not Generating

If recurring items aren't being created automatically:

### Causes
1. Cron job not set up
2. `CRON_SECRET` not configured
3. Function not installed

### Solution

1. **Set up cron job** (see `AGENDA_SETUP_GUIDE.md`)

2. **Verify function exists:**
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'generate_recurring_agenda_items';
   ```

3. **Test manually:**
   ```sql
   SELECT generate_recurring_agenda_items();
   ```

---

## Performance Issues

If the page loads slowly:

### Solutions

1. **Check number of items:**
   ```sql
   SELECT COUNT(*) FROM agenda_items;
   ```
   - If > 1000 items, consider archiving old ones

2. **Verify indexes exist:**
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename = 'agenda_items';
   ```

3. **Archive old items:**
   ```sql
   UPDATE agenda_items 
   SET is_archived = true, archived_at = NOW()
   WHERE status = 'completed' 
     AND completed_at < NOW() - INTERVAL '90 days';
   ```

---

## Mobile View Issues

If features don't work on mobile:

### Solutions

1. **Use landscape mode** for better experience
2. **Tap to expand items** - Some features are in expanded view
3. **Check responsive breakpoints** - Some features may be hidden on small screens

---

## Getting More Help

### Debug Checklist

Before asking for help, gather this information:

- [ ] Browser console errors (screenshot)
- [ ] Network tab showing failed requests
- [ ] Database tables list (from query above)
- [ ] Server logs (if available)
- [ ] Steps to reproduce the issue

### Useful Queries

**Check all agenda tables:**
```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE 'agenda%'
ORDER BY table_name;
```

**Check all triggers:**
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'agenda%';
```

**Check RLS policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'agenda%';
```

---

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Failed to load items | Run migration SQL |
| Column doesn't exist | Use updated migration file |
| Tables don't exist | Run migration SQL |
| Features don't work | Run migration + restart server |
| Statistics show zero | Create a test item |
| Can't create items | Check authentication |
| Timers don't work | Verify time_logs table exists |
| Subtasks don't show | Expand item first |
| Tags don't work | Verify tags tables exist |
| Activity log empty | Make a change to trigger it |
| Progress not updating | Verify trigger exists |
| Recurring not working | Set up cron job |
| Slow performance | Archive old items |

---

## Still Having Issues?

1. **Check the documentation:**
   - `AGENDA_SETUP_GUIDE.md` - Setup instructions
   - `changelog/agenda-advanced-features.md` - Feature details
   - `AGENDA_QUICK_REFERENCE.md` - Quick reference

2. **Verify migration:**
   - Re-run the entire migration file
   - Check for any SQL errors
   - Verify all tables created

3. **Start fresh:**
   - Clear browser cache
   - Restart dev server
   - Log out and back in

---

**Last Updated:** February 16, 2026  
**Version:** 2.0 (Advanced Features)
