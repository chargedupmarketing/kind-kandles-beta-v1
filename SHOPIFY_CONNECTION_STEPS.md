# Shopify Connection - Visual Step Guide

## 🔄 Connection Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR SHOPIFY STORE                        │
│              (kindkandlesboutique.myshopify.com)            │
│                                                              │
│  Products, Collections, Inventory, Pricing                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Storefront API
                       │ (Token Required)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              CUSTOM APP (in Shopify Admin)                  │
│                                                              │
│  • Name: "Custom Website"                                   │
│  • API: Storefront API v2024-10                            │
│  • Scopes: Read products, collections, checkouts           │
│  • Token: shpat_xxxxxxxxxxxxx                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Token copied to:
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  .env.local FILE                            │
│                                                              │
│  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=                         │
│    kindkandlesboutique.myshopify.com                       │
│                                                              │
│  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=              │
│    shpat_your_actual_token_here                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Loaded by Next.js
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              YOUR NEXT.JS WEBSITE                           │
│                                                              │
│  src/lib/shopify.ts → Creates API Client                   │
│  src/lib/queries/ → GraphQL Queries                        │
│  src/app/collections/ → Display Products                   │
│  src/app/products/ → Display Product Details               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Step-by-Step Visual Guide

### STEP 1: Shopify Admin Setup
```
Shopify Admin Dashboard
   ↓
Settings (bottom left)
   ↓
Apps and sales channels
   ↓
Develop apps (top right)
   ↓
Create an app
   ↓
Name: "Custom Website" → Create
   ↓
Configuration tab
   ↓
Storefront API → Configure
   ↓
Select Scopes:
   ☑ unauthenticated_read_product_listings
   ☑ unauthenticated_read_product_inventory
   ☑ unauthenticated_read_collection_listings
   ☑ unauthenticated_write_checkouts
   ☑ unauthenticated_read_checkouts
   ↓
Save → Install app
   ↓
API credentials tab
   ↓
Copy Storefront API token ✂️
```

---

### STEP 2: Local Setup
```
Your Computer
   ↓
Open: c:\Project-MyKindKandlesBoutique\Website-Custom\
   ↓
Create new file: .env.local
   ↓
Add these 2 lines:
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=paste_token_here
   ↓
Save file
   ↓
Terminal: Stop server (Ctrl+C)
   ↓
Terminal: npm run dev
   ↓
Server restarts with new variables ✅
```

---

### STEP 3: Test Connection
```
Browser
   ↓
Go to: http://localhost:3000/shopify-test
   ↓
Page loads and automatically tests connection
   ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SUCCESS:
   • Green checkmark
   • "Successfully connected to Shopify!"
   • Store info displayed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ERROR:
   • Red X or Yellow warning
   • Follow troubleshooting steps
   • Check console for errors (F12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### STEP 4: Verify Products
```
Shopify Admin
   ↓
Products → Check you have products
   ↓
Verify products are published to "Online Store"
   ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your Website
   ↓
Go to: http://localhost:3000/collections/all
   ↓
✅ Products appear from Shopify
   ↓
Click a product → See details
   ↓
✅ Images, prices, descriptions all load
```

---

## 🔍 File Structure Reference

```
Website-Custom/
├── .env.local  ← YOU CREATE THIS (Step 2)
│   └── Contains: Store domain + API token
│
├── src/
│   ├── lib/
│   │   ├── shopify.ts  ← Creates API client
│   │   └── queries/
│   │       ├── products.ts  ← Product queries
│   │       ├── collections.ts  ← Collection queries
│   │       └── cart.ts  ← Cart queries (for future)
│   │
│   ├── app/
│   │   ├── shopify-test/  ← Test page
│   │   │   └── page.tsx
│   │   ├── collections/  ← Collection pages
│   │   │   └── [handle]/page.tsx
│   │   └── products/  ← Product pages
│   │       └── [handle]/page.tsx
│   │
│   └── components/
│       └── ShopifyConnectionTest.tsx  ← Test component
│
└── SHOPIFY_SETUP_GUIDE.md  ← Full guide
```

---

## 🎯 What Each File Does

| File | Purpose |
|------|---------|
| `.env.local` | Stores your Shopify credentials (secrets) |
| `src/lib/shopify.ts` | Creates the connection to Shopify API |
| `src/lib/queries/products.ts` | Defines what product data to fetch |
| `src/lib/queries/collections.ts` | Defines what collection data to fetch |
| `src/app/collections/[handle]/page.tsx` | Displays collection of products |
| `src/app/products/[handle]/page.tsx` | Displays single product details |
| `src/components/ShopifyConnectionTest.tsx` | Tests if connection works |

---

## 🔐 Understanding the API Token

```
Your Shopify Store
   ↓
Custom App created
   ↓
Generates: Storefront API Token
   ↓
Token format: shpat_1234567890abcdef1234567890abcdef
   ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What this token can do:
   ✅ Read product data (titles, prices, images)
   ✅ Read collection data
   ✅ Read inventory levels
   ✅ Create checkouts
   ✅ Read checkout data

What this token CANNOT do:
   ❌ Modify products
   ❌ Change prices
   ❌ Delete anything
   ❌ Access customer data (unless scoped)
   ❌ Access admin functions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Safe to use in browser: YES ✅
(That's why we use NEXT_PUBLIC_ prefix)
```

---

## 🔄 Data Flow Example

### When a user visits: `/products/calm-down-girl-candle`

```
1. User clicks product link
      ↓
2. Next.js page loads: src/app/products/[handle]/page.tsx
      ↓
3. Page extracts handle: "calm-down-girl-candle"
      ↓
4. Calls Shopify API:
   client.request(GET_PRODUCT_BY_HANDLE, { handle })
      ↓
5. Shopify returns JSON with:
   • Product title
   • Description
   • Price
   • Images
   • Variants (sizes, colors)
   • Inventory
      ↓
6. Page renders product with Shopify data
      ↓
7. User sees: Product details, images, prices
```

---

## ⚡ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not configured" message | Create `.env.local` file, restart server |
| "Connection failed" | Verify token, check domain format |
| Products not showing | Publish products to "Online Store" in Shopify |
| Images broken | Check products have images in Shopify |
| Wrong prices | Verify currency settings in Shopify |

---

## 🎯 Success Checklist

After completing setup, you should be able to:

- [ ] Visit `/shopify-test` and see success message
- [ ] See your actual store name and domain
- [ ] Visit `/collections/all` and see products
- [ ] Click a product and see details
- [ ] See correct prices in your currency
- [ ] See product images loading
- [ ] See "out of stock" for unavailable items

---

## 🚀 Production Deployment

When ready to deploy:

```
Local Development (.env.local)
   ↓
Push code to GitHub/Git
   ↓
Deploy to Vercel/Hosting
   ↓
Add environment variables in hosting dashboard:
   • NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
   • NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
   ↓
Redeploy
   ↓
✅ Live site connected to Shopify!
```

---

## 📞 Need Help?

1. Check browser console (F12 → Console)
2. Check terminal for errors
3. Review Shopify API logs (Admin → Apps → Your app → View logs)
4. Verify all steps completed in order

---

**Ready to start?** Follow the steps in order! 🎯

For detailed explanations, see: `SHOPIFY_SETUP_GUIDE.md`
For quick reference, see: `SHOPIFY_QUICK_START.md`

