# Pirate Ship Integration Setup Guide

## Overview
Pirate Ship provides the cheapest USPS and UPS shipping rates with **no monthly fees, no markup, and no hidden costs**. This guide will walk you through connecting your Pirate Ship account to your Kind Kandles website.

---

## Step 1: Create Pirate Ship Account

1. **Sign Up** (if you haven't already)
   - Go to: https://www.pirateship.com/
   - Click "Sign Up" - **It's completely FREE!**
   - Fill in your business information
   - Verify your email address

2. **Add Payment Method**
   - Go to: https://www.pirateship.com/account/billing
   - Add a credit/debit card (only charged when you buy labels)
   - No monthly fees or minimums!

---

## Step 2: Get Your API Key

### Option A: Via API Settings Page
1. **Navigate to API Settings**
   - Go to: https://www.pirateship.com/api
   - Or: Account → Settings → API

2. **Generate API Key**
   - Click "Generate New API Key"
   - **IMPORTANT**: Copy this key immediately - it only shows once!
   - Store it securely (you'll add it to Vercel next)

### Option B: Contact Support (if API page not available)
- Email: support@pirateship.com
- Request API access for your account
- They typically respond within 24 hours

---

## Step 3: Configure Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/
   - Select your project: `kind-kandles-beta-v1`
   - Go to: Settings → Environment Variables

2. **Add Pirate Ship Configuration**

   Add these environment variables:

   ```
   PIRATE_SHIP_API_KEY
   ```
   Value: `ps_live_YOUR_API_KEY_HERE`
   (The key you copied from Pirate Ship)

   ```
   PIRATESHIP_WEBHOOK_SECRET
   ```
   Value: Generate a random secure string (e.g., use https://randomkeygen.com/)
   This is used to verify webhook signatures from Pirate Ship

3. **Verify Store Address Variables**

   Make sure these are set correctly (should already be there):

   ```
   STORE_NAME = Kind Kandles
   STORE_ADDRESS_STREET = 42 2nd Ave
   STORE_ADDRESS_STREET2 = Unit 29
   STORE_ADDRESS_CITY = North Attleboro
   STORE_ADDRESS_STATE = MA
   STORE_ADDRESS_ZIP = 02760
   STORE_ADDRESS_COUNTRY = US
   STORE_EMAIL = orders@kindkandlesboutique.com
   ```

4. **Save and Redeploy**
   - Click "Save" for each variable
   - Vercel will automatically redeploy your site

---

## Step 4: Set Up Webhooks (Optional but Recommended)

Webhooks allow Pirate Ship to notify your site when shipments are delivered, tracking updates occur, etc.

1. **In Pirate Ship Dashboard**
   - Go to: https://www.pirateship.com/api (if available)
   - Or contact support to set up webhooks

2. **Add Webhook Endpoint**
   ```
   URL: https://www.kindkandlesboutique.com/api/webhooks/pirateship
   Events to subscribe to:
   - shipment.delivered
   - shipment.in_transit
   - shipment.out_for_delivery
   - shipment.exception
   ```

3. **Use Your Webhook Secret**
   - Use the `PIRATESHIP_WEBHOOK_SECRET` you created in Step 3
   - This ensures only Pirate Ship can send webhooks to your site

---

## Step 5: Test the Integration

### Test in Admin Panel

1. **Log into Admin Panel**
   - Go to: https://www.kindkandlesboutique.com/restricted/admin
   - Navigate to: Orders tab

2. **Test Shipping Rates**
   - Find an order with a complete shipping address
   - Click "Ship" button
   - You should see real USPS and UPS rates appear

3. **Create a Test Label** (Optional - will charge your card)
   - Select a shipping rate
   - Click "Create Label"
   - Check if the label is generated successfully
   - Tracking number should appear in the order

### Test via API (Advanced)

You can test the API directly:

```bash
# Test shipping rates
curl -X POST https://www.kindkandlesboutique.com/api/shipping/rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "to_address": {
      "name": "Test Customer",
      "street1": "123 Main St",
      "city": "Boston",
      "state": "MA",
      "zip": "02101",
      "country": "US"
    },
    "parcel": {
      "length": 8,
      "width": 6,
      "height": 4,
      "weight": 1
    }
  }'
```

---

## What You Get With Pirate Ship

### ✅ Features Enabled

1. **Real-Time Shipping Rates**
   - USPS First Class, Priority Mail, Priority Mail Express
   - UPS Ground, 2nd Day Air, Next Day Air
   - No markup - you pay exactly what USPS/UPS charges

2. **Quick Ship from Admin Panel**
   - Compare rates side-by-side
   - One-click label creation
   - Automatic tracking number assignment
   - Email notifications to customers

3. **Address Validation**
   - Validates customer addresses before shipping
   - Reduces delivery failures

4. **Tracking Integration**
   - Real-time tracking updates
   - Webhook notifications for delivery status
   - Customer tracking page

5. **Shipping Analytics**
   - Cost tracking per order
   - Carrier performance metrics
   - Delivery time analytics

---

## Pricing

**Pirate Ship Pricing:**
- ✅ **$0/month** - No subscription fees
- ✅ **$0 markup** - Pay exact USPS/UPS rates
- ✅ **$0 setup fees**
- ✅ **$0 hidden fees**

You only pay for the actual shipping labels you create, at the cheapest commercial rates available.

**Example Rates:**
- USPS First Class (under 1 lb): ~$4-5
- USPS Priority Mail (1-3 lbs): ~$8-12
- UPS Ground: ~$10-15

---

## Troubleshooting

### "Pirate Ship not configured" Error

**Check:**
1. Is `PIRATE_SHIP_API_KEY` set in Vercel?
2. Did you redeploy after adding the variable?
3. Is the API key valid? (starts with `ps_live_` or `ps_test_`)

**Fix:**
- Go to Vercel → Settings → Environment Variables
- Verify the key is correct
- Redeploy the site

### "Invalid API Key" Error

**Check:**
1. Did you copy the entire API key?
2. Are there any extra spaces?
3. Is your Pirate Ship account verified?

**Fix:**
- Generate a new API key in Pirate Ship
- Update it in Vercel
- Redeploy

### No Shipping Rates Returned

**Check:**
1. Is the shipping address valid?
2. Are parcel dimensions reasonable?
3. Is the destination within USPS/UPS service areas?

**Fix:**
- Verify the customer's address
- Check the order weight/dimensions
- Try a different carrier

### Webhook Not Working

**Check:**
1. Is `PIRATESHIP_WEBHOOK_SECRET` set in Vercel?
2. Is the webhook URL correct in Pirate Ship?
3. Are you subscribed to the right events?

**Fix:**
- Verify webhook URL: `https://www.kindkandlesboutique.com/api/webhooks/pirateship`
- Check Vercel logs for webhook errors
- Test webhook with Pirate Ship's test tool

---

## Support

### Pirate Ship Support
- **Email**: support@pirateship.com
- **Help Center**: https://support.pirateship.com/
- **Response Time**: Usually within 24 hours

### Your Website Support
- Check Vercel logs: https://vercel.com/dashboard
- Check browser console for errors
- Review admin panel error messages

---

## Next Steps After Setup

1. **Test thoroughly** with a few real orders
2. **Set default parcel dimensions** in admin panel (Settings → Shipping)
3. **Configure email templates** for shipping notifications
4. **Train staff** on using the Quick Ship feature
5. **Monitor shipping costs** in analytics dashboard

---

## Security Notes

⚠️ **Keep Your API Key Secure:**
- Never commit API keys to Git
- Only store in Vercel environment variables
- Rotate keys if compromised
- Use webhook secrets to verify authenticity

⚠️ **Test Before Going Live:**
- Create a few test labels with real addresses
- Verify tracking numbers work
- Test email notifications
- Check refund process

---

## Quick Reference

**Pirate Ship Dashboard**: https://www.pirateship.com/dashboard
**API Documentation**: https://api.pirateship.com/docs
**Your Webhook Endpoint**: https://www.kindkandlesboutique.com/api/webhooks/pirateship
**Your Admin Panel**: https://www.kindkandlesboutique.com/restricted/admin

---

## Summary Checklist

- [ ] Created Pirate Ship account
- [ ] Added payment method to Pirate Ship
- [ ] Generated API key from Pirate Ship
- [ ] Added `PIRATE_SHIP_API_KEY` to Vercel
- [ ] Added `PIRATESHIP_WEBHOOK_SECRET` to Vercel
- [ ] Verified store address variables in Vercel
- [ ] Redeployed site on Vercel
- [ ] Set up webhooks in Pirate Ship (optional)
- [ ] Tested shipping rates in admin panel
- [ ] Created test label (optional)
- [ ] Verified tracking works

Once all checkboxes are complete, your Pirate Ship integration is ready! 🚢⚓

