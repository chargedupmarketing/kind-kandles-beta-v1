# Shopify Integration Setup Guide

## Overview
This guide will walk you through connecting your Next.js website to your existing Shopify store. The integration is already built and ready - you just need to configure the connection!

## What's Already Set Up ✅
- Shopify Storefront API Client (`@shopify/storefront-api-client`)
- GraphQL queries for products, collections, and cart
- Product and collection pages ready to display Shopify data
- Test page to verify connection (`/shopify-test`)
- All necessary dependencies installed

---

## Step-by-Step Setup Process

### Step 1: Get Your Shopify Storefront API Credentials

#### 1.1 Access Your Shopify Admin
1. Go to your Shopify admin dashboard
2. Login at: `https://kindkandlesboutique.myshopify.com/admin` (or your store URL)

#### 1.2 Create a Custom App (if not already created)
1. In your Shopify admin, click **Settings** (bottom left)
2. Click **Apps and sales channels**
3. Click **Develop apps** button (top right)
4. If prompted, click **Allow custom app development**
5. Click **Create an app**
6. Name it something like "Custom Website" or "Next.js Site"
7. Click **Create app**

#### 1.3 Configure Storefront API Scopes
1. Click on your newly created app
2. Click the **Configuration** tab
3. Under **Storefront API integration**, click **Configure**
4. Select the following scopes (permissions):
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_collection_listings`
   - ✅ `unauthenticated_write_checkouts`
   - ✅ `unauthenticated_read_checkouts`
   - ✅ `unauthenticated_read_customers` (optional, for customer data)
5. Click **Save**

#### 1.4 Install the App
1. Click the **API credentials** tab
2. Click **Install app** button
3. Confirm the installation

#### 1.5 Get Your Credentials
After installation, you'll see:
1. **Storefront API access token** - Click "Reveal token once" and copy it
   - ⚠️ Important: Save this somewhere secure! You can only see it once.
2. Your **Store Domain** will be in the format: `kindkandlesboutique.myshopify.com`

---

### Step 2: Configure Your Local Environment

#### 2.1 Create Environment File
In your project root directory (`c:\Project-MyKindKandlesBoutique\Website-Custom\`), create a file named `.env.local`:

```env
# Shopify Storefront API Configuration
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_api_token_here
```

#### 2.2 Replace with Your Actual Values
- Replace `kindkandlesboutique.myshopify.com` with your actual store domain
- Replace `your_storefront_api_token_here` with the token you copied in Step 1.5

**Example:**
```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_abc123def456ghi789jkl012mno345pqr678
```

#### 2.3 Restart Your Development Server
1. Stop your current dev server (Ctrl+C in terminal)
2. Run `npm run dev` to restart
3. The new environment variables will now be loaded

---

### Step 3: Test the Connection

#### 3.1 Visit the Test Page
1. Open your browser and go to: `http://localhost:3000/shopify-test`
2. The page will automatically test your connection

#### 3.2 Verify Success
You should see:
- ✅ Green success message: "Successfully connected to Shopify!"
- Your store information displayed:
  - Store Name
  - Domain
  - Currency
  - Description

#### 3.3 Troubleshooting Connection Issues

**If you see "Not Configured":**
- Check that `.env.local` file exists in the project root
- Verify the environment variable names are exactly as shown (including `NEXT_PUBLIC_`)
- Restart your dev server

**If you see "Connection Failed":**
- Verify your Storefront API token is correct
- Check that your store domain is in the format: `yourstore.myshopify.com` (no https://)
- Make sure the Storefront API scopes are properly configured in Shopify
- Verify the custom app is installed and active in your Shopify admin

**If you see CORS errors:**
- This shouldn't happen with Storefront API, but if it does:
  - Make sure you're using the Storefront API token (not Admin API token)
  - Verify you're on the correct API version (2024-10)

---

### Step 4: Verify Products & Collections

#### 4.1 Check Your Shopify Store Has Products
1. Go to your Shopify admin
2. Navigate to **Products**
3. Ensure you have active products published to your "Online Store" sales channel

#### 4.2 Set Up Collections (if needed)
1. In Shopify admin, go to **Products** > **Collections**
2. Create collections that match your website's collection pages:
   - `candles` (for /collections/candles)
   - `skincare` (for /collections/skincare)
   - `body-oils` (for /collections/body-oils)
   - `room-sprays` (for /collections/room-sprays)
   - etc.

#### 4.3 Test Product Pages
1. Go to: `http://localhost:3000/collections/all`
2. You should see your Shopify products displayed
3. Click on a product to view the product detail page

#### 4.4 Important: Product Handles
- Product URLs use "handles" (URL-friendly slugs)
- Example: Product "Calm Down Girl Candle" → handle: `calm-down-girl-candle`
- The handle is automatically generated by Shopify from the product title
- Make sure your product handles match the URLs you're using in your site

---

### Step 5: Set Up Cart & Checkout

#### 5.1 Review Cart Implementation
The cart functionality needs to be completed. Here's what needs to happen:

**Current State:**
- Cart icon shows "0" items
- Cart queries exist in `src/lib/queries/cart.ts`

**What Needs Implementation:**
1. Create cart state management (React Context or similar)
2. Implement "Add to Cart" functionality on product pages
3. Create cart sidebar/modal to show cart contents
4. Connect to Shopify Checkout API for actual purchases

#### 5.2 Cart Implementation Options

**Option A: Use Shopify's Buy Button SDK** (Easiest)
- Shopify provides pre-built cart and checkout
- Less customization but faster setup

**Option B: Custom Cart with Storefront API** (More Control)
- Build custom cart UI
- Use Storefront API to create and manage carts
- Redirect to Shopify checkout for payment

**Recommended:** Option B for better brand consistency

Would you like me to implement the cart functionality? This involves:
- Creating a cart context/state
- Adding "Add to Cart" buttons to product pages
- Building a cart drawer/modal
- Connecting to Shopify's checkout

---

### Step 6: Configure for Production

#### 6.1 Set Environment Variables in Your Hosting Platform

**For Vercel:**
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add:
   - Variable: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
   - Value: `kindkandlesboutique.myshopify.com`
5. Add:
   - Variable: `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - Value: Your storefront API token
6. Save and redeploy

**For Other Platforms:**
- Similar process - add environment variables in your hosting dashboard
- Ensure variables start with `NEXT_PUBLIC_` to be accessible in the browser

#### 6.2 Security Note
- ✅ Storefront API tokens are safe to expose in the browser (that's why they have `NEXT_PUBLIC_` prefix)
- ✅ They only have read access to products/collections
- ❌ Never expose Admin API credentials in the browser
- ✅ The tokens are scoped to only allow safe operations

---

## Testing Checklist

Once set up, test these features:

- [ ] Connection test page shows success
- [ ] Product collections page loads products
- [ ] Individual product pages display correctly
- [ ] Product images load from Shopify CDN
- [ ] Prices display correctly with currency
- [ ] Product variants (sizes, colors) show correctly
- [ ] Out of stock products are marked appropriately
- [ ] Cart functionality works (once implemented)
- [ ] Checkout redirects to Shopify (once implemented)

---

## Common Issues & Solutions

### Issue: Products Not Showing
**Solution:** 
- Check products are published to "Online Store" sales channel in Shopify
- Verify collection handles match between your site and Shopify

### Issue: Images Not Loading
**Solution:**
- Shopify CDN should work automatically
- Check that products have images uploaded in Shopify admin

### Issue: Wrong Prices Showing
**Solution:**
- Verify your Shopify store currency settings
- Check that sale prices are properly set up in Shopify

### Issue: "Product Not Found" Errors
**Solution:**
- Product handles must match exactly between your URLs and Shopify
- Check product handle in Shopify admin (Products > Click product > Handle field)

---

## Next Steps After Connection

1. **Remove Test Page** (once connection verified)
   - Delete `src/app/shopify-test/page.tsx`
   - Delete `src/components/ShopifyConnectionTest.tsx`

2. **Implement Cart Functionality**
   - Would you like me to build this?

3. **Set Up Webhooks** (Optional but Recommended)
   - Get notified when products change
   - Keep your site in sync with Shopify inventory

4. **Add Analytics**
   - Track product views
   - Monitor checkout conversion

5. **SEO Optimization**
   - Product metadata from Shopify
   - Structured data for products

---

## Need Help?

If you run into any issues:
1. Check the browser console for errors (F12 > Console tab)
2. Check the terminal/command prompt for server errors
3. Review the Shopify admin logs (Settings > Apps and sales channels > Your custom app > API logs)
4. Verify all environment variables are set correctly

---

## Quick Reference

**Environment Variables Needed:**
```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_your_token_here
```

**Test Page:** `/shopify-test`

**Shopify Admin:** `https://kindkandlesboutique.myshopify.com/admin`

**API Version Used:** `2024-10`

---

## Ready to Start?

Follow the steps above in order, and you'll have your Shopify store connected in about 15-30 minutes!

**Start with Step 1:** Get your Shopify Storefront API credentials.

