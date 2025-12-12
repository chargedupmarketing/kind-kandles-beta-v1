# 🚀 Kind Kandles Production Readiness Checklist

**Target Handoff Date:** 2 Days from Now  
**Last Updated:** December 9, 2024

---

## 📋 Table of Contents
1. [Environment Variables & API Keys Required](#1-environment-variables--api-keys-required)
2. [Third-Party Service Setup](#2-third-party-service-setup)
3. [Security Checklist](#3-security-checklist)
4. [Manual Testing Checklist](#4-manual-testing-checklist)
5. [Domain & Hosting Setup](#5-domain--hosting-setup)
6. [Database Setup](#6-database-setup)
7. [Missing Features to Implement](#7-missing-features-to-implement)
8. [Pre-Launch Final Steps](#8-pre-launch-final-steps)

---

## 1. Environment Variables & API Keys Required

Create a `.env.local` file in production with these values:

### 🌐 Site Configuration
```env
NEXT_PUBLIC_SITE_URL=https://kindkandlesboutique.com
```

### 🗄️ Supabase (Database) - REQUIRED
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```
**Where to get:** https://app.supabase.com → Project Settings → API

### 💳 Square (Payments) - REQUIRED
```env
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-your-production-app-id
SQUARE_ACCESS_TOKEN=EAAAl...your-production-access-token
SQUARE_LOCATION_ID=L...your-location-id
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-signature-key
```
**Where to get:** https://developer.squareup.com/apps

### 📧 Resend (Email) - REQUIRED
```env
RESEND_API_KEY=re_...your-api-key
EMAIL_FROM=orders@kindkandlesboutique.com
ADMIN_EMAIL=admin@kindkandlesboutique.com
```
**Where to get:** https://resend.com/api-keys

### 🔐 Admin Authentication - REQUIRED
```env
ADMIN_USERNAME=your_secure_admin_username
ADMIN_PASSWORD=YourSecurePassword123!@#
```
⚠️ **CRITICAL:** Change these from defaults! Use a strong password with:
- Minimum 12 characters
- Uppercase and lowercase letters
- Numbers and special characters

### 🔧 Maintenance Mode
```env
NEXT_PUBLIC_DEFAULT_MAINTENANCE_CODE=YourSecretCode123
```

---

## 2. Third-Party Service Setup

### 💳 Square Payment Processing

**Setup Steps:**
1. Go to https://squareup.com and create/login to business account
2. Go to https://developer.squareup.com/apps
3. Create a new application (or use existing)
4. Get credentials from the **Credentials** tab:
   - Application ID
   - Access Token (Production)
5. Get Location ID from **Locations** tab
6. Set up Webhooks:
   - URL: `https://kindkandlesboutique.com/api/webhooks/square`
   - Events: `payment.completed`, `payment.updated`, `refund.created`
   - Copy the Webhook Signature Key

**Test Cards (Sandbox):**
- Success: `4532 0123 4567 8901`
- Decline: `4000 0000 0000 0002`
- CVV: `111`, Expiry: Any future date

### 📧 Resend Email Service

**Setup Steps:**
1. Go to https://resend.com and create account
2. Verify your domain (kindkandlesboutique.com):
   - Add DNS records provided by Resend
   - Wait for verification (can take up to 48 hours)
3. Create API key with "Sending access"
4. Test email sending from dashboard

**DNS Records Needed:**
- SPF record
- DKIM record
- DMARC record (optional but recommended)

### 🗄️ Supabase Database

**Setup Steps:**
1. Go to https://app.supabase.com
2. Create new project (or use existing)
3. Run the schema SQL files in order:
   ```
   supabase/schema.sql
   supabase/schema-additions.sql
   supabase/add-admin-users.sql
   ```
4. Get API keys from Project Settings → API
5. Enable Row Level Security (RLS) - already in schema

---

## 3. Security Checklist

### ✅ Already Implemented
- [x] HTTP-only secure cookies for admin auth
- [x] JWT token authentication with expiration
- [x] Rate limiting on login (5 attempts per minute)
- [x] Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- [x] Input sanitization utilities
- [x] CORS protection
- [x] Environment variable separation
- [x] SQL injection protection via Supabase
- [x] Password timing attack prevention (1s delay on failed login)

### ⚠️ CRITICAL - Must Do Before Launch

#### 1. Change Default Credentials
- [ ] Change `ADMIN_USERNAME` from "admin"
- [ ] Change `ADMIN_PASSWORD` to a strong password
- [ ] Change `NEXT_PUBLIC_DEFAULT_MAINTENANCE_CODE`

#### 2. Remove Sensitive Data from env.example
- [ ] Remove actual Supabase keys from `env.example` (currently exposed!)
- [ ] Replace with placeholder values only

#### 3. Enable HTTPS
- [ ] Ensure Vercel/hosting has SSL certificate
- [ ] Force HTTPS redirects

#### 4. Set Secure Cookie Settings
The cookies are already set with secure flags in production, but verify:
- `secure: true` (only over HTTPS)
- `httpOnly: true` (not accessible via JavaScript)
- `sameSite: 'lax'`

#### 5. Review API Endpoints
- [ ] All admin endpoints require authentication
- [ ] No sensitive data exposed in public endpoints

---

## 4. Manual Testing Checklist

### 🏠 Homepage & Navigation
- [ ] Homepage loads correctly
- [ ] Hero video plays (if applicable)
- [ ] Promotional banner displays correctly
- [ ] Countdown timer works (if enabled)
- [ ] Featured products slider works
- [ ] Navigation menu works on desktop
- [ ] Mobile hamburger menu works
- [ ] Footer links work
- [ ] Dark mode toggle works

### 🛍️ Product Pages
- [ ] Collection pages load products
- [ ] Product detail pages show correct info
- [ ] Product images load
- [ ] Variant selection works (size, scent, etc.)
- [ ] Add to cart works
- [ ] Product descriptions render HTML correctly
- [ ] Fragrance notes display properly

### 🛒 Cart & Checkout
- [ ] Cart icon shows correct count
- [ ] Cart drawer opens/closes
- [ ] Quantity +/- works
- [ ] Remove item works
- [ ] Discount code applies correctly
- [ ] Shipping address form validates
- [ ] Shipping rates calculate
- [ ] Tax calculates (6% Maryland)
- [ ] Square payment form loads
- [ ] Test payment succeeds (sandbox)
- [ ] Order confirmation page shows
- [ ] Order confirmation email sends
- [ ] Admin receives order notification email

### 📧 Email Notifications
- [ ] Order confirmation email sends to customer
- [ ] Order notification email sends to admin
- [ ] Shipping notification email sends when order shipped
- [ ] Emails render correctly in Gmail, Outlook, Apple Mail

### 👤 Customer Features
- [ ] Contact form submits
- [ ] Newsletter/survey popup works
- [ ] Survey submission works
- [ ] Write Your Story page works
- [ ] FAQ page displays correctly

### 📝 Blog
- [ ] Blog listing page works
- [ ] Individual blog posts display
- [ ] Blog images load

### 🔧 Admin Panel
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Rate limiting works (try 6+ failed logins)
- [ ] Dashboard analytics load
- [ ] Order Fulfillment page shows pending orders
- [ ] Mark order as processing works
- [ ] Ship order with tracking works
- [ ] All Orders page works
- [ ] Product management works
- [ ] Customer management works
- [ ] Discount code management works
- [ ] Promotions/banners editing works
- [ ] Featured products editing works
- [ ] Blog post management works
- [ ] Settings save correctly
- [ ] Maintenance mode toggle works
- [ ] Logout works

### 📱 Mobile Responsiveness
- [ ] Homepage mobile layout
- [ ] Product pages mobile layout
- [ ] Cart mobile layout
- [ ] Checkout mobile layout
- [ ] Admin panel mobile layout

### 🌐 Browser Testing
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 5. Domain & Hosting Setup

### Vercel Deployment

**Steps:**
1. Push code to GitHub repository
2. Go to https://vercel.com
3. Import the GitHub repository
4. Add all environment variables in Vercel dashboard
5. Deploy

**Custom Domain Setup:**
1. In Vercel → Project → Settings → Domains
2. Add `kindkandlesboutique.com`
3. Add `www.kindkandlesboutique.com`
4. Update DNS records at domain registrar:
   - A record: `76.76.19.19`
   - CNAME for www: `cname.vercel-dns.com`
5. Wait for SSL certificate (automatic)

### DNS Records Summary
```
Type    Name    Value
A       @       76.76.19.19
CNAME   www     cname.vercel-dns.com
TXT     @       [Resend SPF record]
CNAME   [key]   [Resend DKIM record]
```

---

## 6. Database Setup

### Supabase Schema Deployment

Run these SQL files in order in Supabase SQL Editor:

1. **Main Schema** (`supabase/schema.sql`)
   - Products, variants, images
   - Collections
   - Orders, order items
   - Customers
   - Discount codes
   - Shipping zones/rates

2. **Schema Additions** (`supabase/schema-additions.sql`)
   - Admin users table
   - Audit logs
   - Store settings
   - Product reviews

3. **Admin Users** (`supabase/add-admin-users.sql`)
   - Initial admin user setup

### Import Product Data

If migrating from Shopify:
```bash
npx tsx scripts/shopify-import.ts --clear
```

Or seed with sample data:
```bash
npx tsx scripts/seed-products.ts
```

---

## 7. Missing Features to Implement

### 🚚 Shipping Provider Integration (NEEDS IMPLEMENTATION)

Currently, shipping rates are calculated locally with fixed prices. For production, you may want to integrate a real shipping provider:

**Options:**
1. **EasyPost** - Multi-carrier API (USPS, UPS, FedEx)
2. **Shippo** - Similar multi-carrier solution
3. **ShipStation** - Full fulfillment platform

**Current Behavior:**
- Standard: $5.99 (free over $50)
- Express: $12.99
- Overnight: $24.99

**If keeping current system:** The fixed rates work fine for a small business. Just ensure the prices cover actual shipping costs.

### 📦 Inventory Management
- Current: Basic inventory tracking in database
- Needed: Low stock alerts are implemented but not automated reordering

### 🔔 Additional Email Notifications (Optional)
- [ ] Password reset emails
- [ ] Account creation emails
- [ ] Abandoned cart emails
- [ ] Review request emails

---

## 8. Pre-Launch Final Steps

### 24 Hours Before Launch
- [ ] Final backup of all data
- [ ] Test complete checkout flow with real card (then refund)
- [ ] Verify all environment variables in production
- [ ] Check error monitoring is set up
- [ ] Review all admin panel settings
- [ ] Set correct store information in Settings
- [ ] Upload final product images
- [ ] Review all product descriptions
- [ ] Set correct shipping rates
- [ ] Set correct tax rate (6% Maryland)

### Launch Day
- [ ] Switch Square from sandbox to production
- [ ] Verify domain SSL is working
- [ ] Test checkout with real payment
- [ ] Monitor error logs
- [ ] Check email deliverability
- [ ] Announce launch!

### Post-Launch (First Week)
- [ ] Monitor orders daily
- [ ] Check for any errors in logs
- [ ] Respond to customer inquiries
- [ ] Process and ship orders promptly
- [ ] Review analytics

---

## 📞 Support Contacts

**Supabase:** https://supabase.com/docs  
**Square:** https://developer.squareup.com/docs  
**Resend:** https://resend.com/docs  
**Vercel:** https://vercel.com/docs  

---

## ⚠️ URGENT SECURITY FIX NEEDED

The `env.example` file currently contains **REAL** Supabase credentials. These must be replaced with placeholders before the repository is shared or made public.

Current (EXPOSED - CHANGE IMMEDIATELY):
```
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."
```

Should be:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**If these keys have been exposed publicly, rotate them immediately in Supabase dashboard!**

