# Team Agenda - Quick Reference Card

## 🚀 Getting Started (3 Steps)

1. **Run Database Migration**
   ```sql
   -- Copy contents of: supabase/migrations/agenda_schema_enhanced.sql
   -- Paste into Supabase SQL Editor
   -- Click Run
   ```

2. **Test the Features**
   - Navigate to Team Agenda page
   - Click "New Item"
   - Create a test item with subtasks
   - Start a timer and test features

3. **Set Up Cron Jobs** (Optional)
   - See `AGENDA_SETUP_GUIDE.md` for details
   - Required for recurring items and due date notifications

---

## 📊 New Features at a Glance

| Feature | What It Does | How to Use |
|---------|--------------|------------|
| **Subtasks** | Break tasks into checklist items | Click item → Add subtask → Check off when done |
| **Time Tracking** | Track hours with start/stop timer | Click ▶️ to start, ⏹️ to stop |
| **Attachments** | Add files, links, images | Expand item → Attachments → Add |
| **Tags** | Organize with custom colored tags | Click "Manage Tags" → Create → Assign to items |
| **Progress** | Auto-calculated from subtasks | Shows as progress bar on each item |
| **Recurring** | Repeat tasks daily/weekly/monthly | Enable in create form → Set frequency |
| **Activity Log** | See all changes and who made them | Expand item → Activity Log |
| **Statistics** | 7 key metrics at top of page | Always visible on dashboard |

---

## 🎨 UI Elements

### Statistics Dashboard (Top of Page)
```
[Total] [Pending] [In Progress] [Completed] [Overdue] [High Priority] [My Active]
```

### Filters (Below Statistics)
- **View Modes:** List | Kanban | Calendar | Timeline
- **Search:** Real-time search across all fields
- **Filter By:** All | My Items | Assigned to Me | Pending | In Progress | Completed | High Priority
- **Sort By:** Due Date | Priority | Created Date | Status | Progress
- **Tag Filter:** Click tags to filter by multiple tags

### Item Card (Collapsed)
```
[Status Icon] Title [Priority] [Type] [Recurring?] [Timer?]
Description preview
[Due Date] [Assignee] [Progress Bar] [Counts: Subtasks, Attachments, Comments]
[Tags]
[Start Timer] [Edit] [Delete] [Expand ▼]
```

### Item Card (Expanded)
```
5 Sections:
1. Subtasks - Checkbox list with add/delete
2. Time Tracking - Estimated vs Logged vs Variance + History
3. Attachments - Files/links with quick add
4. Comments - Discussion thread
5. Activity Log - Complete change history
```

---

## ⚡ Quick Actions

### Create New Item
```
Click "New Item" → Fill form → Add subtasks → Select tags → Create
```

### Track Time
```
Click ▶️ on item → Work on task → Click ⏹️ when done
```

### Add Subtask
```
Expand item → Subtasks section → Type title → Click + or press Enter
```

### Add Comment
```
Expand item → Comments section → Type comment → Click Send or press Enter
```

### Filter by Tag
```
Click tag chips below filters → Multiple tags = AND logic → "Clear filters" to reset
```

### Create Tag
```
Click "Manage Tags" → Enter name → Pick color → Create
```

---

## 🎯 Common Workflows

### Planning a Project
1. Create main task
2. Add subtasks for each step
3. Set estimated hours
4. Assign to team member
5. Add relevant tags
6. Set due date

### Tracking Work
1. Find your assigned task
2. Click ▶️ to start timer
3. Work on task
4. Check off subtasks as you complete them
5. Click ⏹️ to stop timer
6. Add comment with update

### Team Collaboration
1. Assign task to team member
2. They receive notification
3. They add comments with questions
4. You reply to comments
5. Activity log tracks all changes
6. Mark complete when done

### Recurring Tasks
1. Create item (e.g., "Weekly Team Meeting")
2. Enable "Make this recurring"
3. Select "Weekly" with interval 1
4. Set end date (optional)
5. System auto-creates next occurrence

---

## 📊 Statistics Explained

| Metric | What It Shows | Color |
|--------|---------------|-------|
| **Total Items** | All agenda items | Gray |
| **Pending** | Not started yet | Gray |
| **In Progress** | Currently being worked on | Blue (animated) |
| **Completed** | Finished tasks | Green |
| **Overdue** | Past due date, not completed | Red |
| **High Priority** | High or Urgent priority | Orange |
| **My Active** | Assigned to you, not completed | Teal |

---

## 🎨 Color Coding

### Priority Colors
- 🔴 **Urgent** - Red
- 🟠 **High** - Orange
- 🟡 **Medium** - Yellow
- 🟢 **Low** - Green

### Status Icons
- ⭕ **Pending** - Gray circle
- 🔵 **In Progress** - Blue clock (animated)
- ✅ **Completed** - Green checkmark
- ❌ **Cancelled** - Gray X

### Custom Colors
- Each item can have a custom color (left border)
- Pick color in create/edit form
- Helps visually group related items

---

## 🔍 Search & Filter Tips

### Search
- Searches: Title, Description, Assignee, Tags
- Real-time as you type
- Case-insensitive

### Filters
- **All Items** - Everything
- **My Items** - Created by you
- **Assigned to Me** - You're the assignee
- **Pending** - Status = Pending
- **In Progress** - Status = In Progress
- **Completed** - Status = Completed
- **High Priority** - Priority = High or Urgent

### Tag Filtering
- Click multiple tags for AND logic
- "Clear filters" removes all tag filters
- Combines with other filters

### Sorting
- **Due Date** - Soonest first (null last)
- **Priority** - Urgent → High → Medium → Low
- **Created Date** - Newest first
- **Status** - In Progress → Pending → Completed → Cancelled
- **Progress** - Highest percentage first

---

## ⏱️ Time Tracking Tips

### Best Practices
1. Start timer when you begin work
2. Stop timer for breaks
3. Review time logs weekly
4. Compare estimated vs actual
5. Improve future estimates

### Time Display
- **Estimated** - Your initial estimate
- **Logged** - Actual time tracked
- **Variance** - Difference (red if over, green if under)

### Time Logs
- Shows all time entries
- User who logged time
- Start time
- Duration
- Can delete if needed

---

## 📎 Attachment Types

| Type | Icon | Use For |
|------|------|---------|
| **Link** | 🔗 | External URLs, documentation |
| **File** | 📄 | Documents, PDFs, spreadsheets |
| **Image** | 🖼️ | Screenshots, diagrams, photos |

**Note:** Currently requires manual URL entry. Direct file upload coming soon!

---

## 🔔 Notifications

### When You Get Notified
- Assigned to a new task
- Task due date approaching (1 hour before)
- Task updated (if you enabled notifications)
- Someone comments on your task
- Someone comments on task you're watching

### Notification Settings
- Configure in Notification Preferences
- Toggle each notification type
- Categories: Team Agenda

---

## 🔄 Recurring Items

### Frequency Options
- **Daily** - Every N days
- **Weekly** - Every N weeks
- **Monthly** - Every N months

### How It Works
1. Create item with recurrence enabled
2. Set frequency and interval
3. Optionally set end date
4. Cron job generates next occurrence daily
5. New items created automatically

### Example
```
Task: "Weekly Team Standup"
Frequency: Weekly
Interval: 1
End Date: (none)
Result: New item created every Monday
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Tables don't exist | Run migration SQL |
| Timer won't start | Check console for errors, verify auth |
| Progress not updating | Refresh page, check trigger installed |
| Tags not showing | Create tags first via "Manage Tags" |
| Recurring not working | Set up cron job (see setup guide) |
| Can't add subtask | Expand item first, then add |

---

## 📱 Mobile Usage

### Access
- Mobile view: More → Quick Access → Team Agenda
- Responsive design works on all screen sizes

### Mobile Features
- All features available
- Touch-friendly buttons
- Swipe to expand (coming soon)
- Optimized layout

---

## 🎓 Learning Path

### Day 1: Basics
- [ ] Create your first item
- [ ] Add subtasks
- [ ] Check off subtasks
- [ ] Watch progress update

### Day 2: Time Tracking
- [ ] Start a timer
- [ ] Work for 30 minutes
- [ ] Stop timer
- [ ] View time logs

### Day 3: Organization
- [ ] Create 3-5 tags
- [ ] Assign tags to items
- [ ] Filter by tags
- [ ] Try different sorts

### Week 1: Advanced
- [ ] Add attachments
- [ ] Add comments
- [ ] View activity log
- [ ] Create recurring item

### Week 2: Mastery
- [ ] Set up cron jobs
- [ ] Review statistics
- [ ] Optimize workflows
- [ ] Train team members

---

## 📚 Documentation Links

- **Setup Guide:** `AGENDA_SETUP_GUIDE.md`
- **Full Documentation:** `changelog/agenda-advanced-features.md`
- **Upgrade Summary:** `AGENDA_UPGRADE_SUMMARY.md`
- **Database Schema:** `supabase/migrations/agenda_schema_enhanced.sql`

---

## 🎯 Pro Tips

1. **Use subtasks for everything** - Better progress tracking
2. **Start timers immediately** - More accurate time logs
3. **Create tags early** - Easier to organize from the start
4. **Set realistic estimates** - Compare with actuals to improve
5. **Add comments liberally** - Better communication
6. **Review activity log** - Learn from changes
7. **Use recurring for routine tasks** - Save time
8. **Filter by tags** - Focus on specific work
9. **Check statistics daily** - Stay on top of workload
10. **Expand items for details** - Don't miss important info

---

## 🚀 Keyboard Shortcuts (Coming Soon)

Planned shortcuts:
- `N` - New item
- `F` - Focus search
- `E` - Edit selected
- `Space` - Expand/collapse
- `T` - Start/stop timer
- `C` - Add comment

---

**Version:** 2.0 (Advanced Features)  
**Last Updated:** February 16, 2026  
**Status:** Ready to Use

**Quick Start:** Run migration → Create item → Test features → Enjoy! 🎉
