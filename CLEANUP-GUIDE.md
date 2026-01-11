# Product Name Cleanup Tool Guide

## 🎯 Overview

The Product Name Cleanup tool helps you automatically remove size information (like "8oz", "16oz") from product names when a product has multiple variants. This keeps your product names clean and consistent.

## 🌐 How to Use (Browser-Based)

### Step 1: Access the Tool

1. Log in to your admin panel
2. In the left sidebar, click **"Cleanup Names"** (under the Products section)
3. You'll see the Product Name Cleanup interface

### Step 2: Preview Changes

1. Click the **"Preview Changes"** button
2. The tool will scan all products and show you:
   - Which products will be affected
   - Original names vs. cleaned names
   - Number of variants for each product
3. Review the preview table to ensure changes look correct

### Step 3: Execute Cleanup

1. If the preview looks good, click **"Execute Cleanup"**
2. Confirm the action when prompted
3. The tool will:
   - Update all product names
   - Create an automatic backup
   - Show you a success message

### Step 4: Backup & Revert (Optional)

#### Download Backup
- After executing cleanup, click **"Download Backup"** to save a JSON file
- Store this file safely in case you need to revert later

#### Revert Changes
- If you need to undo the cleanup, click **"Revert Changes"**
- This will restore all products to their original names
- You can also upload a previously saved backup file using **"Load Backup"**

## 🔍 What Gets Cleaned Up?

The tool removes these patterns from product names:
- Size measurements: `8oz`, `16 oz`, `12 ounce`, `1 lb`, `500g`, `250ml`
- Size indicators: `(8oz)`, `[16oz]`, `- 8oz`
- Size descriptors: `Small`, `Medium`, `Large`, `XL`
- Dimension patterns: `8x10 inches`

### Examples:

| Original Name | Cleaned Name |
|--------------|--------------|
| Man Cave Candle - 8oz | Man Cave Candle |
| Lavender Dreams (16oz) | Lavender Dreams |
| Vanilla Bean - Small | Vanilla Bean |
| Ocean Breeze 12 ounce | Ocean Breeze |

## ⚠️ Important Notes

1. **Only affects products with multiple variants** - Single-variant products are not changed
2. **Backup is automatic** - Every cleanup creates a backup you can revert
3. **Safe to test** - Preview shows exactly what will change before you commit
4. **Reversible** - You can always revert changes or upload a backup file

## 🚀 Best Practices

1. **Always preview first** - Check that the cleaned names look correct
2. **Download backups** - Save backup files after each cleanup
3. **Test on a few products** - If unsure, you can revert and adjust
4. **Check your storefront** - After cleanup, verify products display correctly

## 🛠️ Alternative: Command Line Script

If you prefer to run cleanup via command line (for advanced users):

```bash
npm run cleanup-product-names
```

**Note:** The browser tool is recommended as it provides preview and revert functionality.

## 📞 Need Help?

If you encounter any issues:
1. Use the **"Revert Changes"** button to undo
2. Check that your backup file is saved
3. Contact support with the backup file if needed

## ✅ Checklist

- [ ] Access the Cleanup Names tool in admin panel
- [ ] Click "Preview Changes" to see what will be updated
- [ ] Review the preview table
- [ ] Click "Execute Cleanup" if satisfied
- [ ] Download backup file for safekeeping
- [ ] Verify products look correct on your storefront
- [ ] Keep backup file in case you need to revert

---

**Last Updated:** January 2026

