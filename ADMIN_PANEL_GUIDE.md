# Kind Kandles Admin Panel - Setup & Testing Guide

This guide walks you through setting up and testing all features of the Kind Kandles Admin Panel.

---

## Table of Contents

1. [Accessing the Admin Panel](#accessing-the-admin-panel)
2. [Dashboard (Analytics)](#dashboard-analytics)
3. [Orders Management](#orders-management)
4. [Products Management](#products-management)
5. [Customers (CRM)](#customers-crm)
6. [Discounts](#discounts)
7. [Contact Forms](#contact-forms)
8. [Survey & Newsletter](#survey--newsletter)
9. [Story Management](#story-management)
10. [Menu Management](#menu-management)
11. [Settings](#settings)
12. [Maintenance Mode](#maintenance-mode)
13. [Required Environment Variables](#required-environment-variables)
14. [Database Setup](#database-setup)

---

## Accessing the Admin Panel

**URL:** `https://your-domain.com/restricted/admin`

**Login URL:** `https://your-domain.com/restricted/login`

### Default Credentials
Set these in your `.env.local` file:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

### Testing Login
1. Navigate to `/restricted/login`
2. Enter your admin credentials
3. You should be redirected to the admin dashboard
4. Verify the header shows your username and role

---

## Dashboard (Analytics)

The dashboard provides a real-time overview of your store performance.

### What You'll See
- **Revenue Card** - Total revenue with percentage change from previous period
- **Orders Card** - Total orders with trend indicator
- **Average Order Value** - Calculated from all paid orders
- **Customers Card** - Total unique customers with new customer count

### Testing the Dashboard
1. Select different date ranges (7d, 30d, 90d, Year, All time)
2. Click "Refresh" to reload data
3. Verify KPI cards update based on selected range
4. Check "Top Selling Products" shows your best performers
5. Verify "Low Stock Alerts" shows products with ≤5 inventory
6. Confirm "Recent Orders" displays latest 5 orders

### Data Requirements
- Dashboard will show mock data until you have real orders in the database
- Revenue calculations only include orders with `payment_status = 'paid'`

---

## Orders Management

Manage all customer orders from placement to delivery.

### Testing Orders
1. **View Orders List**
   - Verify orders display with order number, customer, status, date, total
   - Test search by order number or customer email
   - Filter by status (all, pending, paid, processing, shipped, delivered)

2. **View Order Details**
   - Click "View" on any order
   - Verify customer info, shipping address, line items display correctly
   - Check order timeline/notes section

3. **Update Order Status**
   - Change status from the dropdown
   - Add tracking number and tracking URL
   - Click "Update Order"
   - Verify status badge updates

4. **Send Shipping Notification**
   - Add tracking info first
   - Click "Send Shipping Email"
   - Verify success message appears

### Order Statuses
| Status | Description |
|--------|-------------|
| `pending` | Order placed, awaiting payment |
| `paid` | Payment received |
| `processing` | Being prepared for shipment |
| `shipped` | Handed to carrier |
| `delivered` | Received by customer |
| `cancelled` | Order cancelled |
| `refunded` | Payment refunded |

---

## Products Management

Full CRUD for your product catalog.

### Testing Products

1. **Create a Product**
   - Click "Add Product"
   - Fill in required fields:
     - **Title**: e.g., "Lavender Dreams Candle"
     - **Price**: e.g., 24.99
     - **Product Type**: Select from presets or enter custom
   - Optional fields:
     - Compare at Price (for sale items)
     - Collection assignment
     - Scent Profile tag
     - Burn Time tag
     - SKU and Inventory Quantity
     - Weight (for shipping calculations)
     - Description
   - Add image URLs
   - Set status (Draft/Active/Archived)
   - Toggle "Featured" for homepage display
   - Click "Create Product"

2. **Edit a Product**
   - Click "Edit" on any product
   - Modify fields
   - Click "Save Changes"

3. **Delete a Product**
   - Click delete icon
   - Confirm deletion

4. **Duplicate a Product**
   - Click duplicate icon
   - Modify the copy as needed
   - Save as new product

### Product Type Presets
- Candle
- Body Butter
- Body Oil
- Room Spray
- Bar Soap
- Lotion
- Body Scrub
- Body Mist

### Scent Profiles
- Floral, Citrus, Woodsy, Fresh, Sweet, Herbal, Earthy, Spicy

### Burn Times (Candles)
- 20+ hours, 40+ hours, 60+ hours, 80+ hours

---

## Customers (CRM)

View and manage your customer database.

### Testing Customers

1. **View Customer List**
   - Verify list shows email, name, orders, total spent, last order date
   - Test search by email or name
   - Sort by: Highest/Lowest Spenders, Most/Fewest Orders, Newest/Oldest

2. **View Customer Details**
   - Click "View" on any customer
   - Verify contact info displays
   - Check order history list
   - Verify total spent and order count stats
   - Check newsletter subscription status

3. **Export Customers**
   - Click "Export CSV"
   - Verify CSV downloads with all customer data

### Customer Data Points
- Email (required)
- First/Last Name
- Phone
- Marketing opt-in status
- Order history
- Total spent
- Customer since date
- Tags (VIP, Wholesale, Repeat Customer, etc.)

---

## Discounts

Create and manage promotional discount codes.

### Testing Discounts

1. **Create a Discount Code**
   - Click "Create Discount"
   - Enter code (or click 🎲 to generate)
   - Select type:
     - **Percentage**: e.g., 10% off
     - **Fixed Amount**: e.g., $5 off
     - **Free Shipping**: No shipping cost
   - Set value (not needed for free shipping)
   - Optional settings:
     - Minimum purchase amount
     - Usage limit
     - Start/End dates
   - Toggle Active status
   - Click "Create Code"

2. **Edit a Discount**
   - Click edit icon
   - Modify settings
   - Save changes

3. **Toggle Active/Inactive**
   - Click toggle icon to enable/disable

4. **Delete a Discount**
   - Click delete icon
   - Confirm deletion

5. **Copy Code**
   - Click copy icon next to any code
   - Verify code copies to clipboard

### Discount Status Indicators
| Status | Color | Meaning |
|--------|-------|---------|
| Active | Green | Currently usable |
| Inactive | Gray | Manually disabled |
| Scheduled | Blue | Starts in future |
| Expired | Red | End date passed |
| Exhausted | Orange | Usage limit reached |

### Recommended Discount Codes to Create

```
Code: WELCOME10
Type: Percentage
Value: 10%
Min Purchase: $25
Description: New customer welcome discount

Code: FREESHIP50
Type: Free Shipping
Min Purchase: $50
Description: Free shipping on orders over $50

Code: HOLIDAY20
Type: Percentage
Value: 20%
Start: Dec 1
End: Dec 31
Description: Holiday season promotion

Code: VIP25
Type: Percentage
Value: 25%
Max Uses: 50
Description: VIP customer exclusive
```

---

## Contact Forms

View and manage contact form submissions.

### Testing Contact Forms
1. Submit a test contact form on the public site
2. Verify it appears in the admin panel
3. Test marking as read/unread
4. Test starring important messages
5. Test archiving old messages
6. Test export to CSV

---

## Survey & Newsletter

Manage survey responses and newsletter subscribers.

### Testing Survey System
1. Complete the survey popup on the public site
2. Verify response appears in admin
3. Check coupon code assignment
4. Test export functionality

### Newsletter Data
- Email addresses
- Opt-in date
- Coupon code issued
- Coupon used status

---

## Story Management

Moderate user-generated content and testimonials.

### Testing Stories
1. Submit a story via the public "Write Your Story" page
2. Verify it appears with "Pending" status
3. Test approval workflow:
   - Pending → Approved → Published
   - Or Pending → Rejected
4. Test editing story content
5. Test starring featured stories
6. Export published stories

### Story Statuses
| Status | Description |
|--------|-------------|
| Pending | Awaiting review |
| Approved | Reviewed, ready to publish |
| Published | Visible on public site |
| Rejected | Not suitable for publication |

---

## Menu Management

Organize product categories and navigation.

### Testing Menu
1. View category tree structure
2. Toggle category visibility on/off
3. Reorder categories (if supported)
4. Add new categories
5. Edit category names

---

## Settings

Configure your store settings.

### Store Info Tab

**Required Information:**
```
Store Name: My Kind Kandles & Boutique
Tagline: Do All Things With Kindness
Contact Email: info@kindkandlesboutique.com
Phone: (410) 555-1234

Business Address:
  Line 1: 9505 Reisterstown Rd
  Line 2: Suite 2SE
  City: Owings Mills
  State: MD
  ZIP: 21117
  Country: US

Logo URL: /logos/logo.png
```

### Shipping Tab

**Settings to Configure:**
```
Free Shipping Threshold: $50
  (Orders over this amount get free shipping)

Allow Guest Checkout: ON
  (Customers can checkout without creating account)

Require Phone Number: OFF
  (Phone is optional at checkout)
```

### Taxes Tab

**Settings to Configure:**
```
Default Tax Rate: 6%
  (Maryland sales tax rate)

Tax Inclusive Pricing: OFF
  (Prices shown don't include tax)

Tax Shipping: OFF
  (Don't apply tax to shipping costs)
```

### Email Tab

**Settings to Configure:**
```
From Name: My Kind Kandles
From Email: orders@kindkandlesboutique.com
Admin Email: admin@kindkandlesboutique.com
```

**Note:** The "From Email" must be verified in your Resend account.

---

## Maintenance Mode

Control site access during updates or issues.

### Testing Maintenance Mode
1. Toggle maintenance mode ON
2. Set access code (e.g., "MKKSTAFF2024")
3. Open site in incognito window
4. Verify maintenance page displays
5. Enter access code to bypass
6. Verify normal site access after code entry
7. Toggle maintenance mode OFF
8. Verify site is publicly accessible

### When to Use
- During major updates
- When fixing critical bugs
- During inventory updates
- Before/during major sales events (to control traffic)

---

## Required Environment Variables

Create a `.env.local` file with these values:

```env
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_your-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Resend (Email)
RESEND_API_KEY=re_your-api-key
EMAIL_FROM=orders@kindkandlesboutique.com
ADMIN_EMAIL=admin@kindkandlesboutique.com

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here

# Maintenance Mode
NEXT_PUBLIC_DEFAULT_MAINTENANCE_CODE=MKKSTAFF2024
```

---

## Database Setup

### Initial Setup

1. **Run Main Schema** (if not already done)
   - Open Supabase SQL Editor
   - Paste contents of `supabase/schema.sql`
   - Execute

2. **Run Schema Additions**
   - Paste contents of `supabase/schema-additions.sql`
   - Execute

### Verify Tables Exist

Check that these tables are created:
- `products`, `product_variants`, `product_images`
- `collections`
- `customers`
- `orders`, `order_items`
- `discount_codes`
- `shipping_zones`, `shipping_rates`
- `admin_users`
- `audit_logs`
- `store_settings`
- `product_reviews`
- `customer_tags`, `customer_tag_assignments`
- `customer_notes`

### Seed Default Data

The schema includes default values for:
- Store settings (store info, tax, email, checkout)
- Customer tags (VIP, Wholesale, Repeat Customer, Newsletter, Local)
- Shipping zones (configured in main schema)

---

## Testing Checklist

### Pre-Launch Checklist

- [ ] Admin login works
- [ ] Dashboard loads with correct data
- [ ] Can create/edit/delete products
- [ ] Can view and update orders
- [ ] Can view customer list and details
- [ ] Can create and manage discount codes
- [ ] Settings save correctly
- [ ] Maintenance mode works
- [ ] Email notifications send (test with Resend)
- [ ] Stripe payments process correctly

### Daily Operations Checklist

- [ ] Check Dashboard for new orders
- [ ] Review low stock alerts
- [ ] Process pending orders
- [ ] Update tracking for shipped orders
- [ ] Review new contact form submissions
- [ ] Moderate pending stories
- [ ] Check discount code usage

---

## Troubleshooting

### "Database not configured" Error
- Check that Supabase environment variables are set
- Verify the Supabase URL and keys are correct
- Ensure you've run the schema SQL files

### Login Not Working
- Verify ADMIN_USERNAME and ADMIN_PASSWORD in .env.local
- Clear browser cookies and try again
- Check browser console for errors

### Orders/Products Not Loading
- Check browser console for API errors
- Verify Supabase connection
- Ensure RLS policies are correctly set up

### Emails Not Sending
- Verify RESEND_API_KEY is set
- Check that EMAIL_FROM is verified in Resend
- Review Resend dashboard for delivery logs

---

## Support

For technical issues, check:
1. Browser console for JavaScript errors
2. Network tab for API response errors
3. Supabase logs for database errors
4. Vercel logs for server-side errors

---

*Last Updated: December 2024*

