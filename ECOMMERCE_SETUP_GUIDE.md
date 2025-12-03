# Independent E-commerce Platform Setup Guide

This guide will help you set up your independent e-commerce platform with Supabase, Stripe, and Resend.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Stripe account (test mode for development)
- A Resend account (for transactional emails)

---

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and enter:
   - **Project name:** `kindkandles-store`
   - **Database password:** (save this somewhere safe!)
   - **Region:** Choose the closest to your customers
4. Click "Create new project" and wait for it to provision

### 1.2 Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 1.3 Run the Database Schema

1. In Supabase, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `supabase/schema.sql` from your project
4. Paste it into the SQL editor
5. Click "Run" to create all tables

### 1.4 Update Your Environment Variables

Create/update your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## Step 2: Stripe Setup

### 2.1 Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete the onboarding (you can skip business details for test mode)

### 2.2 Get Your API Keys

1. In Stripe Dashboard, click **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2.3 Set Up Webhooks (for production)

1. Go to **Developers** → **Webhooks**
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`)

### 2.4 Update Your Environment Variables

Add to your `.env.local`:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## Step 3: Resend Setup (Email)

### 3.1 Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email

### 3.2 Get Your API Key

1. Go to **API Keys** in the dashboard
2. Click "Create API Key"
3. Give it a name like "Kind Kandles Production"
4. Copy the API key

### 3.3 Verify Your Domain (for production)

1. Go to **Domains** in Resend
2. Add your domain (e.g., `kindkandlesboutique.com`)
3. Add the DNS records Resend provides
4. Wait for verification (usually a few minutes)

### 3.4 Update Your Environment Variables

Add to your `.env.local`:

```env
# Email (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=orders@kindkandlesboutique.com
ADMIN_EMAIL=admin@kindkandlesboutique.com
```

---

## Step 4: Seed Your Products

After setting up Supabase, you can seed your database with sample products:

```bash
npx ts-node scripts/seed-products.ts
```

Or manually add products through the admin dashboard at `/restricted/admin`.

---

## Step 5: Test Your Setup

### 5.1 Start the Development Server

```bash
npm run dev
```

### 5.2 Test the Checkout Flow

1. Go to `http://localhost:3000/collections/all`
2. Add a product to your cart
3. Click "Proceed to Checkout"
4. Fill in shipping information
5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any 5-digit ZIP

### 5.3 Verify the Order

1. Check your Supabase database for the new order
2. Check your email (if configured) for order confirmation
3. View the order in the admin dashboard at `/restricted/admin`

---

## Environment Variables Summary

Here's the complete `.env.local` file you need:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=orders@kindkandlesboutique.com
ADMIN_EMAIL=admin@kindkandlesboutique.com

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

---

## Features Included

### Customer-Facing
- ✅ Product catalog with collections
- ✅ Shopping cart with persistence
- ✅ Multi-step checkout flow
- ✅ Stripe payment processing
- ✅ Order confirmation emails
- ✅ Shipping rate calculation
- ✅ Discount code support
- ✅ Free shipping threshold ($50+)

### Admin Dashboard
- ✅ Order management
- ✅ Product management
- ✅ Inventory tracking
- ✅ Shipping notifications
- ✅ Low stock alerts

### Technical
- ✅ PostgreSQL database (Supabase)
- ✅ Row Level Security
- ✅ Automatic inventory updates
- ✅ Webhook handling
- ✅ Transactional emails

---

## Going to Production

When you're ready to go live:

1. **Stripe:** Switch from test keys to live keys
2. **Supabase:** Consider upgrading for better performance
3. **Domain:** Verify your domain in Resend
4. **Webhooks:** Update webhook URLs to production domain
5. **Environment:** Set all environment variables in Vercel

---

## Troubleshooting

### Products not showing?
- Check that products have `status: 'active'` in the database
- Verify Supabase environment variables are set

### Payments failing?
- Ensure you're using Stripe test cards in development
- Check Stripe Dashboard for error details
- Verify webhook secret is correct

### Emails not sending?
- Verify your domain in Resend
- Check the API key is correct
- Look at Resend logs for errors

---

## Support

For issues with:
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Stripe:** [stripe.com/docs](https://stripe.com/docs)
- **Resend:** [resend.com/docs](https://resend.com/docs)

