# Importing Data from Shopify

This guide explains how to export your existing data from Shopify and import it into your new Kind Kandles database.

---

## What Can Be Imported

| Data Type | Supported | Notes |
|-----------|-----------|-------|
| ✅ Products | Yes | Title, description, price, variants, images, inventory |
| ✅ Customers | Yes | Email, name, phone, marketing opt-in, order history stats |
| ✅ Orders | Yes | Order details, line items, shipping, payment status |
| ✅ Discount Codes | Yes | Code, type, value, usage limits, dates |
| ⚠️ Collections | Partial | Products are imported, but collection assignments need manual setup |
| ❌ Gift Cards | No | Not supported in current system |
| ❌ Blog Posts | No | Blog content is hardcoded in pages |

---

## Step 1: Export Data from Shopify

### Export Products

1. Go to **Shopify Admin** → **Products** → **All products**
2. Click **Export** button (top right)
3. Select:
   - **All products** (or specific selection)
   - **All fields** 
   - **CSV for Excel, Numbers, or other spreadsheet programs**
4. Click **Export products**
5. Download the CSV file
6. Rename to `products.csv`

### Export Customers

1. Go to **Shopify Admin** → **Customers**
2. Click **Export** button
3. Select:
   - **All customers**
   - **CSV for Excel...**
4. Click **Export customers**
5. Download and rename to `customers.csv`

### Export Orders

1. Go to **Shopify Admin** → **Orders**
2. Click **Export** button
3. Select:
   - **All orders** (or date range)
   - **CSV for Excel...**
4. Click **Export orders**
5. Download and rename to `orders.csv`

### Export Discount Codes

1. Go to **Shopify Admin** → **Discounts**
2. Click **Export** button
3. Download and rename to `discounts.csv`

---

## Step 2: Prepare Files for Import

1. Create the import folder:
   ```
   data/shopify-export/
   ```

2. Place your exported CSV files in this folder:
   ```
   data/
   └── shopify-export/
       ├── products.csv
       ├── customers.csv
       ├── orders.csv
       └── discounts.csv
   ```

3. Verify your `.env.local` has Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## Step 3: Run the Import Script

### Install Dependencies (if needed)

```bash
npm install dotenv
```

### Run the Import

```bash
npx ts-node scripts/shopify-import.ts
```

### What to Expect

```
🚀 Shopify Data Import Script
============================

📁 Found files in data/shopify-export:
   - products.csv
   - customers.csv
   - orders.csv
   - discounts.csv

📦 Importing Products...
   Found 45 product rows
   ✅ Imported: Lavender Dreams Candle
   ✅ Imported: Vanilla Bean Body Butter
   ⏭️  Skipping existing: Rose Garden Soap
   ...
   📊 Products: 42 imported, 3 skipped

👥 Importing Customers...
   Found 156 customers
   📊 Customers: 150 imported, 6 skipped

🛒 Importing Orders...
   Found 234 order rows
   📊 Orders: 189 imported, 45 skipped

🏷️  Importing Discount Codes...
   Found 8 discount codes
   📊 Discounts: 8 imported, 0 skipped

✨ Import complete!
```

---

## Step 4: Verify the Import

### Check Products
1. Go to Admin Panel → Products
2. Verify product count matches
3. Check that variants and images imported correctly
4. Update any missing images

### Check Customers
1. Go to Admin Panel → Customers
2. Verify customer count
3. Check that order history stats are correct

### Check Orders
1. Go to Admin Panel → Orders
2. Verify order count
3. Check that line items link to products correctly

### Check Analytics
1. Go to Admin Panel → Dashboard
2. Verify revenue totals match Shopify
3. Check top products list

---

## Troubleshooting

### "Missing Supabase environment variables"

Make sure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Products Not Importing

- Check that the CSV has the expected column headers
- Shopify exports may have different column names depending on version
- Common headers: `Handle`, `Title`, `Body (HTML)`, `Variant Price`, `Variant SKU`

### Orders Missing Line Items

- Make sure you exported with "All fields" selected
- Line items should have columns like `Lineitem name`, `Lineitem quantity`, `Lineitem price`

### Duplicate Key Errors

- The script skips existing records automatically
- If you need to re-import, delete existing data first or modify the script

### Images Not Showing

- Shopify image URLs may expire after some time
- Download images and upload to your own hosting
- Update image URLs in the database or admin panel

---

## Manual Data Entry Alternative

If you prefer not to use the import script, you can manually enter data:

### Products
1. Go to Admin Panel → Products → Add Product
2. Enter product details manually
3. Add variants and images

### Discount Codes
1. Go to Admin Panel → Discounts → Create Discount
2. Enter code details manually

### Customers
- Customers are automatically created when they place orders
- Historical customer data can be entered via the database directly

---

## Data Mapping Reference

### Product Fields

| Shopify Column | Database Field |
|----------------|----------------|
| Handle | handle |
| Title | title |
| Body (HTML) | description |
| Vendor | vendor |
| Type | product_type |
| Tags | tags |
| Status | status |
| Variant Price | price |
| Variant Compare At Price | compare_at_price |
| Variant SKU | variants.sku |
| Variant Inventory Qty | variants.inventory_quantity |
| Variant Grams | variants.weight (converted to oz) |
| Image Src | images.url |

### Order Fields

| Shopify Column | Database Field |
|----------------|----------------|
| Name | order_number |
| Email | customer_email |
| Financial Status | payment_status |
| Fulfillment Status | status |
| Subtotal | subtotal |
| Shipping | shipping_cost |
| Taxes | tax |
| Total | total |
| Discount Amount | discount_amount |
| Discount Code | discount_code |
| Created at | created_at |
| Shipping Name/Street/City/etc | shipping_address (JSON) |

### Customer Fields

| Shopify Column | Database Field |
|----------------|----------------|
| Email | email |
| First Name | first_name |
| Last Name | last_name |
| Phone | phone |
| Accepts Marketing | accepts_marketing |
| Total Orders | total_orders |
| Total Spent | total_spent |

---

## After Import Checklist

- [ ] Verify product count matches Shopify
- [ ] Check product images are displaying
- [ ] Verify customer count
- [ ] Check order totals match Shopify reports
- [ ] Test discount codes still work
- [ ] Assign products to collections manually
- [ ] Set featured products
- [ ] Update any missing product descriptions
- [ ] Review low stock alerts

---

## Need Help?

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your CSV files are properly formatted
3. Check Supabase logs for database errors
4. Try importing one data type at a time

For complex migrations, consider:
- Importing in smaller batches
- Cleaning up CSV data in Excel first
- Using Supabase's CSV import feature directly for simple tables

