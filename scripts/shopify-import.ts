/**
 * Shopify Data Import Script - Rewritten for proper CSV parsing
 * 
 * This script imports data exported from Shopify into your Supabase database.
 * 
 * Usage:
 * 1. Export data from Shopify Admin (see SHOPIFY_DATA_IMPORT.md for instructions)
 * 2. Place CSV files in the /data/shopify-export/ folder
 * 3. Run: npx tsx scripts/shopify-import.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Robust CSV Parser that handles quoted fields properly
function parseCSV(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  // Split by lines, handling quoted newlines
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      // Skip \r\n
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const results: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = (values[index] || '').trim();
    });
    
    results.push(row);
  }
  
  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Import Products - Using Handle as the unique identifier
async function importProducts(filePath: string) {
  console.log('\n📦 Importing Products...');
  
  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  No products file found, skipping');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`   Found ${rows.length} product rows in CSV`);
  
  // Group by Handle (Shopify exports variants as separate rows)
  const productMap = new Map<string, any>();
  
  for (const row of rows) {
    const handle = row['Handle'];
    
    // Skip rows without a handle (these are additional variant rows for the same product)
    if (!handle) continue;
    
    if (!productMap.has(handle)) {
      // First row for this product - set up the base product
      const title = row['Title'] || handle;
      const status = row['Status']?.toLowerCase() === 'active' ? 'active' : 
                     row['Status']?.toLowerCase() === 'draft' ? 'draft' : 'active';
      
      productMap.set(handle, {
        title: title.substring(0, 250),
        handle: handle.substring(0, 250),
        description: row['Body (HTML)'] || '',
        vendor: (row['Vendor'] || 'My Kind Kandles').substring(0, 250),
        product_type: (row['Type'] || '').substring(0, 250) || null,
        tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        status,
        variants: [],
        images: []
      });
    }
    
    const product = productMap.get(handle)!;
    
    // Add variant info
    const variantPrice = parseFloat(row['Variant Price'] || '0') || 0;
    const compareAtPrice = parseFloat(row['Variant Compare At Price'] || '0') || 0;
    const inventoryQty = parseInt(row['Variant Inventory Qty'] || '0') || 0;
    const variantGrams = parseFloat(row['Variant Grams'] || '0') || 0;
    
    // Build variant title from options
    let variantTitle = row['Option1 Value'] || '';
    if (row['Option2 Value']) variantTitle += ` / ${row['Option2 Value']}`;
    if (row['Option3 Value']) variantTitle += ` / ${row['Option3 Value']}`;
    variantTitle = variantTitle || 'Default Title';
    
    product.variants.push({
      title: variantTitle.substring(0, 250),
      sku: row['Variant SKU'] || null,
      price: variantPrice,
      compare_at_price: compareAtPrice > 0 ? compareAtPrice : null,
      inventory_quantity: inventoryQty,
      weight: variantGrams / 28.35, // Convert grams to oz
      weight_unit: 'oz'
    });
    
    // Set base price from first variant with a price
    if (!product.price && variantPrice > 0) {
      product.price = variantPrice;
      product.compare_at_price = compareAtPrice > 0 ? compareAtPrice : null;
    }
    
    // Add image if present and not already added
    const imageUrl = row['Image Src'];
    if (imageUrl && !product.images.some((img: any) => img.url === imageUrl)) {
      product.images.push({
        url: imageUrl,
        alt_text: row['Image Alt Text'] || product.title,
        position: parseInt(row['Image Position'] || '0') || product.images.length
      });
    }
  }
  
  console.log(`   Found ${productMap.size} unique products`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const [handle, product] of productMap) {
    try {
      // Check if product exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('handle', handle)
        .single();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Ensure we have a valid price
      const price = product.price || product.variants[0]?.price || 0;
      
      // Insert product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          title: product.title,
          handle: product.handle,
          description: product.description,
          price: price,
          compare_at_price: product.compare_at_price,
          vendor: product.vendor,
          product_type: product.product_type,
          tags: product.tags.length > 0 ? product.tags : null,
          status: product.status,
          featured: false
        })
        .select()
        .single();
      
      if (productError) {
        console.error(`   ❌ Error importing "${product.title}": ${productError.message}`);
        errors++;
        continue;
      }
      
      // Insert variants
      for (const variant of product.variants) {
        await supabase.from('product_variants').insert({
          product_id: newProduct.id,
          title: variant.title,
          sku: variant.sku,
          price: variant.price || price,
          compare_at_price: variant.compare_at_price,
          inventory_quantity: variant.inventory_quantity,
          weight: variant.weight,
          weight_unit: variant.weight_unit
        });
      }
      
      // Insert images
      for (const image of product.images) {
        await supabase.from('product_images').insert({
          product_id: newProduct.id,
          url: image.url,
          alt_text: image.alt_text,
          position: image.position
        });
      }
      
      console.log(`   ✅ Imported: ${product.title}`);
      imported++;
    } catch (error: any) {
      console.error(`   ❌ Error importing "${product.title}": ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n   📊 Products Summary:`);
  console.log(`      ✅ Imported: ${imported}`);
  console.log(`      ⏭️  Skipped (existing): ${skipped}`);
  console.log(`      ❌ Errors: ${errors}`);
}

// Import Customers
async function importCustomers(filePath: string) {
  console.log('\n👥 Importing Customers...');
  
  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  No customers file found, skipping');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`   Found ${rows.length} customers in CSV`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    const email = (row['Email'] || '').toLowerCase().trim();
    if (!email || !email.includes('@')) continue;
    
    try {
      // Check if customer exists
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      const { error } = await supabase.from('customers').insert({
        email,
        first_name: row['First Name'] || null,
        last_name: row['Last Name'] || null,
        phone: row['Phone'] || null,
        accepts_marketing: row['Accepts Marketing']?.toLowerCase() === 'yes',
        total_orders: parseInt(row['Total Orders'] || '0') || 0,
        total_spent: parseFloat(row['Total Spent'] || '0') || 0
      });
      
      if (error) {
        console.error(`   ❌ Error importing ${email}: ${error.message}`);
        errors++;
        continue;
      }
      
      imported++;
    } catch (error: any) {
      console.error(`   ❌ Error importing ${email}: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n   📊 Customers Summary:`);
  console.log(`      ✅ Imported: ${imported}`);
  console.log(`      ⏭️  Skipped (existing): ${skipped}`);
  console.log(`      ❌ Errors: ${errors}`);
}

// Import Orders
async function importOrders(filePath: string) {
  console.log('\n🛒 Importing Orders...');
  
  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  No orders file found, skipping');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`   Found ${rows.length} order rows in CSV`);
  
  // Group by Order Name (orders can have multiple line items)
  const orderMap = new Map<string, any>();
  
  for (const row of rows) {
    const orderName = row['Name'];
    if (!orderName) continue;
    
    if (!orderMap.has(orderName)) {
      // Map Shopify status to our status
      let status = 'pending';
      const financialStatus = (row['Financial Status'] || '').toLowerCase();
      const fulfillmentStatus = (row['Fulfillment Status'] || '').toLowerCase();
      
      if (fulfillmentStatus === 'fulfilled') status = 'delivered';
      else if (fulfillmentStatus === 'shipped' || fulfillmentStatus === 'partial') status = 'shipped';
      else if (financialStatus === 'paid') status = 'paid';
      else if (financialStatus === 'refunded') status = 'refunded';
      else if (financialStatus === 'partially_refunded') status = 'paid';
      
      const paymentStatus = financialStatus === 'paid' || financialStatus === 'partially_refunded' ? 'paid' : 
                           financialStatus === 'refunded' ? 'refunded' : 'pending';
      
      orderMap.set(orderName, {
        order_number: orderName.replace('#', ''),
        customer_email: (row['Email'] || 'unknown@example.com').toLowerCase().trim(),
        customer_name: row['Shipping Name'] || row['Billing Name'] || 'Customer',
        status,
        payment_status: paymentStatus,
        subtotal: parseFloat(row['Subtotal'] || '0') || 0,
        shipping_cost: parseFloat(row['Shipping'] || '0') || 0,
        tax: parseFloat(row['Taxes'] || '0') || 0,
        total: parseFloat(row['Total'] || '0') || 0,
        discount: parseFloat(row['Discount Amount'] || '0') || 0,
        discount_code: row['Discount Code'] || null,
        shipping_address_line1: row['Shipping Address1'] || row['Shipping Street'] || 'Address on file',
        shipping_address_line2: row['Shipping Address2'] || null,
        shipping_city: row['Shipping City'] || 'Unknown',
        shipping_state: row['Shipping Province'] || row['Shipping Province Name'] || 'Unknown',
        shipping_postal_code: row['Shipping Zip'] || '00000',
        shipping_country: row['Shipping Country'] || 'US',
        shipping_method: row['Shipping Method'] || null,
        created_at: row['Created at'] || new Date().toISOString(),
        items: []
      });
    }
    
    const order = orderMap.get(orderName)!;
    
    // Add line item
    const lineitemName = row['Lineitem name'];
    if (lineitemName) {
      order.items.push({
        title: lineitemName.substring(0, 250),
        quantity: parseInt(row['Lineitem quantity'] || '1') || 1,
        price: parseFloat(row['Lineitem price'] || '0') || 0,
        sku: row['Lineitem sku'] || null
      });
    }
  }
  
  console.log(`   Found ${orderMap.size} unique orders`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const [orderName, order] of orderMap) {
    try {
      // Check if order exists
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', order.order_number)
        .single();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Insert order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: order.order_number,
          customer_email: order.customer_email,
          customer_name: order.customer_name,
          status: order.status,
          payment_status: order.payment_status,
          subtotal: order.subtotal,
          shipping_cost: order.shipping_cost,
          tax: order.tax,
          total: order.total,
          discount: order.discount,
          discount_code: order.discount_code,
          shipping_address_line1: order.shipping_address_line1,
          shipping_address_line2: order.shipping_address_line2,
          shipping_city: order.shipping_city,
          shipping_state: order.shipping_state,
          shipping_postal_code: order.shipping_postal_code,
          shipping_country: order.shipping_country,
          shipping_method: order.shipping_method,
          created_at: order.created_at
        })
        .select()
        .single();
      
      if (orderError) {
        console.error(`   ❌ Error importing order ${orderName}: ${orderError.message}`);
        errors++;
        continue;
      }
      
      // Insert line items
      for (const item of order.items) {
        // Try to find product by SKU or title
        let productId = null;
        let variantId = null;
        
        if (item.sku) {
          const { data: variant } = await supabase
            .from('product_variants')
            .select('id, product_id')
            .eq('sku', item.sku)
            .single();
          
          if (variant) {
            productId = variant.product_id;
            variantId = variant.id;
          }
        }
        
        // If no SKU match, try to find by title
        if (!productId) {
          const { data: product } = await supabase
            .from('products')
            .select('id')
            .ilike('title', `%${item.title.split(' - ')[0]}%`)
            .limit(1)
            .single();
          
          if (product) {
            productId = product.id;
          }
        }
        
        await supabase.from('order_items').insert({
          order_id: newOrder.id,
          product_id: productId,
          variant_id: variantId,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        });
      }
      
      // Ensure customer exists
      const { data: customerExists } = await supabase
        .from('customers')
        .select('id')
        .eq('email', order.customer_email)
        .single();
      
      if (!customerExists && order.customer_email !== 'unknown@example.com') {
        const nameParts = order.customer_name.split(' ');
        try {
          await supabase.from('customers').insert({
            email: order.customer_email,
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(' ') || null,
            accepts_marketing: false,
            total_orders: 1,
            total_spent: order.total
          });
        } catch {
          // Ignore if already exists
        }
      }
      
      console.log(`   ✅ Imported: Order ${orderName}`);
      imported++;
    } catch (error: any) {
      console.error(`   ❌ Error importing order ${orderName}: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n   📊 Orders Summary:`);
  console.log(`      ✅ Imported: ${imported}`);
  console.log(`      ⏭️  Skipped (existing): ${skipped}`);
  console.log(`      ❌ Errors: ${errors}`);
}

// Import Discount Codes
async function importDiscounts(filePath: string) {
  console.log('\n🏷️  Importing Discount Codes...');
  
  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  No discounts file found, skipping');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`   Found ${rows.length} discount codes in CSV`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of rows) {
    const code = (row['Code'] || '').toUpperCase().trim();
    if (!code) continue;
    
    try {
      // Check if code exists
      const { data: existing } = await supabase
        .from('discount_codes')
        .select('id')
        .eq('code', code)
        .single();
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Determine type
      let type: 'percentage' | 'fixed' | 'free_shipping' = 'percentage';
      let value = 0;
      
      const discountType = (row['Type'] || row['Discount Type'] || '').toLowerCase();
      
      if (discountType.includes('shipping') || discountType.includes('free')) {
        type = 'free_shipping';
      } else if (discountType.includes('fixed') || discountType.includes('amount')) {
        type = 'fixed';
        value = parseFloat(row['Value'] || row['Amount'] || '0') || 0;
      } else {
        type = 'percentage';
        value = parseFloat(row['Value'] || row['Percentage'] || '0') || 0;
      }
      
      const { error } = await supabase.from('discount_codes').insert({
        code,
        type,
        value,
        min_purchase: parseFloat(row['Minimum Purchase'] || row['Min Purchase'] || '0') || null,
        max_uses: parseInt(row['Usage Limit'] || row['Max Uses'] || '0') || null,
        uses: parseInt(row['Times Used'] || row['Uses'] || '0') || 0,
        starts_at: row['Start Date'] || null,
        ends_at: row['End Date'] || null,
        active: row['Status']?.toLowerCase() !== 'disabled'
      });
      
      if (error) {
        console.error(`   ❌ Error importing ${code}: ${error.message}`);
        errors++;
        continue;
      }
      
      imported++;
    } catch (error: any) {
      console.error(`   ❌ Error importing ${code}: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n   📊 Discounts Summary:`);
  console.log(`      ✅ Imported: ${imported}`);
  console.log(`      ⏭️  Skipped (existing): ${skipped}`);
  console.log(`      ❌ Errors: ${errors}`);
}

// Clear existing data (optional - use with caution!)
async function clearExistingData() {
  console.log('\n🗑️  Clearing existing data...');
  
  // Delete in order to respect foreign keys
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('discount_codes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('   ✅ Existing data cleared');
}

// Main import function
async function main() {
  console.log('🚀 Shopify Data Import Script');
  console.log('============================\n');
  
  const dataDir = path.join(process.cwd(), 'data', 'shopify-export');
  
  if (!fs.existsSync(dataDir)) {
    console.log(`📁 Creating data directory: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('\n⚠️  Please place your Shopify export CSV files in:');
    console.log(`   ${dataDir}`);
    console.log('\nExpected files:');
    console.log('   - products.csv (from Products export)');
    console.log('   - customers.csv (from Customers export)');
    console.log('   - orders.csv (from Orders export)');
    console.log('   - discounts.csv (from Discounts export)');
    console.log('\nThen run this script again.');
    return;
  }
  
  // Check for files
  const files = fs.readdirSync(dataDir);
  console.log(`📁 Found files in ${dataDir}:`);
  files.forEach(f => console.log(`   - ${f}`));
  
  // Check for --clear flag
  const shouldClear = process.argv.includes('--clear');
  if (shouldClear) {
    console.log('\n⚠️  --clear flag detected. This will DELETE all existing data!');
    await clearExistingData();
  }
  
  // Find CSV files (case-insensitive)
  const findFile = (name: string) => {
    const found = files.find(f => 
      f.toLowerCase().includes(name.toLowerCase()) && 
      f.toLowerCase().endsWith('.csv')
    );
    return found ? path.join(dataDir, found) : '';
  };
  
  // Import in order (products first, then customers, then orders)
  await importProducts(findFile('product'));
  await importCustomers(findFile('customer'));
  await importOrders(findFile('order'));
  await importDiscounts(findFile('discount'));
  
  console.log('\n✨ Import complete!');
  console.log('\nNext steps:');
  console.log('1. Check your admin panel to verify imported data');
  console.log('2. Review any skipped items (already existed)');
  console.log('3. Update product images if needed');
  console.log('\nTo re-import everything fresh, run: npx tsx scripts/shopify-import.ts --clear');
}

main().catch(console.error);
