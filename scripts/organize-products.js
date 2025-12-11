// Script to organize products by updating tags and product types
// Run with: node scripts/organize-products.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function organizeProducts() {
  console.log('Fetching products...');
  
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, title, tags, product_type')
    .order('title');

  if (fetchError) {
    console.error('Error fetching products:', fetchError);
    return;
  }

  console.log(`Found ${products.length} products`);

  const updates = [];

  for (const product of products) {
    const title = product.title.toLowerCase();
    const currentTags = product.tags || [];
    const newTags = new Set(currentTags);
    let productType = product.product_type;

    // Calm Down Girl collection - products with "calm down girl" in the title
    if (title.includes('calm down girl')) {
      newTags.add('calm-down-girl');
    }

    // Candle products
    if (title.includes('candle') || title.includes('soy candle') || productType?.toLowerCase().includes('candle')) {
      if (!productType || productType.toLowerCase().includes('candle')) {
        productType = 'CANDLE';
      }
      
      // Categorize by scent type
      if (title.includes('eucalyptus') || title.includes('spearmint') || title.includes('peppermint') || title.includes('rosemary')) {
        newTags.add('herbal');
      }
      if (title.includes('lavender') || title.includes('rose') || title.includes('blossom') || title.includes('pink rose')) {
        newTags.add('floral');
      }
      if (title.includes('lemon') || title.includes('orange') || title.includes('citrus') || title.includes('squeeze') || title.includes('happy') || title.includes('tangerine')) {
        newTags.add('citrus');
      }
      if (title.includes('cedar') || title.includes('mahogany') || title.includes('wood') || title.includes('fir') || title.includes('evergreen') || title.includes('man cave')) {
        newTags.add('woodsy');
      }
      if (title.includes('linen') || title.includes('fresh') || title.includes('sea salt') || title.includes('ocean') || title.includes('waters') || title.includes('no sad songs')) {
        newTags.add('fresh');
      }
      if (title.includes('sugar') || title.includes('vanilla') || title.includes('cheesecake') || title.includes('butterscotch') || title.includes('cocoa') || title.includes('cashmere') || title.includes('delightful') || title.includes('pink sugar')) {
        newTags.add('sweet');
      }
      if (title.includes('pumpkin') || title.includes('ginger') || title.includes('spice') || title.includes('cinnamon') || title.includes('grandma')) {
        newTags.add('earthy');
      }
    }

    // Room Spray products
    if (title.includes('room spray') || productType === 'ROOM SPRAY') {
      productType = 'ROOM SPRAY';
    }

    // Body Spray Mist products
    if (title.includes('body spray') || title.includes('body mist') || productType === 'Body mist') {
      productType = 'BODY SPRAY MIST';
    }

    // Lotion products
    if (title.includes('lotion') || productType === 'Lotion') {
      productType = 'LOTION';
    }

    // Body Butter products
    if (title.includes('body butter') || title.includes('whipped body butter') || productType?.includes('Body Butter')) {
      productType = 'BODY BUTTER';
    }

    // Body Scrub products
    if (title.includes('scrub') || title.includes('foaming body scrub') || productType?.includes('Scrub')) {
      productType = 'FOAMING BODY SCRUB';
    }

    // Bar Soap products
    if (title.includes('bar soap') || title.includes('handmade soap') || productType === 'Bar Soap') {
      productType = 'BAR SOAP';
    }

    // Body Oil products
    if (title.includes('body oil') || title.includes('hair oil') || title.includes('beard oil') || title.includes('herbal hair oil')) {
      productType = 'BODY OIL';
    }

    // Clothing & Accessories
    if (title.includes('t-shirt') || title.includes('tee') || title.includes('dress') || title.includes('hair wrap') || title.includes('tote bag') || productType === 'T-Shirt' || productType === 'Dress') {
      productType = 'CLOTHING';
      newTags.add('clothing-accessories');
    }

    // Wax Melts
    if (title.includes('wax melt')) {
      productType = 'WAX MELT';
    }

    // Check if there are changes
    const tagsArray = Array.from(newTags);
    if (
      tagsArray.length !== currentTags.length ||
      !tagsArray.every(t => currentTags.includes(t)) ||
      productType !== product.product_type
    ) {
      updates.push({
        id: product.id,
        title: product.title,
        tags: tagsArray,
        product_type: productType,
        oldTags: currentTags,
        oldProductType: product.product_type
      });
    }
  }

  console.log(`\nFound ${updates.length} products to update:\n`);

  for (const update of updates) {
    console.log(`- ${update.title}`);
    console.log(`  Product Type: ${update.oldProductType} -> ${update.product_type}`);
    console.log(`  Tags: [${update.oldTags.join(', ')}] -> [${update.tags.join(', ')}]`);
  }

  if (updates.length === 0) {
    console.log('No products need updating.');
    return;
  }

  console.log('\nApplying updates...');

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from('products')
      .update({
        tags: update.tags,
        product_type: update.product_type
      })
      .eq('id', update.id);

    if (error) {
      console.error(`Error updating ${update.title}:`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`\nDone! Updated ${successCount} products, ${errorCount} errors.`);
}

organizeProducts().catch(console.error);

