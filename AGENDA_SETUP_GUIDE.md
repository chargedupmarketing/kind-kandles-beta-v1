# Team Agenda - Advanced Features Setup Guide

## 🚀 Quick Start

Your Team Agenda has been upgraded with powerful new features! Follow these steps to get everything running.

---

## Step 1: Database Migration

Run the enhanced schema migration to add all new tables and features.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/agenda_schema_enhanced.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

---

## Step 2: Verify Database Setup

After running the migration, verify all tables were created:

```sql
-- Run this query in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'agenda%'
ORDER BY table_name;
```

**Expected tables:**
- `agenda_items` (enhanced)
- `agenda_activity_log`
- `agenda_attachments`
- `agenda_comments`
- `agenda_dependencies`
- `agenda_item_tags`
- `agenda_subtasks`
- `agenda_tags`
- `agenda_time_logs`
- `agenda_watchers`

---

## Step 3: Set Up Cron Jobs (Optional but Recommended)

For recurring items and due date notifications, set up these cron jobs:

### Using Vercel Cron (if deployed on Vercel)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/agenda/check-due",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/admin/agenda/generate-recurring",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Using External Cron Service (cron-job.org, EasyCron, etc.)

Set up two jobs:

1. **Due Date Checker** (runs hourly)
   - URL: `https://your-domain.com/api/admin/agenda/check-due`
   - Schedule: `0 * * * *` (every hour)
   - Method: GET
   - Header: `x-cron-secret: your-cron-secret`

2. **Recurring Item Generator** (runs daily)
   - URL: `https://your-domain.com/api/admin/agenda/generate-recurring`
   - Schedule: `0 0 * * *` (daily at midnight)
   - Method: GET
   - Header: `x-cron-secret: your-cron-secret`

**Note:** Make sure your `CRON_SECRET` is set in `.env.local`

---

## Step 4: Test the Features

### Test Basic Functionality

1. **Navigate to Team Agenda**
   - Desktop: Click "Team Agenda" in sidebar
   - Mobile: Go to "More" → "Quick Access" → "Team Agenda"

2. **Create a Test Item**
   - Click "New Item"
   - Fill in title and description
   - Set priority and due date
   - Add some subtasks
   - Click "Create Item"

3. **Test Advanced Features**
   - ✅ Add subtasks and check them off
   - ✅ Start/stop a timer
   - ✅ Add an attachment (link)
   - ✅ Add a comment
   - ✅ Create a custom tag
   - ✅ View activity log

### Verify Statistics

Check that the dashboard shows:
- Total items count
- Status breakdowns (Pending, In Progress, Completed)
- Overdue items
- High priority items
- Your active items

---

## Step 5: Create Initial Tags (Optional)

Pre-populate some useful tags for your team:

```sql
-- Run in Supabase SQL Editor
-- Replace 'YOUR_ADMIN_USER_ID' with an actual admin user ID

INSERT INTO agenda_tags (name, color, created_by) VALUES
  ('urgent', '#ef4444', 'YOUR_ADMIN_USER_ID'),
  ('marketing', '#8b5cf6', 'YOUR_ADMIN_USER_ID'),
  ('development', '#3b82f6', 'YOUR_ADMIN_USER_ID'),
  ('design', '#ec4899', 'YOUR_ADMIN_USER_ID'),
  ('meeting', '#f59e0b', 'YOUR_ADMIN_USER_ID'),
  ('bug', '#dc2626', 'YOUR_ADMIN_USER_ID'),
  ('feature', '#10b981', 'YOUR_ADMIN_USER_ID'),
  ('documentation', '#6366f1', 'YOUR_ADMIN_USER_ID');
```

Or create them through the UI:
1. Click "Manage Tags" button
2. Enter tag name and pick a color
3. Click "Create Tag"

---

## 📊 Feature Overview

### What's New?

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Subtasks** | Break tasks into checklist items | Better task management |
| **Time Tracking** | Start/stop timers, log hours | Accurate time tracking |
| **Attachments** | Add files, links, images | Centralized docs |
| **Tags** | Custom colored tags | Better organization |
| **Progress** | Auto-calculated from subtasks | Visual completion |
| **Recurring** | Daily/weekly/monthly repeats | Automate routine tasks |
| **Activity Log** | Complete change history | Full audit trail |
| **Watchers** | Subscribe to item updates | Better collaboration |

---

## 🎨 UI Features

### Statistics Dashboard
- **7 key metrics** displayed at the top
- Real-time updates
- Color-coded indicators

### Filters & Search
- Filter by status, priority, assignment
- Search across all fields
- Tag-based filtering
- Multiple sort options

### Item Cards
- Color-coded borders
- Status icons with animations
- Priority and type badges
- Progress bars
- Counts for subtasks, attachments, comments
- Time tracking indicators

### Expandable Details
- Subtasks management
- Time tracking section
- Attachments list
- Comments thread
- Activity history

---

## 💡 Usage Tips

### Best Practices

1. **Use Subtasks for Complex Tasks**
   - Break down large tasks into 3-7 subtasks
   - Check them off as you complete them
   - Progress auto-updates

2. **Track Time Accurately**
   - Start timer when you begin work
   - Stop timer when you take breaks
   - Review time logs to improve estimates

3. **Organize with Tags**
   - Create tags for departments, priorities, or categories
   - Use consistent tag names
   - Filter by tags for focused views

4. **Set Realistic Estimates**
   - Use estimated hours field
   - Compare with actual hours logged
   - Improve future estimates

5. **Use Recurring for Routine Tasks**
   - Weekly team meetings
   - Monthly reports
   - Daily standup reminders

### Keyboard Shortcuts (Planned)

Coming soon:
- `N` - New item
- `F` - Focus search
- `E` - Edit selected item
- `Space` - Expand/collapse item

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Database not configured" error
**Solution:** 
- Verify Supabase connection in `.env.local`
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Issue: Tables don't exist
**Solution:**
- Run the migration script: `agenda_schema_enhanced.sql`
- Verify in Supabase dashboard

#### Issue: Timer doesn't start
**Solution:**
- Check browser console for errors
- Verify API endpoint is accessible
- Check authentication token

#### Issue: Progress not updating
**Solution:**
- Verify subtasks trigger is installed
- Check database logs
- Refresh the page

#### Issue: Recurring items not generating
**Solution:**
- Set up cron job (see Step 3)
- Verify `CRON_SECRET` is configured
- Check cron job logs

---

## 📚 Additional Resources

- **Full Documentation:** See `changelog/agenda-advanced-features.md`
- **Original Feature Docs:** See `changelog/agenda-feature.md`
- **Database Schema:** See `supabase/migrations/agenda_schema_enhanced.sql`
- **API Documentation:** Check individual route files in `src/app/api/admin/agenda/`

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the changelog** for detailed feature documentation
2. **Review database logs** in Supabase dashboard
3. **Check browser console** for JavaScript errors
4. **Verify API responses** in Network tab
5. **Test with a fresh item** to isolate the issue

---

## 🎉 You're All Set!

Your Team Agenda is now a powerful project management tool. Start creating items, tracking time, and collaborating with your team!

### Quick Links

- **Team Agenda Page:** `/restricted/admin` → Click "Team Agenda"
- **Supabase Dashboard:** [https://app.supabase.com](https://app.supabase.com)
- **Changelog:** `changelog/agenda-advanced-features.md`

---

**Last Updated:** February 16, 2026  
**Version:** 2.0 (Advanced Features)
