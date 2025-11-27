# Shopify Connection Troubleshooting Guide

**Last Updated**: November 26, 2025

## 🎯 Your Best Connection Options

### Option 1: Storefront API (Current Setup) ⭐ RECOMMENDED

**Status**: Already configured, just needs proper credentials

**Pros:**
- ✅ Full customization control
- ✅ Best performance
- ✅ Better SEO
- ✅ No iframe limitations
- ✅ Your site already built for this

**What's Ready:**
- Shopify client configured (`src/lib/shopify.ts`)
- GraphQL queries written (`src/lib/queries/`)
- Product pages ready (`src/app/products/[handle]/page.tsx`)
- Collection pages ready (`src/app/collections/`)

---

### Option 2: Shopify Buy Button SDK

**Pros:**
- ✅ Faster setup
- ✅ Pre-built cart/checkout
- ✅ Less code to maintain

**Cons:**
- ❌ Less customization
- ❌ Iframe limitations
- ❌ Would require rebuilding parts of your site
- ❌ Not what you're currently set up for

---

### Option 3: Headless Commerce Platform (Hydrogen)

**Pros:**
- ✅ Shopify's official headless solution
- ✅ Optimized for performance

**Cons:**
- ❌ Major rebuild required
- ❌ Your site is already built for Storefront API
- ❌ Overkill for your needs

---

## 🔧 Fixing Storefront API Connection (Option 1)

### Common Issues & Solutions

#### Issue 1: Wrong Token Type ❌

**Problem:** Using Admin API token instead of Storefront API token

**How to tell:**
- Admin API tokens start with: `shpat_` or `shpca_`
- Storefront API tokens are usually 32 characters, lowercase hex

**Solution:**
1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps"
3. Select your app (or create new one)
4. Go to **API credentials** tab
5. Look for **"Storefront API access token"** (NOT Admin API)
6. Copy the correct token

---

#### Issue 2: Missing or Wrong API Scopes ❌

**Problem:** App doesn't have required permissions

**Solution:**
1. In your Shopify app, go to **Configuration** tab
2. Under **Storefront API integration**, click **Configure**
3. Enable these EXACT scopes:
   ```
   ✅ unauthenticated_read_product_listings
   ✅ unauthenticated_read_product_inventory
   ✅ unauthenticated_read_product_tags
   ✅ unauthenticated_read_collection_listings
   ✅ unauthenticated_write_checkouts
   ✅ unauthenticated_read_checkouts
   ```
4. Click **Save**
5. **IMPORTANT**: Click **Install app** button (even if already installed)
6. Confirm installation

---

#### Issue 3: Online Store Sales Channel Not Enabled ❌

**Problem:** Products not published to Online Store channel

**Solution:**
1. Go to Shopify Admin → **Settings** → **Sales channels**
2. Ensure **"Online Store"** is added
3. If not, click **Add sales channel** → **Online Store**
4. Go to **Products** → Select all products
5. Click **More actions** → **Make products available**
6. Check **"Online Store"** → Save

---

#### Issue 4: Store Password Protection ❌

**Problem:** Development store has password protection enabled

**Solution:**
1. Go to **Settings** → **General**
2. Scroll to **Password protection**
3. Either:
   - **Disable password** (if you own the store)
   - OR add your IP to allowlist
   - OR use Storefront API (which bypasses password)

**Note:** Storefront API should work even with password protection, but some configurations may block it.

---

#### Issue 5: Wrong Store Domain Format ❌

**Problem:** Domain includes `https://` or trailing slash

**Solution:**
Your `.env.local` should have:
```env
# ✅ CORRECT
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com

# ❌ WRONG
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=https://kindkandlesboutique.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com/
```

---

#### Issue 6: API Version Mismatch ❌

**Problem:** Using deprecated API version

**Current version in your code:** `2025-01` ✅ (already updated)

**If you see warnings:**
- Update `src/lib/shopify.ts` line 17
- Change to latest version: `2025-01`, `2025-04`, or `unstable`

---

## 🧪 Step-by-Step Testing Method

### Test 1: Verify Shopify Store Access

```bash
# Open browser and visit:
https://kindkandlesboutique.myshopify.com
```

**Expected:** Store should be accessible (even if password protected)

---

### Test 2: Test API with cURL

Create a test file `test-shopify-connection.js`:

```javascript
const https = require('https');

const storeDomain = 'kindkandlesboutique.myshopify.com';
const accessToken = 'YOUR_STOREFRONT_TOKEN_HERE'; // Replace this

const query = JSON.stringify({
  query: `{
    shop {
      name
      primaryDomain { url }
    }
  }`
});

const options = {
  hostname: storeDomain,
  path: '/api/2025-01/graphql.json',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': accessToken,
    'Content-Length': query.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(query);
req.end();
```

Run it:
```bash
node test-shopify-connection.js
```

**Expected output:**
```json
{
  "data": {
    "shop": {
      "name": "My Kind Kandles & Boutique",
      "primaryDomain": { "url": "https://kindkandlesboutique.myshopify.com" }
    }
  }
}
```

**If you get errors:**
- `401`: Wrong token or not authorized
- `403`: Access forbidden (check scopes)
- `404`: Wrong endpoint or Online Store not enabled
- `422`: GraphQL syntax error

---

### Test 3: Test in Your App

1. Create `.env.local`:
```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token_here
```

2. Restart dev server:
```bash
npm run dev
```

3. Check browser console (F12) for Shopify config logs

4. Visit: `http://localhost:3000/collections/all`

5. Open Network tab (F12 → Network)
   - Look for GraphQL requests
   - Check response status
   - View response data

---

## 🔍 Diagnostic Checklist

Run through this checklist:

### Shopify Admin Setup
- [ ] Custom app created
- [ ] Storefront API scopes configured (not Admin API)
- [ ] App installed/reinstalled after scope changes
- [ ] Storefront API token copied (32-char hex string)
- [ ] Online Store sales channel enabled
- [ ] Products published to Online Store
- [ ] Store domain is correct: `yourstore.myshopify.com`

### Local Environment
- [ ] `.env.local` file exists in project root
- [ ] Domain has NO `https://` or trailing `/`
- [ ] Token is Storefront API token (not Admin)
- [ ] Both environment variables are set
- [ ] Dev server restarted after adding `.env.local`

### Code Configuration
- [ ] API version is `2025-01` or later
- [ ] `src/lib/shopify.ts` has correct setup
- [ ] No console errors in browser
- [ ] GraphQL queries are valid

---

## 🎯 Recommended Approach

**Start fresh with these steps:**

### Step 1: Clean Slate
```bash
# Remove old env file
rm .env.local

# Clear Next.js cache
rm -rf .next
```

### Step 2: Create New Shopify App
1. Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps"
3. Click "Create an app"
4. Name: "Website Integration v2"
5. Click "Create app"

### Step 3: Configure Storefront API
1. Click **Configuration** tab
2. Under **Storefront API integration**, click **Configure**
3. Check these scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_collection_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
4. Click **Save**

### Step 4: Install App
1. Click **Install app** button
2. Confirm installation

### Step 5: Get Token
1. Go to **API credentials** tab
2. Find **Storefront API access token**
3. Click "Reveal token once" if needed
4. Copy the token (save it somewhere safe!)

### Step 6: Configure Locally
Create `.env.local`:
```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=kindkandlesboutique.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=paste_your_token_here
```

### Step 7: Test
```bash
npm run dev
```

Visit: `http://localhost:3000/collections/all`

---

## 🆘 Still Not Working?

### Get Detailed Error Info

Add this temporary debug component:

```typescript
// src/app/test-connection/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function TestConnection() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch(
          `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2025-01/graphql.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Storefront-Access-Token': 
                process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
            },
            body: JSON.stringify({
              query: `{
                shop {
                  name
                  primaryDomain { url }
                }
                products(first: 3) {
                  edges {
                    node {
                      id
                      title
                    }
                  }
                }
              }`
            })
          }
        );

        const data = await response.json();
        setResult({
          status: response.status,
          statusText: response.statusText,
          data: data
        });
      } catch (error) {
        setResult({ error: error.message });
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Shopify Connection Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
```

Visit: `http://localhost:3000/test-connection`

**Share the output** and I can help diagnose the specific issue.

---

## 📞 Alternative: Use Shopify's GraphiQL Explorer

1. Go to: `https://shopify.dev/docs/api/storefront`
2. Click "Try it" or "GraphiQL"
3. Enter your store domain and token
4. Test queries directly

This will tell you if the issue is:
- Your credentials (if GraphiQL fails too)
- Your code (if GraphiQL works but your app doesn't)

---

## 🎯 Success Indicators

You'll know it's working when:

✅ No console errors  
✅ Network tab shows 200 responses from Shopify  
✅ Products appear on `/collections/all`  
✅ Product images load  
✅ Clicking products shows details  
✅ Prices display correctly

---

## 📚 Additional Resources

- [Shopify Storefront API Docs](https://shopify.dev/docs/api/storefront)
- [GraphQL Basics](https://shopify.dev/docs/api/usage/graphql)
- [Troubleshooting Guide](https://shopify.dev/docs/api/usage/troubleshooting)

---

**Need more help?** Share:
1. The exact error message
2. Response from the test script above
3. Screenshot of your Shopify app configuration
4. Network tab screenshot showing the failed request



