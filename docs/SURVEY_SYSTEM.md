# Newsletter & Survey Lead Magnet System

## Overview
A comprehensive newsletter signup and survey system with a 20% discount coupon incentive for first-time visitors.

## Features

### 🎁 Survey Popup
- **Beautiful Design**: Matches the website's pink/purple aesthetic
- **First Visit Only**: Uses localStorage to track visitors
- **Multi-Step Form**: 
  - Step 1: Basic info (name, email, gender, age)
  - Step 2: Preferences (location, referral source, candle preferences)
  - Step 3: Success with unique coupon code
- **Auto-Display**: Shows 3 seconds after first page load
- **Dismissible**: Users can close it anytime

### 📊 Admin Panel Integration
Access via: `/restricted/admin` → "Survey & Newsletter" tab

**Features:**
- View all survey responses in a sortable table
- Real-time statistics dashboard
- Filter by coupon status (All, Unused, Used)
- Search by name, email, or location
- Export capabilities

### 📥 Export Options
1. **Full CSV Export**: Complete survey data with all fields
2. **Email List Export**: Simple .txt file with all email addresses

### 📈 Analytics Dashboard
The admin panel shows:
- Total responses
- Unused coupons count
- Used coupons count
- Top referral source
- Most popular candle preference
- Most common location

## Survey Questions

1. **Name** (required)
2. **Email** (required)
3. **Gender** (required)
   - Options: Female, Male, Non-binary, Prefer not to say
4. **Age Range** (required)
   - Options: 18-24, 25-34, 35-44, 45-54, 55-64, 65+
5. **Location** (required)
   - Free text: City, State, or Country
6. **How Did You Find Us?** (required)
   - Social Media, Google Search, Friend/Family Referral, Instagram, Facebook, TikTok, Craft Fair/Market, Other
7. **Candle Preferences** (required, multiple choice)
   - Floral, Citrus, Woodsy, Fresh, Sweet, Herbal, Earthy
8. **Additional Information** (optional)
   - Free text area

## Coupon System

### Coupon Code Format
- Prefix: `WELCOME`
- Random 6-character suffix
- Example: `WELCOMEA8F3K9`

### Features
- Unique code per email
- 20% discount on first order
- One-time use only
- Automatically generated upon survey completion
- Sent to user's email (TODO: integrate email service)
- Copy-to-clipboard functionality

### Duplicate Prevention
If an email already exists in the database, the system returns the existing coupon code instead of creating a new one.

## Data Storage

### Location
`/data/survey-submissions.json`

### Data Structure
```json
{
  "id": "unique-id",
  "timestamp": "ISO-8601",
  "email": "user@example.com",
  "name": "John Doe",
  "gender": "male",
  "ageRange": "25-34",
  "location": "Baltimore, MD",
  "howDidYouFindUs": "instagram",
  "candlePreferences": ["Woodsy", "Fresh"],
  "otherInfo": "Love your products!",
  "couponCode": "WELCOMEA8F3K9",
  "couponUsed": false
}
```

## API Endpoints

### POST `/api/survey/submit`
Submit a new survey response

**Request Body:**
```json
{
  "email": "string",
  "name": "string",
  "gender": "string",
  "ageRange": "string",
  "location": "string",
  "howDidYouFindUs": "string",
  "candlePreferences": ["string"],
  "otherInfo": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "couponCode": "WELCOMEA8F3K9",
  "message": "Survey submitted successfully!"
}
```

### GET `/api/survey/list`
Retrieve all survey responses (admin only)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 42
}
```

## Setup Instructions

### 1. Ensure Data Directory Exists
The system automatically creates `/data/survey-submissions.json` on first use.

### 2. Email Integration (TODO)
To send coupon codes via email:
1. Choose an email service (SendGrid, Mailgun, etc.)
2. Update `/api/survey/submit/route.ts`
3. Uncomment and implement `sendCouponEmail()` function

### 3. Admin Access
Survey responses are viewable in the admin panel:
1. Go to `/restricted/login`
2. Enter admin credentials
3. Navigate to "Survey & Newsletter" tab

## Privacy & GDPR Compliance

- Privacy notice displayed on survey form
- Data stored securely on server
- No third-party tracking
- Email list export for newsletter compliance
- Users informed about data usage

## Future Enhancements

- [ ] Email integration for automatic coupon delivery
- [ ] Integration with Shopify for coupon validation
- [ ] Email marketing platform integration (Mailchimp, etc.)
- [ ] A/B testing different survey questions
- [ ] Analytics dashboard with charts/graphs
- [ ] Automatic cleanup of old unused coupons
- [ ] SMS notification option
- [ ] Multi-language support

## Customization

### Change Popup Timing
Edit `src/components/SurveyPopup.tsx`:
```typescript
setTimeout(() => {
  setIsOpen(true);
}, 3000); // Change to desired milliseconds
```

### Modify Coupon Format
Edit `src/app/api/survey/submit/route.ts`:
```typescript
function generateCouponCode(): string {
  const prefix = 'WELCOME'; // Change prefix
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}
```

### Update Survey Questions
Modify the form fields in `src/components/SurveyPopup.tsx`

## Troubleshooting

### Popup Not Showing
- Clear localStorage: `localStorage.removeItem('hasSeenSurvey')`
- Check browser console for errors
- Ensure not on admin pages

### Data Not Saving
- Check `/data` directory permissions
- Verify API route is accessible
- Check browser network tab for errors

### Export Not Working
- Ensure browser allows downloads
- Check for popup blockers
- Verify data exists in admin panel

## Support

For issues or questions, check:
1. Browser console for errors
2. Server logs for API errors
3. Network tab for failed requests

