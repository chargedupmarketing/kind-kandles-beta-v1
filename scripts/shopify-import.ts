/**
 * Shopify Data Import Script
 * 
 * This script imports data exported from Shopify into your Supabase database.
 * 
 * Usage:
 * 1. Export data from Shopify Admin (see SHOPIFY_DATA_IMPORT.md for instructions)
 * 2. Place CSV files in the /data/shopify-export/ folder
 * 3. Run: npx ts-node scripts/shopify-import.ts
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

// CSV Parser (simple implementation)
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const results: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
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

// Generate URL-friendly handle from title
function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Import Products
async function importProducts(filePath: string) {
  console.log('\n📦 Importing Products...');
  
  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  No products file found, skipping');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log(`   Found ${rows.length} product rows`);
  
  // Group by Handle (Shopify exports variants as separate rows)
  const productMap = new Map<string, any>();
  
  for (const row of rows) {
    const handle = row['Handle'] || generateHandle(row['Title']);
    
    if (!productMap.has(handle)) {
      productMap.set(handle, {
        title: row['Title'],
        handle,
        description: row['Body (HTML)'] || row['Body HTML'] || '',
        vendor: row['Vendor'] || 'My Kind Kandles',
        product_type: row['Type'] || row['Product Type'] || null,
        tags: row['Tags'] ? row['Tags'].split(',').map((t: string) => t.trim()) : [],
        status: row['Status']?.toLowerCase() === 'active' ? 'active' : 'draft',
        variants: [],
        images: []
      });
    }
    
    const product = productMap.get(handle)!;
    
    // Add variant
    const variantPrice = parseFloat(row['Variant Price'] || row['Price'] || '0');
    const compareAtPrice = parseFloat(row['Variant Compare At Price'] || row['Compare At Price'] || '0');
    
    product.variants.push({
      title: row['Option1 Value'] || row['Variant Title'] || 'Default Title',
      sku: row['Variant SKU'] || row['SKU'] || null,
      price: variantPrice,
      compare_at_price: compareAtPrice > 0 ? compareAtPrice : null,
      inventory_quantity: parseInt(row['Variant Inventory Qty'] || row['Inventory Qty'] || '0'),
      weight: parseFloat(row['Variant Grams'] || '0') / 28.35, // Convert grams to oz
      weight_unit: 'oz'
    });
    
    // Set base price from first variant
    if (!product.price) {
      product.price = variantPrice;
      product.compare_at_price = compareAtPrice > 0 ? compareAtPrice : null;
    }
    
    // Add image if present
    const imageUrl = row['Image Src'] || row['Variant Image'];
    if (imageUrl && !product.images.includes(imageUrl)) {
      product.images.push(imageUrl);
    }
  }
  
  let imported = 0;
  let skipped = 0;
  
  for (const [handle, product] of productMap) {
    try {
      // Check if product exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('handle', handle)
        .single();
      
      if (existing) {
        console.log(`   ⏭️  Skipping existing: ${product.title}`);
        skipped++;
        continue;
      }
      
      // Insert product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          title: product.title,
          handle: product.handle,
          description: product.description,
          price: product.price || 0,
          compare_at_price: product.compare_at_price,
          vendor: product.vendor,
          product_type: product.product_type,
          tags: product.tags.length > 0 ? product.tags : null,
          status: product.status
        })
        .select()
        .single();
      
      if (productError) {
        console.error(`   ❌ Error importing ${product.title}:`, productError.message);
        continue;
      }
      
      // Insert variants
      for (const variant of product.variants) {
        await supabase.from('product_variants').insert({
          product_id: newProduct.id,
          title: variant.title,
          sku: variant.sku,
          price: variant.price,
          compare_at_price: variant.compare_at_price,
          inventory_quantity: variant.inventory_quantity,
          weight: variant.weight,
          weight_unit: variant.weight_unit
        });
      }
      
      // Insert images
      for (let i = 0; i < product.images.length; i++) {
        await supabase.from('product_images').insert({
          product_id: newProduct.id,
          url: product.images[i],
          alt_text: product.title,
          position: i
        });
      }
      
      console.log(`   ✅ Imported: ${product.title}`);
      imported++;
    } catch (error: any) {
      console.error(`   ❌ Error importing ${product.title}:`, error.message);
    }
  }
  
  console.log(`\n   📊 Products: ${imported} imported, ${skipped} skipped`);
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
  
  console.log(`   Found ${rows.length} customers`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const email = row['Email']?.toLowerCase();
    if (!email) continue;
    
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
      
      await supabase.from('customers').insert({
        email,
        first_name: row['First Name'] || null,
        last_name: row['Last Name'] || null,
        phone: row['Phone'] || null,
        accepts_marketing: row['Accepts Marketing']?.toLowerCase() === 'yes',
        total_orders: parseInt(row['Total Orders'] || '0'),
        total_spent: parseFloat(row['Total Spent'] || '0')
      });
      
      imported++;
    } catch (error: any) {
      console.error(`   ❌ Error importing ${email}:`, error.message);
    }
  }
  
  console.log(`   📊 Customers: ${imported} imported, ${skipped} skipped`);
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
  
  console.log(`   Found ${rows.length} order rows`);
  
  // Group by Order Name (orders can have multiple line items)
  const orderMap = new Map<string, any>();
  
  for (const row of rows) {
    const orderName = row['Name'] || row['Order Name'];
    if (!orderName) continue;
    
    if (!orderMap.has(orderName)) {
      // Map Shopify status to our status
      let status = 'pending';
      const financialStatus = (row['Financial Status'] || '').toLowerCase();
      const fulfillmentStatus = (row['Fulfillment Status'] || '').toLowerCase();
      
      if (fulfillmentStatus === 'fulfilled') status = 'delivered';
      else if (fulfillmentStatus === 'shipped') status = 'shipped';
      else if (financialStatus === 'paid') status = 'paid';
      else if (financialStatus === 'refunded') status = 'refunded';
      
      orderMap.set(orderName, {
        order_number: orderName.replace('#', ''),
        customer_email: row['Email']?.toLowerCase() || '',
        customer_name: `${row['Billing Name'] || row['Shipping Name'] || 'Customer'}`,
        status,
        payment_status: financialStatus === 'paid' ? 'paid' : 'pending',
        subtotal: parseFloat(row['Subtotal'] || '0'),
        shipping_cost: parseFloat(row['Shipping'] || '0'),
        tax: parseFloat(row['Taxes'] || row['Tax'] || '0'),
        total: parseFloat(row['Total'] || '0'),
        discount_amount: parseFloat(row['Discount Amount'] || '0'),
        discount_code: row['Discount Code'] || null,
        shipping_address: {
          first_name: row['Shipping Name']?.split(' ')[0] || '',
          last_name: row['Shipping Name']?.split(' ').slice(1).join(' ') || '',
          address1: row['Shipping Street'] || row['Shipping Address1'] || '',
          address2: row['Shipping Address2'] || '',
          city: row['Shipping City'] || '',
          province: row['Shipping Province'] || row['Shipping State'] || '',
          postal_code: row['Shipping Zip'] || row['Shipping Postal Code'] || '',
          country: row['Shipping Country'] || 'US'
        },
        created_at: row['Created at'] || row['Created At'] || new Date().toISOString(),
        items: []
      });
    }
    
    const order = orderMap.get(orderName)!;
    
    // Add line item
    const lineitemName = row['Lineitem name'] || row['Line Item Name'];
    if (lineitemName) {
      order.items.push({
        title: lineitemName,
        quantity: parseInt(row['Lineitem quantity'] || row['Line Item Quantity'] || '1'),
        price: parseFloat(row['Lineitem price'] || row['Line Item Price'] || '0'),
        sku: row['Lineitem sku'] || row['Line Item SKU'] || null
      });
    }
  }
  
  let imported = 0;
  let skipped = 0;
  
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
          discount_amount: order.discount_amount,
          discount_code: order.discount_code,
          shipping_address: order.shipping_address,
          created_at: order.created_at
        })
        .select()
        .single();
      
      if (orderError) {
        console.error(`   ❌ Error importing order ${orderName}:`, orderError.message);
        continue;
      }
      
      // Insert line items
      for (const item of order.items) {
        // Try to find product by title or SKU
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
      
      // Update customer stats
      if (order.customer_email) {
        await supabase.rpc('update_customer_stats', { 
          customer_email_param: order.customer_email 
        }).catch(() => {});
      }
      
      imported++;
    } catch (error: any) {
      console.error(`   ❌ Error importing order ${orderName}:`, error.message);
    }
  }
  
  console.log(`   📊 Orders: ${imported} imported, ${skipped} skipped`);
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
  
  console.log(`   Found ${rows.length} discount codes`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const code = row['Code']?.toUpperCase();
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
      
      if (discountType.includes('shipping')) {
        type = 'free_shipping';
      } else if (discountType.includes('fixed') || discountType.includes('amount')) {
        type = 'fixed';
        value = parseFloat(row['Value'] || row['Amount'] || '0');
      } else {
        type = 'percentage';
        value = parseFloat(row['Value'] || row['Percentage'] || '0');
      }
      
      await supabase.from('discount_codes').insert({
        code,
        type,
        value,
        min_purchase: parseFloat(row['Minimum Purchase'] || row['Min Purchase'] || '0') || null,
        max_uses: parseInt(row['Usage Limit'] || row['Max Uses'] || '0') || null,
        uses: parseInt(row['Times Used'] || row['Uses'] || '0'),
        starts_at: row['Start Date'] || null,
        ends_at: row['End Date'] || null,
        active: row['Status']?.toLowerCase() !== 'disabled'
      });
      
      imported++;
    } catch (error: any) {
      console.error(`   ❌ Error importing ${code}:`, error.message);
    }
  }
  
  console.log(`   📊 Discounts: ${imported} imported, ${skipped} skipped`);
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
}

main().catch(console.error);

