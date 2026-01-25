# Event System Testing Guide

## Implementation Summary

The complete event management system has been successfully implemented with the following components:

### Backend (API Routes)

#### Public APIs
- **GET /api/events** - List all active events with next occurrence
- **GET /api/events/[slug]** - Get event details and upcoming occurrences
- **GET /api/events/occurrences** - Get occurrences by event and date range
- **POST /api/events/bookings** - Submit event booking request

#### Admin APIs
- **GET /api/admin/events** - List all events (with stats)
- **POST /api/admin/events** - Create new event
- **GET /api/admin/events/[id]** - Get single event
- **PATCH /api/admin/events/[id]** - Update event
- **DELETE /api/admin/events/[id]** - Archive event

- **GET /api/admin/events/occurrences** - List occurrences
- **POST /api/admin/events/occurrences** - Create occurrence
- **PATCH /api/admin/events/occurrences/[id]** - Update occurrence
- **DELETE /api/admin/events/occurrences/[id]** - Delete occurrence

- **GET /api/admin/events/bookings** - List all bookings
- **PATCH /api/admin/events/bookings/[id]** - Update booking status
- **DELETE /api/admin/events/bookings/[id]** - Delete booking

### Frontend (Public Pages)

- **`/events`** - Events listing page with featured and regular events
- **`/events/[slug]`** - Event detail page with booking form
- **EventBookingForm component** - Client-side booking form with validation

### Admin Components

- **EventManagement** - Main event management dashboard
  - List all events with stats
  - Filter by type, location, status
  - Search events
  - Duplicate events
  - Archive events
  
- **EventEditor** - Create/edit event form
  - Basic information (title, slug, description)
  - Location settings (mobile/fixed/both)
  - Capacity settings
  - Pricing models (per person, flat rate, tiered, custom quote)
  - What's included list
  - Requirements list
  - Active/featured toggles

- **EventBookings** - Booking management
  - View all bookings with details
  - Filter by status and payment status
  - Update booking status
  - Update payment status
  - Export to CSV
  - Stats dashboard

### Database Schema

All tables created via migration `20260118_events_system.sql`:
- `events` - Event definitions
- `event_occurrences` - Specific event dates/times
- `event_bookings` - Customer bookings
- `event_categories` - Event categories
- `event_category_mappings` - Many-to-many relationship

## Testing Checklist

### 1. Admin Panel - Event Management

#### Create Event
1. Navigate to Admin Panel → Events → All Events
2. Click "Create Event"
3. Fill in event details:
   - Title: "Beginner Candle Making Workshop"
   - Event Type: Workshop
   - Duration: 120 minutes
   - Location Type: Both
   - Min Participants: 5
   - Max Participants: 15
   - Pricing Model: Per Person
   - Base Price: $35
   - Add items to "What's Included"
   - Set as Active and Featured
4. Save event
5. Verify event appears in event list

#### Create Event Occurrence
1. From event management, click "Edit" on the event
2. Navigate to occurrences section (or use separate occurrence management)
3. Create occurrence:
   - Date: [Future date]
   - Start Time: 2:00 PM
   - End Time: 4:00 PM
   - Location: "123 Main St" or "Mobile"
   - Status: Scheduled
   - Available Spots: 15
4. Save occurrence
5. Verify occurrence appears

### 2. Public Event Pages

#### Events Listing
1. Navigate to `/events`
2. Verify:
   - Hero section displays correctly
   - Featured events show with "Featured" badge
   - Regular events display below
   - Event cards show correct information
   - "Next occurrence" date displays if available
   - Pricing displays correctly

#### Event Detail Page
1. Click on an event card
2. Verify:
   - Event details display correctly
   - Breadcrumb navigation works
   - Event image displays (or placeholder)
   - What's included list shows
   - Requirements list shows
   - Upcoming occurrences display
   - Booking form appears

### 3. Event Booking Flow

#### Submit Booking
1. On event detail page, fill booking form:
   - Select an occurrence
   - Enter customer name
   - Enter email
   - Enter phone number
   - Select number of participants
   - Add special requests (optional)
2. Review calculated price
3. Submit booking
4. Verify:
   - Success message appears
   - Confirmation email sent to customer
   - Notification email sent to admins

#### Admin - View Booking
1. Navigate to Admin Panel → Events → Bookings
2. Verify:
   - New booking appears in list
   - All booking details are correct
   - Status is "Pending"
   - Payment status is "Pending"

#### Admin - Manage Booking
1. Update booking status to "Confirmed"
2. Update payment status to "Paid"
3. Verify changes save correctly
4. Test export to CSV functionality

### 4. Event Management Features

#### Filter and Search
1. In Event Management:
   - Test search by event name
   - Filter by event type
   - Filter by location type
   - Filter by active/inactive status
2. Verify results update correctly

#### Duplicate Event
1. Click duplicate on an existing event
2. Verify:
   - New event created with "(Copy)" suffix
   - All details copied except ID and dates
   - New event is inactive by default

#### Archive Event
1. Click archive on an event
2. Confirm deletion
3. Verify event no longer appears in active list

### 5. Email Notifications

#### Booking Confirmation Email (Customer)
Verify email contains:
- Event name and details
- Occurrence date and time
- Number of participants
- Total price
- Customer information
- Special requests
- Contact information

#### Booking Notification Email (Admin)
Verify email contains:
- All booking details
- Customer contact information
- Link to admin panel (optional)

### 6. Edge Cases and Validation

#### Event Creation
- Try creating event without required fields
- Test slug auto-generation from title
- Test different pricing models
- Test with/without deposit requirement

#### Booking Validation
- Try booking without selecting occurrence
- Try booking with invalid email
- Try booking more participants than available
- Test with minimum participants not met
- Test when occurrence is full

#### Occurrence Management
- Create multiple occurrences for same event
- Test occurrence status changes
- Test capacity tracking

### 7. Mobile Responsiveness

Test all pages on mobile:
- Events listing page
- Event detail page
- Booking form
- Admin event management (mobile view)

### 8. Dark Mode

Test all pages in dark mode:
- Verify colors and contrast
- Check readability
- Ensure all elements visible

## Known Limitations

1. **Payment Integration**: Deposit payments are tracked but not processed. Integration with Stripe or similar payment gateway would be needed for actual payment processing.

2. **Calendar View**: No visual calendar component yet. Events are displayed in list format.

3. **Recurring Events**: No bulk creation tool for recurring events. Each occurrence must be created individually.

4. **Waitlist**: No waitlist functionality when events are full.

5. **Automated Reminders**: No automated email reminders before events.

## Future Enhancements

1. **Payment Processing**
   - Integrate Stripe for deposit and full payment processing
   - Add payment confirmation flow
   - Handle refunds

2. **Calendar Component**
   - Visual calendar view for occurrences
   - Drag-and-drop scheduling
   - Month/week/day views

3. **Recurring Events**
   - Bulk create occurrences (weekly, monthly, etc.)
   - Template-based scheduling
   - Exception handling

4. **Customer Portal**
   - Customer login to view their bookings
   - Booking history
   - Cancellation requests

5. **Advanced Features**
   - Waitlist management
   - Automated email reminders
   - SMS notifications
   - Customer reviews for events
   - Photo galleries from past events

## Database Verification

To verify the database schema is correct, run these queries in Supabase SQL Editor:

```sql
-- Check events table
SELECT * FROM events LIMIT 5;

-- Check occurrences
SELECT * FROM event_occurrences LIMIT 5;

-- Check bookings
SELECT * FROM event_bookings LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('events', 'event_occurrences', 'event_bookings');
```

## Troubleshooting

### Events Not Showing
- Check if events are marked as `is_active = true`
- Verify RLS policies allow public read access
- Check browser console for API errors

### Booking Submission Fails
- Verify Resend API key is set in environment variables
- Check occurrence has available capacity
- Verify all required fields are filled
- Check browser console for validation errors

### Admin Panel Issues
- Verify user has admin permissions
- Check if logged in with correct credentials
- Verify API routes are accessible

### Email Not Sending
- Check Resend API key in `.env.local`
- Verify email addresses are valid
- Check Resend dashboard for delivery status
- Review server logs for errors

## Success Criteria

The event system is fully functional when:
- ✅ Admins can create and manage events
- ✅ Admins can create and manage occurrences
- ✅ Public can view events and occurrences
- ✅ Public can submit booking requests
- ✅ Admins receive booking notifications
- ✅ Customers receive booking confirmations
- ✅ Bookings update occurrence capacity
- ✅ All pages are responsive and accessible
- ✅ Dark mode works correctly
- ✅ Navigation is integrated
- ✅ No console errors or warnings

## Deployment Notes

Before deploying to production:
1. Run database migration: `20260118_events_system.sql`
2. Verify environment variables are set:
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_BASE_URL`
   - Supabase credentials
3. Test all functionality in staging environment
4. Create initial events and occurrences
5. Test booking flow end-to-end
6. Monitor error logs after deployment

## Support

For issues or questions:
- Check browser console for errors
- Review server logs in Vercel dashboard
- Check Supabase logs for database errors
- Verify environment variables are set correctly
