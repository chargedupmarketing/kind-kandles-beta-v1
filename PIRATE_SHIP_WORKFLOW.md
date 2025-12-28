# Pirate Ship Manual Workflow Guide

## Overview

Since Pirate Ship doesn't have a public API, this guide explains how to use Pirate Ship with your Kind Kandles website through a **CSV export/import workflow**. This manual process allows you to get the cheapest shipping rates ($0 fees!) while still managing orders through your admin panel.

---

## 🎯 Quick Summary

**The Process:**
1. Export orders from your admin panel → CSV file
2. Upload CSV to Pirate Ship → Create labels
3. Download tracking numbers from Pirate Ship → CSV file
4. Import tracking CSV back to your admin panel → Updates orders

**Time Required:** ~5-10 minutes for a batch of orders  
**Cost:** $0 in platform fees (only pay for actual shipping labels)

---

## Step-by-Step Workflow

### Step 1: Export Orders from Admin Panel

#### On Desktop:
1. Go to: https://www.kindkandlesboutique.com/restricted/admin
2. Click **"Orders"** in the sidebar
3. (Optional) Filter orders by status (e.g., "Pending" or "Processing")
4. Click the **"Export CSV"** button (purple button with download icon)
5. A file named `pirateship-orders-YYYY-MM-DD.csv` will download

#### On Mobile:
1. Open admin panel on your phone
2. Tap **"Orders"** tab at the bottom
3. Tap the **"⋮"** (three dots) button in the top right
4. Tap **"Export to CSV"**
5. The CSV file will download to your phone

**What's in the CSV:**
- Customer name
- Shipping address
- Email & phone
- Order number
- Estimated weight
- Notes

---

### Step 2: Upload to Pirate Ship

1. **Go to Pirate Ship:**
   - https://www.pirateship.com/ship

2. **Import the CSV:**
   - Click **"Import"** or **"Bulk Ship"**
   - Select **"Upload Spreadsheet"**
   - Choose the CSV file you exported
   - Click **"Import"**

3. **Review Orders:**
   - Pirate Ship will show all orders from the CSV
   - Verify addresses are correct
   - Adjust package dimensions if needed (default is 10x8x6, 2 lbs)

4. **Select Shipping Methods:**
   - For each order, choose:
     - USPS First Class (cheapest, under 1 lb)
     - USPS Priority Mail (2-3 days)
     - USPS Priority Mail Express (overnight)
     - UPS Ground (for heavier packages)
   
5. **Buy Labels:**
   - Click **"Buy Labels"** for all orders
   - Your credit card will be charged
   - Labels will be generated instantly

6. **Print Labels:**
   - Download all labels as PDF
   - Print on regular paper (no special label printer needed!)
   - Tape to packages

---

### Step 3: Export Tracking from Pirate Ship

1. **In Pirate Ship Dashboard:**
   - Go to **"Shipments"** or **"History"**
   - Find the orders you just created labels for
   - Click **"Export"** or **"Download CSV"**
   - Select columns:
     - ✅ Order Number
     - ✅ Tracking Number
     - ✅ Tracking URL (optional)
     - ✅ Carrier (optional)
   - Download the CSV

2. **Alternative Method (Manual):**
   - If Pirate Ship doesn't have a direct export:
   - Create a CSV file with these columns:
     ```
     Order Number,Tracking Number,Tracking URL,Carrier
     ORD-12345,9400111899223344556677,https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223344556677,USPS
     ```

---

### Step 4: Import Tracking to Your Admin Panel

#### On Desktop:
1. Go back to your admin panel: **Orders** section
2. Click the **"Import Tracking"** button (teal button with upload icon)
3. Select the tracking CSV file from Pirate Ship
4. Click **"Open"**
5. You'll see a success message: "Successfully imported X tracking numbers!"
6. Orders will automatically update to "Shipped" status
7. Customers will receive shipping notification emails

#### On Mobile:
1. Open admin panel
2. Go to **"Orders"** tab
3. Tap **"⋮"** (three dots) → **"Import Tracking"**
4. Select the CSV file
5. Done! Orders are updated

**What Happens:**
- ✅ Order status changes to "Shipped"
- ✅ Tracking number is saved
- ✅ Tracking URL is saved (if provided)
- ✅ Shipped date is recorded
- ✅ Customer receives email notification

---

## 📋 CSV Format Requirements

### Export CSV (from your admin panel)
Your system automatically generates this in the correct format for Pirate Ship.

**Columns:**
```
Name, Company, Address 1, Address 2, City, State, Zip, Country, Email, Phone, Order Number, Weight (oz), Notes
```

**Example:**
```csv
Name,Company,Address 1,Address 2,City,State,Zip,Country,Email,Phone,Order Number,Weight (oz),Notes
"Jane Smith","","123 Main St","Apt 4","Boston","MA","02101","US","jane@example.com","555-1234","ORD-12345","12",""
```

### Import CSV (from Pirate Ship)
Your system accepts flexible column names.

**Required Columns:**
- `Order Number` (or `Order ID`, `order_number`, `order_id`)
- `Tracking Number` (or `Tracking`, `tracking_number`, `tracking`)

**Optional Columns:**
- `Tracking URL` (or `Tracking Link`, `tracking_url`)
- `Carrier` (or `Shipping Carrier`, `carrier`)

**Example:**
```csv
Order Number,Tracking Number,Tracking URL,Carrier
ORD-12345,9400111899223344556677,https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223344556677,USPS
ORD-12346,1Z9999999999999999,https://www.ups.com/track?tracknum=1Z9999999999999999,UPS
```

---

## 💡 Tips & Best Practices

### Batch Processing
- **Process orders in batches** (e.g., once per day or twice per week)
- Export all pending orders at once
- Create all labels in one Pirate Ship session
- Import all tracking numbers together

### Package Dimensions
- **Set default dimensions in Pirate Ship** to save time
- Typical candle: 4x4x6 inches, 12-16 oz
- Multiple candles: 10x8x6 inches, 2-3 lbs
- Adjust for actual package size to get accurate rates

### Weight Estimation
- The system estimates weight based on order items
- Default: 12 oz per candle
- Adjust in Pirate Ship if needed for accurate shipping costs

### Address Validation
- Pirate Ship validates addresses automatically
- Fix any address errors before buying labels
- This prevents delivery failures

### Tracking Notifications
- Customers automatically receive email when you import tracking
- Email includes tracking number and link
- No need to manually notify customers

---

## 🚨 Troubleshooting

### "No orders to export"
**Problem:** Export button returns error  
**Solution:** 
- Make sure you have orders with status "pending", "processing", or "paid"
- Try removing status filters
- Check that orders have complete shipping addresses

### "Order not found" during import
**Problem:** Tracking import says order doesn't exist  
**Solution:**
- Verify the Order Number in the CSV matches exactly
- Check for extra spaces or special characters
- Make sure you're using the correct order number format (e.g., "ORD-12345")

### "Failed to import tracking numbers"
**Problem:** Import fails completely  
**Solution:**
- Check CSV format (must have "Order Number" and "Tracking Number" columns)
- Make sure file is saved as CSV (not Excel .xlsx)
- Try opening CSV in a text editor to verify format
- Remove any special characters or formatting

### Pirate Ship won't accept CSV
**Problem:** Pirate Ship rejects the uploaded file  
**Solution:**
- Make sure you're using the "Import Spreadsheet" feature
- Try opening the CSV in Excel and re-saving as CSV
- Check that all required fields are present
- Remove any rows with missing addresses

### Wrong tracking numbers imported
**Problem:** Tracking numbers don't match orders  
**Solution:**
- Double-check the Order Number column in your tracking CSV
- Make sure Pirate Ship exported the correct order numbers
- If needed, manually create a CSV with correct mappings

---

## 📊 Workflow Comparison

### Manual Pirate Ship Workflow (What You're Using)
**Pros:**
- ✅ $0 platform fees
- ✅ Cheapest shipping rates (no markup)
- ✅ Simple process
- ✅ Full control over label creation

**Cons:**
- ❌ Manual CSV export/import
- ❌ No real-time rate quotes on checkout
- ❌ Takes 5-10 minutes per batch
- ❌ Requires Pirate Ship account

**Best For:**
- Low to medium order volume (< 50 orders/day)
- Cost-conscious businesses
- Batch processing workflow

### Automated API Workflow (Alternative)
**Pros:**
- ✅ Automatic rate quotes on checkout
- ✅ One-click label creation
- ✅ Real-time tracking updates
- ✅ No manual CSV work

**Cons:**
- ❌ $0.05-0.10 per label in API fees
- ❌ Monthly fees ($10-50/month)
- ❌ More complex setup

**Best For:**
- High order volume (> 50 orders/day)
- Real-time shipping quotes needed
- Fully automated workflow

---

## 🔄 Typical Weekly Workflow

### Monday Morning:
1. Log into admin panel
2. Filter orders: Status = "Pending" or "Processing"
3. Export CSV (30 seconds)
4. Upload to Pirate Ship (2 minutes)
5. Review addresses, select shipping methods (5 minutes)
6. Buy labels (1 minute)
7. Print labels (2 minutes)
8. Export tracking from Pirate Ship (1 minute)
9. Import tracking to admin panel (30 seconds)
10. **Total time: ~12 minutes**

### Throughout the week:
- Pack orders and apply labels
- Drop off at USPS or schedule pickup
- Customers automatically get tracking emails
- Track shipments in Pirate Ship dashboard

### Friday (if needed):
- Repeat process for any new orders
- Or wait until Monday for next batch

---

## 💰 Cost Breakdown

### What You Pay:
- **Pirate Ship Account:** $0/month
- **CSV Export/Import:** $0
- **Actual Shipping (examples):**
  - USPS First Class (8 oz): ~$4.50
  - USPS Priority Mail (2 lbs): ~$9.00
  - USPS Priority Mail (3 lbs): ~$12.00
  - UPS Ground (5 lbs): ~$15.00

### What You Save:
- No monthly platform fees
- No per-label API fees
- No markup on shipping rates
- **Savings: $50-200/month** compared to automated solutions

---

## 📞 Support

### Pirate Ship Issues:
- **Email:** support@pirateship.com
- **Help:** https://support.pirateship.com/
- **Phone:** Available through their website

### Admin Panel Issues:
- Check browser console for errors
- Verify CSV format
- Contact your developer

### Shipping Issues:
- Track packages in Pirate Ship dashboard
- Contact USPS/UPS for delivery problems
- File claims through Pirate Ship if needed

---

## ✅ Quick Reference Checklist

**Before You Start:**
- [ ] Pirate Ship account created
- [ ] Payment method added to Pirate Ship
- [ ] Printer ready for labels

**For Each Batch:**
- [ ] Export orders from admin panel
- [ ] Upload CSV to Pirate Ship
- [ ] Review addresses and weights
- [ ] Select shipping methods
- [ ] Buy labels
- [ ] Print labels
- [ ] Export tracking from Pirate Ship
- [ ] Import tracking to admin panel
- [ ] Pack orders and apply labels
- [ ] Drop off or schedule pickup

**Weekly:**
- [ ] Process orders 1-2 times per week
- [ ] Check for any delivery issues
- [ ] Respond to customer shipping questions

---

## 🚀 Next Steps

1. **Test the workflow** with 1-2 orders first
2. **Time yourself** to see how long it takes
3. **Optimize your process** (batch similar orders, pre-print labels, etc.)
4. **Train any staff** who will be handling shipping
5. **Set a schedule** (e.g., ship every Monday and Thursday)

---

**You're all set! This workflow will save you money while keeping shipping simple and efficient.** 🚢📦

Need help? The export/import buttons are clearly marked in both desktop and mobile admin panels with the 🚢 Pirate Ship branding!

