/**
 * Product Seed Script for My Kind Kandles & Boutique
 * 
 * Run this script to populate the database with initial product data.
 * Usage: npx ts-node scripts/seed-products.ts
 * 
 * Make sure to set your Supabase environment variables first:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample product data based on My Kind Kandles & Boutique
const products = [
  // CANDLES
  {
    title: 'Calm Down Girl Candle',
    handle: 'calm-down-girl-candle',
    description: 'Our signature scent that helps you unwind and relax. A perfect blend of lavender, vanilla, and chamomile. Hand-poured with 100% natural soy wax.',
    price: 24.99,
    compare_at_price: 29.99,
    collection: 'candles',
    tags: ['candle', 'relaxing', 'lavender', 'signature', 'calm-down-girl'],
    vendor: 'My Kind Kandles',
    product_type: 'Candle',
    featured: true,
    weight: 8,
    weight_unit: 'oz',
    variants: [
      { title: '4 oz', price: 14.99, inventory_quantity: 25, option1_name: 'Size', option1_value: '4 oz' },
      { title: '8 oz', price: 24.99, inventory_quantity: 30, option1_name: 'Size', option1_value: '8 oz' },
      { title: '12 oz', price: 34.99, inventory_quantity: 15, option1_name: 'Size', option1_value: '12 oz' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1602607961066-6cef0f0b4b2a?w=800', alt_text: 'Calm Down Girl Candle' }
    ]
  },
  {
    title: 'Purple Love Candle',
    handle: 'purple-love-candle',
    description: 'A romantic blend of rose, jasmine, and sandalwood. Perfect for setting the mood or as a thoughtful gift.',
    price: 22.99,
    compare_at_price: null,
    collection: 'candles',
    tags: ['candle', 'romantic', 'floral', 'rose'],
    vendor: 'My Kind Kandles',
    product_type: 'Candle',
    featured: true,
    weight: 8,
    weight_unit: 'oz',
    variants: [
      { title: '8 oz', price: 22.99, inventory_quantity: 20, option1_name: 'Size', option1_value: '8 oz' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800', alt_text: 'Purple Love Candle' }
    ]
  },
  {
    title: 'No Sad Songs for Me Candle',
    handle: 'no-sad-songs-for-me-candle',
    description: 'An uplifting citrus blend with notes of orange, bergamot, and a hint of vanilla. Brightens any room and lifts your spirits.',
    price: 24.99,
    compare_at_price: null,
    collection: 'candles',
    tags: ['candle', 'citrus', 'uplifting', 'orange'],
    vendor: 'My Kind Kandles',
    product_type: 'Candle',
    featured: true,
    weight: 8,
    weight_unit: 'oz',
    variants: [
      { title: '8 oz', price: 24.99, inventory_quantity: 18, option1_name: 'Size', option1_value: '8 oz' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1608181831718-c9ffd8b0ce6b?w=800', alt_text: 'No Sad Songs for Me Candle' }
    ]
  },
  {
    title: 'Warm Embrace Candle',
    handle: 'warm-embrace-candle',
    description: 'Cozy and comforting with notes of cinnamon, clove, and warm vanilla. Perfect for fall and winter evenings.',
    price: 24.99,
    compare_at_price: null,
    collection: 'candles',
    tags: ['candle', 'warm', 'cinnamon', 'cozy', 'fall'],
    vendor: 'My Kind Kandles',
    product_type: 'Candle',
    featured: false,
    weight: 8,
    weight_unit: 'oz',
    variants: [
      { title: '8 oz', price: 24.99, inventory_quantity: 22, option1_name: 'Size', option1_value: '8 oz' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800', alt_text: 'Warm Embrace Candle' }
    ]
  },

  // SKINCARE
  {
    title: 'Whipped Body Butter',
    handle: 'whipped-body-butter',
    description: 'Luxuriously rich and creamy body butter made with shea butter, coconut oil, and vitamin E. Deeply moisturizes and nourishes dry skin.',
    price: 18.99,
    compare_at_price: 22.99,
    collection: 'skincare',
    tags: ['skincare', 'body butter', 'moisturizer', 'shea butter'],
    vendor: 'My Kind Kandles',
    product_type: 'Body Butter',
    featured: true,
    weight: 8,
    weight_unit: 'oz',
    variants: [
      { title: 'Lavender', price: 18.99, inventory_quantity: 35, option1_name: 'Scent', option1_value: 'Lavender' },
      { title: 'Vanilla', price: 18.99, inventory_quantity: 28, option1_name: 'Scent', option1_value: 'Vanilla' },
      { title: 'Unscented', price: 18.99, inventory_quantity: 20, option1_name: 'Scent', option1_value: 'Unscented' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800', alt_text: 'Whipped Body Butter' }
    ]
  },
  {
    title: 'Foaming Body Scrub',
    handle: 'foaming-body-scrub',
    description: 'Gentle exfoliating scrub that cleanses and smooths skin. Made with natural sugar crystals and nourishing oils.',
    price: 16.99,
    compare_at_price: null,
    collection: 'skincare',
    tags: ['skincare', 'scrub', 'exfoliant', 'sugar scrub'],
    vendor: 'My Kind Kandles',
    product_type: 'Body Scrub',
    featured: true,
    weight: 10,
    weight_unit: 'oz',
    variants: [
      { title: 'Brown Sugar', price: 16.99, inventory_quantity: 25, option1_name: 'Scent', option1_value: 'Brown Sugar' },
      { title: 'Citrus Burst', price: 16.99, inventory_quantity: 22, option1_name: 'Scent', option1_value: 'Citrus Burst' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800', alt_text: 'Foaming Body Scrub' }
    ]
  },
  {
    title: 'Natural Handmade Bar Soap',
    handle: 'natural-handmade-bar-soap',
    description: 'Cold-processed artisan soap made with olive oil, coconut oil, and essential oils. Gentle enough for daily use.',
    price: 8.99,
    compare_at_price: null,
    collection: 'skincare',
    tags: ['skincare', 'soap', 'natural', 'handmade'],
    vendor: 'My Kind Kandles',
    product_type: 'Bar Soap',
    featured: true,
    weight: 4,
    weight_unit: 'oz',
    variants: [
      { title: 'Lavender Oatmeal', price: 8.99, inventory_quantity: 40, option1_name: 'Scent', option1_value: 'Lavender Oatmeal' },
      { title: 'Charcoal Tea Tree', price: 8.99, inventory_quantity: 35, option1_name: 'Scent', option1_value: 'Charcoal Tea Tree' },
      { title: 'Honey Almond', price: 8.99, inventory_quantity: 30, option1_name: 'Scent', option1_value: 'Honey Almond' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800', alt_text: 'Natural Handmade Bar Soap' }
    ]
  },

  // BODY OILS
  {
    title: 'Rosemary & Peppermint Body Oil',
    handle: 'rosemary-peppermint-body-oil',
    description: 'Invigorating body oil that awakens the senses. Perfect for post-workout recovery or morning routines.',
    price: 19.99,
    compare_at_price: null,
    collection: 'body-oils',
    tags: ['body oil', 'rosemary', 'peppermint', 'invigorating'],
    vendor: 'My Kind Kandles',
    product_type: 'Body Oil',
    featured: true,
    weight: 4,
    weight_unit: 'oz',
    variants: [
      { title: '4 oz', price: 19.99, inventory_quantity: 20, option1_name: 'Size', option1_value: '4 oz' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800', alt_text: 'Rosemary & Peppermint Body Oil' }
    ]
  },
  {
    title: 'Calm Down Girl Body Oil',
    handle: 'calm-down-girl-body-oil',
    description: 'Our signature calming blend in a luxurious body oil. Lavender, vanilla, and chamomile to help you relax.',
    price: 21.99,
    compare_at_price: null,
    collection: 'body-oils',
    tags: ['body oil', 'relaxing', 'lavender', 'calm-down-girl'],
    vendor: 'My Kind Kandles',
    product_type: 'Body Oil',
    featured: true,
    weight: 4,
    weight_unit: 'oz',
    variants: [
      { title: '4 oz', price: 21.99, inventory_quantity: 18, option1_name: 'Size', option1_value: '4 oz' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800', alt_text: 'Calm Down Girl Body Oil' }
    ]
  },

  // ROOM SPRAYS
  {
    title: 'Lavender Dreams Room Spray',
    handle: 'lavender-dreams-room-spray',
    description: 'Transform any space with the calming scent of lavender. Perfect for bedrooms and relaxation areas.',
    price: 12.99,
    compare_at_price: null,
    collection: 'room-sprays',
    tags: ['room spray', 'lavender', 'home fragrance'],
    vendor: 'My Kind Kandles',
    product_type: 'Room Spray',
    featured: false,
    weight: 4,
    weight_unit: 'oz',
    variants: [
      { title: '4 oz', price: 12.99, inventory_quantity: 30, option1_name: 'Size', option1_value: '4 oz' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1595425964071-2c1ecb10b52d?w=800', alt_text: 'Lavender Dreams Room Spray' }
    ]
  },
  {
    title: 'Fresh Linen Room Spray',
    handle: 'fresh-linen-room-spray',
    description: 'Clean, crisp scent reminiscent of freshly laundered sheets. Great for any room in your home.',
    price: 12.99,
    compare_at_price: null,
    collection: 'room-sprays',
    tags: ['room spray', 'fresh', 'linen', 'home fragrance'],
    vendor: 'My Kind Kandles',
    product_type: 'Room Spray',
    featured: false,
    weight: 4,
    weight_unit: 'oz',
    variants: [
      { title: '4 oz', price: 12.99, inventory_quantity: 25, option1_name: 'Size', option1_value: '4 oz' }
    ],
    images: [
      { url: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=800', alt_text: 'Fresh Linen Room Spray' }
    ]
  }
];

async function seedProducts() {
  console.log('Starting product seed...');

  // Get collection IDs
  const { data: collections } = await supabase
    .from('collections')
    .select('id, handle');

  if (!collections) {
    console.error('No collections found. Please run the schema first.');
    return;
  }

  const collectionMap = new Map(collections.map(c => [c.handle, c.id]));

  for (const productData of products) {
    console.log(`Creating product: ${productData.title}`);

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title: productData.title,
        handle: productData.handle,
        description: productData.description,
        price: productData.price,
        compare_at_price: productData.compare_at_price,
        collection_id: collectionMap.get(productData.collection) || null,
        tags: productData.tags,
        vendor: productData.vendor,
        product_type: productData.product_type,
        status: 'active',
        featured: productData.featured,
        weight: productData.weight,
        weight_unit: productData.weight_unit as 'oz' | 'lb' | 'kg' | 'g'
      })
      .select()
      .single();

    if (productError) {
      console.error(`Error creating product ${productData.title}:`, productError);
      continue;
    }

    // Insert variants
    for (const variant of productData.variants) {
      const { error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          title: variant.title,
          price: variant.price,
          inventory_quantity: variant.inventory_quantity,
          option1_name: variant.option1_name,
          option1_value: variant.option1_value,
          available_for_sale: variant.inventory_quantity > 0
        });

      if (variantError) {
        console.error(`Error creating variant for ${productData.title}:`, variantError);
      }
    }

    // Insert images
    for (let i = 0; i < productData.images.length; i++) {
      const image = productData.images[i];
      const { error: imageError } = await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          url: image.url,
          alt_text: image.alt_text,
          position: i
        });

      if (imageError) {
        console.error(`Error creating image for ${productData.title}:`, imageError);
      }
    }

    console.log(`✓ Created: ${productData.title}`);
  }

  console.log('\nProduct seed complete!');
}

// Run the seed
seedProducts().catch(console.error);

