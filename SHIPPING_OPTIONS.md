# Shipping Integration Options for Kind Kandles

## ⚠️ Important Update: Pirate Ship Does NOT Have an API

I apologize for the confusion - **Pirate Ship does not offer a public API**. They only provide integrations through their web platform for specific eCommerce platforms (Shopify, WooCommerce, etc.).

Since you have a custom website, you need a shipping provider that offers an actual API. Here are your best options:

---

## Option 1: EasyPost (Recommended) ⭐

### Overview
- **Most popular shipping API** for developers
- Supports USPS, UPS, FedEx, DHL, and 100+ carriers
- Clean, well-documented API
- Great for small to medium businesses

### Pricing
- **Free tier**: Up to 10,000 shipments/month
- **Pay-as-you-go**: $0.05 per label after free tier
- **No monthly fees**
- **No markup on carrier rates** (you pay exact USPS/UPS prices)

### Features
- ✅ Real-time rate shopping
- ✅ Label generation
- ✅ Address validation
- ✅ Tracking webhooks
- ✅ Insurance options
- ✅ Batch label creation

### How to Get Started
1. Sign up: https://www.easypost.com/signup
2. Get API key from dashboard
3. Add to Vercel environment variables
4. I'll update the code to use EasyPost

### API Key Location
- Dashboard → API Keys → Production Key

---

## Option 2: ShipEngine (Also Great) ⭐

### Overview
- **Owned by ShipStation** (trusted brand)
- Supports all major carriers
- Very competitive pricing
- Excellent documentation

### Pricing
- **Free tier**: Up to 50 labels/month
- **Starter**: $10/month for 500 labels
- **Growth**: $50/month for 5,000 labels
- **No markup on carrier rates**

### Features
- ✅ Multi-carrier rate comparison
- ✅ Label printing
- ✅ Address validation
- ✅ Package tracking
- ✅ Customs forms (international)
- ✅ Return labels

### How to Get Started
1. Sign up: https://www.shipengine.com/signup
2. Get API key from dashboard
3. Add to Vercel environment variables
4. I'll update the code to use ShipEngine

### API Key Location
- Dashboard → Settings → API Keys

---

## Option 3: ShipStation (Full Platform)

### Overview
- **Complete shipping platform** with API
- Best if you want a full shipping management system
- Web interface + API access
- Used by many eCommerce businesses

### Pricing
- **Starter**: $9.99/month (50 shipments)
- **Bronze**: $29.99/month (500 shipments)
- **Silver**: $49.99/month (1,500 shipments)
- **Gold**: $69.99/month (3,000 shipments)

### Features
- ✅ Full web dashboard
- ✅ Batch processing
- ✅ Automation rules
- ✅ Multi-carrier support
- ✅ Branded tracking pages
- ✅ API access

### How to Get Started
1. Sign up: https://www.shipstation.com/
2. Enable API access in settings
3. Get API key and secret
4. I'll update the code to use ShipStation

---

## Option 4: Keep Pirate Ship (Manual Workflow)

### How It Would Work
Since Pirate Ship has no API, you'd use it manually:

1. **Customer places order** → Saved in your database
2. **Export orders to CSV** → From your admin panel
3. **Upload to Pirate Ship** → https://www.pirateship.com/integrations/spreadsheets
4. **Create labels in Pirate Ship** → Bulk process
5. **Export tracking numbers** → Download CSV from Pirate Ship
6. **Import back to your site** → Upload to admin panel

### Pros
- ✅ Cheapest shipping rates (no markup at all)
- ✅ No monthly fees
- ✅ No per-label API fees

### Cons
- ❌ Manual process (extra work)
- ❌ No real-time rate quotes on checkout
- ❌ No automatic tracking updates
- ❌ More room for errors

---

## Comparison Table

| Provider | Free Tier | Monthly Cost | Per Label | API Access | Best For |
|----------|-----------|--------------|-----------|------------|----------|
| **EasyPost** | 10,000 labels | $0 | $0.05 | ✅ Yes | Most businesses |
| **ShipEngine** | 50 labels | $0-50 | $0 | ✅ Yes | Growing businesses |
| **ShipStation** | None | $9.99+ | Included | ✅ Yes | High volume |
| **Pirate Ship** | Unlimited | $0 | $0 | ❌ No | Manual workflow |

---

## My Recommendation: EasyPost

### Why EasyPost?
1. **Free for your volume** (10,000 labels/month is generous)
2. **No monthly fees** (perfect for starting out)
3. **Best documentation** (easiest to integrate)
4. **Most reliable** (used by thousands of businesses)
5. **No markup** (you pay exact carrier rates)

### Cost Example (Your Business)
Let's say you ship 100 orders/month:
- **EasyPost**: $0/month (under free tier)
- **ShipEngine**: $10/month (over free tier)
- **ShipStation**: $29.99/month (for 500 shipments)
- **Pirate Ship**: $0/month (but manual work)

**Actual shipping costs** (USPS Priority Mail ~3 lbs):
- All providers: ~$8-12 per package (same rates)

---

## What I Need From You

**Choose your preferred option:**

### Option A: EasyPost (My Recommendation)
- Sign up at: https://www.easypost.com/signup
- Get your API key
- Give it to me and I'll integrate it

### Option B: ShipEngine
- Sign up at: https://www.shipengine.com/signup
- Get your API key
- Give it to me and I'll integrate it

### Option C: ShipStation
- Sign up at: https://www.shipstation.com/
- Get API key + secret
- Give it to me and I'll integrate it

### Option D: Pirate Ship (Manual)
- I'll build a CSV export/import system
- You'll process labels manually in Pirate Ship
- More work but $0 in fees

---

## Next Steps

1. **Tell me which option you prefer**
2. **Sign up for that service**
3. **Get your API credentials**
4. **I'll update all the code** to use that provider
5. **Test it in your admin panel**

---

## Questions?

**"Which one is really the best?"**
- For most small businesses: **EasyPost**
- If you want a full platform: **ShipStation**
- If you want to save every penny: **Pirate Ship (manual)**

**"Can I switch later?"**
- Yes! The code structure makes it easy to swap providers

**"What about Shippo?"**
- They denied your API request, so not an option

**"Will rates be the same?"**
- Yes! All providers give you the same USPS/UPS commercial rates
- The only difference is the API fee (if any)

---

Let me know which option you want and I'll get it set up! 🚀

