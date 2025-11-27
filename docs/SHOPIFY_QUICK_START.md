# Shopify Integration - Quick Start Checklist

## 🎯 Quick Setup (15 minutes)

### ☐ Step 1: Get Shopify Credentials (5 min)
1. Go to Shopify Admin: `https://kindkandlesboutique.myshopify.com/admin`
2. Settings → Apps and sales channels → **Develop apps**
3. Create app → Name it "Custom Website"
4. Configuration → Storefront API → Configure scopes:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_collection_listings`
   - ✅ `unauthenticated_write_checkouts`
   - ✅ `unauthenticated_read_checkouts`
5. API credentials → **Install app**
6. Copy **Storefront API access token** (you only see it once!)

---

### ☐ Step 2: Configure Local Environment (2 min)
1. Create file: `.env.local` in project root
2. Add these two lines (with your actual values):
```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=paste_your_token_here
```
3. Save the file
4. Restart dev server: Stop (Ctrl+C) and run `npm run dev`

---

### ☐ Step 3: Test Connection (1 min)
1. Open: `http://localhost:3000/shopify-test`
2. Should see: ✅ "Successfully connected to Shopify!"
3. Your store info should display

---

### ☐ Step 4: Verify Products Load (2 min)
1. Ensure you have products in Shopify (published to Online Store)
2. Visit: `http://localhost:3000/collections/all`
3. Your Shopify products should appear!

---

### ☐ Step 5: Set Up for Production (5 min)
**On Vercel/Your Hosting Platform:**
1. Go to project settings
2. Add environment variables:
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` = `kindkandlesboutique.myshopify.com`
   - `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` = `your_token`
3. Redeploy

---

## 🚨 Troubleshooting

**"Not Configured" Error:**
- Make sure `.env.local` file is in project root (not in src/ folder)
- Check variable names have `NEXT_PUBLIC_` prefix
- Restart dev server

**"Connection Failed" Error:**
- Verify token is correct (copy/paste carefully, no extra spaces)
- Domain format: `yourstore.myshopify.com` (no https://)
- Check app is installed in Shopify admin

**Products Not Showing:**
- Products must be published to "Online Store" sales channel
- Check collection handles match between site and Shopify

---

## 📋 What's Already Built

Your site already has:
- ✅ Shopify API client configured
- ✅ Product query system
- ✅ Collection query system  
- ✅ Product pages ready
- ✅ Collection pages ready
- ✅ Image optimization
- ✅ Price formatting
- ⏳ Cart functionality (needs implementation)

---

## 🎯 Next: Implement Cart & Checkout

After connection is working, we need to:
1. Add "Add to Cart" buttons to product pages
2. Build cart drawer/modal
3. Create cart state management
4. Connect to Shopify checkout

**Want me to implement this?** Just ask!

---

## 📞 Quick Reference

- **Test Page:** `/shopify-test`
- **Shopify Admin:** `https://kindkandlesboutique.myshopify.com/admin`
- **Full Guide:** See `SHOPIFY_SETUP_GUIDE.md`
- **API Version:** 2024-10

---

## ✨ After Setup Checklist

Once everything is working:
- [ ] Remove test page files (optional)
- [ ] Implement cart functionality
- [ ] Test checkout flow
- [ ] Set up Shopify webhooks (for inventory sync)
- [ ] Configure SEO metadata
- [ ] Test on production

---

**Ready?** Start with Step 1! Get those Shopify credentials. 🚀

