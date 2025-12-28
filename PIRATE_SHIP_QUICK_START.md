# Pirate Ship Quick Start - 5 Minutes ⚡

## What You Need From Pirate Ship Panel

### 1️⃣ API Key (Required)

**Where to find it:**
```
Pirate Ship Dashboard → Account (top right) → API Settings
OR
Direct link: https://www.pirateship.com/api
```

**What it looks like:**
```
ps_live_1234567890abcdefghijklmnopqrstuvwxyz
```

**Important:**
- ⚠️ Only shown ONCE when generated
- Copy it immediately
- Store it securely

---

### 2️⃣ Webhook Secret (Optional - You Create This)

**You don't get this from Pirate Ship - you create it yourself!**

Generate a random secure string:
- Use: https://randomkeygen.com/ (CodeIgniter Encryption Keys section)
- Or generate in terminal: `openssl rand -base64 32`

Example:
```
wh_secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## Quick Setup Steps

### Step 1: Get API Key (2 minutes)

1. Go to https://www.pirateship.com/api
2. Click "Generate New API Key"
3. **Copy the key immediately** (it won't show again!)
4. Save it somewhere safe temporarily

### Step 2: Add to Vercel (2 minutes)

1. Go to https://vercel.com/
2. Select your project
3. Settings → Environment Variables
4. Add these two variables:

**Variable 1:**
```
Name: PIRATE_SHIP_API_KEY
Value: [paste your API key from Step 1]
```

**Variable 2:**
```
Name: PIRATESHIP_WEBHOOK_SECRET
Value: [paste a random secure string]
```

5. Click "Save" for each
6. Vercel will auto-redeploy (takes ~2 minutes)

### Step 3: Test (1 minute)

1. Go to your admin panel: https://www.kindkandlesboutique.com/restricted/admin
2. Go to Orders tab
3. Click "Ship" on any order with a complete address
4. You should see real USPS/UPS shipping rates! ✅

---

## That's It! 🎉

You're now connected to Pirate Ship and can:
- ✅ Get real-time shipping rates
- ✅ Create shipping labels
- ✅ Track packages
- ✅ Send tracking emails to customers

---

## Common Issues

### "Can't find API Settings in Pirate Ship"

**Solution 1:** Try the direct link
- https://www.pirateship.com/api

**Solution 2:** Check account menu
- Click your name (top right)
- Look for "API" or "Developer Settings"

**Solution 3:** Contact support
- Email: support@pirateship.com
- Say: "I need API access for my account"
- They'll enable it within 24 hours

### "No shipping rates showing in admin panel"

**Check:**
1. Did Vercel finish redeploying? (check Vercel dashboard)
2. Is the API key correct? (no extra spaces?)
3. Does the order have a complete shipping address?

**Fix:**
- Wait for deployment to complete
- Double-check the API key in Vercel
- Refresh the admin panel

### "Invalid API Key" error

**Causes:**
- Extra spaces when copying
- Using test key instead of live key
- API key not yet activated

**Fix:**
- Generate a new API key
- Copy it carefully (no spaces)
- Update in Vercel
- Wait for redeploy

---

## What You DON'T Need

❌ **Webhook URL** - Optional, only needed for advanced tracking updates
❌ **OAuth tokens** - Not used, only API key needed
❌ **Carrier accounts** - Pirate Ship handles this
❌ **Monthly subscription** - Pirate Ship is free!

---

## Next Steps (Optional)

### Set Up Webhooks for Tracking Updates

1. **In Pirate Ship** (if API page has webhook section):
   - Add webhook URL: `https://www.kindkandlesboutique.com/api/webhooks/pirateship`
   - Select events: `shipment.delivered`, `shipment.in_transit`
   - Add your `PIRATESHIP_WEBHOOK_SECRET` as the signing secret

2. **What this does:**
   - Automatically updates order status when packages are delivered
   - Sends notifications to customers
   - Updates tracking info in real-time

### Configure Default Package Dimensions

1. **In Admin Panel:**
   - Go to Settings → Shipping
   - Set default box dimensions
   - Set default weight

2. **Why this helps:**
   - Faster rate calculations
   - More accurate shipping costs
   - Less manual entry

---

## Cost Breakdown

**Pirate Ship Fees:**
- Account: **$0/month**
- API access: **$0/month**
- Rate quotes: **$0 per quote**
- Setup: **$0**

**You only pay when you buy a label:**
- USPS First Class (~1 lb): ~$4-5
- USPS Priority Mail (~3 lbs): ~$8-12
- UPS Ground: ~$10-15

**No markup, no hidden fees!**

---

## Support

**Pirate Ship Issues:**
- Email: support@pirateship.com
- Help: https://support.pirateship.com/

**Website/Integration Issues:**
- Check Vercel logs
- Check browser console
- Review admin panel errors

---

## Summary

### ✅ What You Need to Do:
1. Get API key from Pirate Ship
2. Add it to Vercel environment variables
3. Wait for deployment
4. Test in admin panel

### ⏱️ Time Required:
- Total: ~5 minutes
- Most of that is waiting for Vercel to redeploy

### 💰 Cost:
- $0 setup
- $0 monthly
- Only pay for labels you create

### 🚀 What You Get:
- Cheapest USPS/UPS rates
- One-click label creation
- Automatic tracking
- Customer notifications

**You're ready to ship! 📦🚢**

