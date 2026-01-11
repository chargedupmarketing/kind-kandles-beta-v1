import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Common size patterns to remove from product names
const SIZE_PATTERNS = [
  /\s*-?\s*\d+(\.\d+)?\s*(oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|ml|l)\b/gi,
  /\s*\(\s*\d+(\.\d+)?\s*(oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|ml|l)\s*\)/gi,
  /\s*\[\s*\d+(\.\d+)?\s*(oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|ml|l)\s*\]/gi,
  /\s*\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*(oz|ounce|ounces|inch|inches|cm)\b/gi,
  /\s*-\s*(small|medium|large|xl|xxl|xs|s|m|l)\b/gi,
  /\s*\(\s*(small|medium|large|xl|xxl|xs|s|m|l)\s*\)/gi,
];

// Manual product name mappings for comprehensive cleanup
const MANUAL_NAME_MAPPINGS: Record<string, string> = {
  'Royal Mahogany Woods-Compared to and inspired by BBW': 'Royal Mahogany Woods Candle',
  'Let Love Blossom- Inspired by BBW, Baja Cactus Blossom': 'Let Love Blossom Candle',
  'Strawberry Cheesecake Soy Candle-Scent Strawberry Pound Cake': 'Strawberry Cheesecake Candle',
  'Live Love Linen Soy Candle-Fresh Linen': 'Live Love Linen Candle',
  'Cozy Evergreen Woods Soy Candle-Scent Fraser Fir': 'Cozy Evergreen Woods Candle',
  'Cocoa Butter Cashmere Soy Candle-Scent Warm Vanilla Sugar': 'Cocoa Butter Cashmere Candle',
  'Cashmere Cedar Soy Candle-Scent Mahogany Teakwood': 'Cashmere Cedar Candle',
  'Beard Oil-For beards and hair': 'Beard Oil',
  'Calm Down Girl Body Spray-Eucalyptus and Spearmint': 'Calm Down Girl Body Spray',
  'Rosemary & Peppermint Natural Body Oil-For Hair and Skin': 'Rosemary & Peppermint Body Oil',
  'Exfoliating Foaming Body Scrub-Multiple Scents': 'Exfoliating Foaming Body Scrub',
  'Calm Down Girl Tote Bag With Pockets-Eucalyptus and Spearmint': 'Calm Down Girl Tote Bag',
  'No Sad Songs for Me-Sea Salt and Orchid': 'No Sad Songs for Me Candle',
  'Hey Pumpkin I think I\'m fall-ing for you-Scent Pumpkin Spice': 'Hey Pumpkin Candle',
  'Secret Waters': 'Secret Waters Candle',
  'Wax Melts': 'Wax Melts',
  'Purple Love': 'Purple Love Candle',
  'Grandma\'s House': 'Grandma\'s House Candle',
  'Happy': 'Happy Candle',
  'Delightful': 'Delightful Candle',
  'Pink Sugar': 'Pink Sugar Candle',
  'Life\'s A Squeeze': 'Life\'s A Squeeze Candle',
  'Pink Rose': 'Pink Rose Candle',
  'Live Love Linen-Room Spray': 'Live Love Linen Room Spray',
  'Happy-Room Spray': 'Happy Room Spray',
  'Calm Down Girl Room Spray': 'Calm Down Girl Room Spray',
  'Calm Down Girl Lotion': 'Calm Down Girl Lotion',
  'Cashmere Cedar Room Spray': 'Cashmere Cedar Room Spray',
  'Hair Wrap': 'Hair Wrap',
  'Calm Down Girl Ladies Dress': 'Calm Down Girl Ladies Dress',
  'Warm Embrace Body Oil': 'Warm Embrace Body Oil',
};

// Product type standardization
const PRODUCT_TYPE_MAPPINGS: Record<string, string> = {
  'CANDLE': 'Candle',
  'candle': 'Candle',
  'BODY BUTTER': 'Body Butter',
  'body-butter': 'Body Butter',
  'WAX MELT': 'Wax Melt',
  'wax-melt': 'Wax Melt',
  'ROOM SPRAY': 'Room Spray',
  'room-spray': 'Room Spray',
  'Room Spray': 'Room Spray',
  'LOTION': 'Lotion',
  'lotion': 'Lotion',
  'FOAMING BODY SCRUB': 'Body Scrub',
  'body-scrub': 'Body Scrub',
  'BAR SOAP': 'Bar Soap',
  'bar-soap': 'Bar Soap',
  'CLOTHING': 'Clothing',
  'clothing-accessories': 'Clothing',
  'BODY OIL': 'Body Oil',
  'body-oil': 'Body Oil',
  'BODY SPRAY MIST': 'Body Spray',
  'OTHER': 'Other',
};

// Tag cleanup and standardization
function cleanupTags(tags: any, productType: string): string {
  if (!tags) return '';
  
  // Handle both string and array formats
  let tagArray: string[] = [];
  if (typeof tags === 'string') {
    tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
  } else if (Array.isArray(tags)) {
    tagArray = (tags as any[]).map(t => String(t).trim()).filter(Boolean);
  } else {
    return '';
  }
  
  const cleanedTags = new Set<string>();
  
  // Add product type as a tag if not present
  const normalizedType = productType.toLowerCase().replace(/\s+/g, '-');
  cleanedTags.add(normalizedType);
  
  // Clean and standardize existing tags
  tagArray.forEach(tag => {
    const cleaned = tag.toLowerCase().trim();
    
    // Skip redundant tags
    if (cleaned === 'sku: n/a' || cleaned === 'n/a') return;
    
    // Standardize common tags
    if (cleaned.includes('eucalyptus') && cleaned.includes('spearmint')) {
      cleanedTags.add('eucalyptus-spearmint');
    } else if (cleaned.includes('calm-down-girl') || cleaned.includes('calm down girl')) {
      cleanedTags.add('calm-down-girl');
    } else if (cleaned.includes('soy-wax') || cleaned === 'soy wax') {
      cleanedTags.add('soy-wax');
    } else if (cleaned.includes('skincare')) {
      cleanedTags.add('skincare');
    } else if (cleaned.includes('fragrance')) {
      cleanedTags.add('fragrance');
    } else if (cleaned.includes('woodsy') || cleaned.includes('woody')) {
      cleanedTags.add('woodsy');
    } else if (cleaned.includes('floral')) {
      cleanedTags.add('floral');
    } else if (cleaned.includes('fresh')) {
      cleanedTags.add('fresh');
    } else if (cleaned.includes('sweet')) {
      cleanedTags.add('sweet');
    } else if (cleaned.includes('herbal')) {
      cleanedTags.add('herbal');
    } else if (cleaned !== '') {
      cleanedTags.add(cleaned.replace(/\s+/g, '-'));
    }
  });
  
  return Array.from(cleanedTags).join(', ');
}

function cleanProductName(title: string): string {
  // Check for manual mapping first
  if (MANUAL_NAME_MAPPINGS[title]) {
    return MANUAL_NAME_MAPPINGS[title];
  }
  
  let cleanedTitle = title;

  // Remove common suffixes and prefixes
  cleanedTitle = cleanedTitle
    .replace(/\s*-\s*Compared to and inspired by BBW/gi, '')
    .replace(/\s*-\s*Inspired by BBW,?\s*/gi, '')
    .replace(/\s*-\s*Scent\s+[^-]+$/gi, '')
    .replace(/\s*-\s*For\s+[^-]+$/gi, '')
    .replace(/\s*-\s*Multiple Scents$/gi, '')
    .replace(/\s*Soy Candle\s*-?\s*/gi, ' Candle ')
    .replace(/\s*-\s*Eucalyptus and (Spearmint|Orange)/gi, '');

  // Remove size patterns from the title
  for (const pattern of SIZE_PATTERNS) {
    cleanedTitle = cleanedTitle.replace(pattern, '');
  }

  // Clean up extra spaces and dashes
  cleanedTitle = cleanedTitle
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\s*-\s*-\s*/g, ' - ')  // Clean up double dashes
    .replace(/^\s*-\s*|\s*-\s*$/g, '')  // Remove leading/trailing dashes
    .trim();
  
  // Ensure "Candle" suffix for candle products if not present
  if (cleanedTitle.match(/^(Man Cave|Mental Clarity|Calm Down Girl|Royal Mahogany|Let Love|Strawberry|Live Love|Cozy|Cocoa|Lavender|Mango|Cashmere|Purple|Grandma|Happy|Delightful|Pink|Life's|No Sad)/i) && !cleanedTitle.includes('Candle') && !cleanedTitle.includes('Oil') && !cleanedTitle.includes('Spray') && !cleanedTitle.includes('Lotion')) {
    cleanedTitle += ' Candle';
  }

  return cleanedTitle;
}

function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - Preview what will be changed
export async function GET(request: NextRequest) {
  try {
    // Fetch all products with their variants, tags, and product_type
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        handle,
        tags,
        product_type,
        variants:product_variants(id, title, option1_value)
      `)
      .order('title');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const preview = [];

    for (const product of products || []) {
      const variantCount = product.variants?.length || 0;
      const originalTitle = product.title;
      const originalTags = product.tags || '';
      const originalType = product.product_type || 'Other';
      
      const cleanedTitle = cleanProductName(originalTitle);
      const standardizedType = PRODUCT_TYPE_MAPPINGS[originalType] || originalType;
      const cleanedTags = cleanupTags(originalTags, standardizedType);

      // Check if anything will change
      const titleChanged = cleanedTitle !== originalTitle && cleanedTitle.length > 0;
      const typeChanged = standardizedType !== originalType;
      const tagsChanged = cleanedTags !== originalTags;

      if (titleChanged || typeChanged || tagsChanged) {
        preview.push({
          id: product.id,
          originalTitle,
          cleanedTitle: titleChanged ? cleanedTitle : originalTitle,
          originalHandle: product.handle,
          newHandle: titleChanged ? generateHandle(cleanedTitle) : product.handle,
          originalType,
          newType: standardizedType,
          originalTags,
          newTags: cleanedTags,
          variantCount,
          changes: {
            title: titleChanged,
            type: typeChanged,
            tags: tagsChanged
          }
        });
      }
    }

    return NextResponse.json({
      preview,
      totalProducts: products?.length || 0,
      productsToUpdate: preview.length
    });
  } catch (error) {
    console.error('Error in cleanup preview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Execute the cleanup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = body; // Optional: specific product IDs to update

    // Fetch products to update
    let query = supabase
      .from('products')
      .select(`
        id,
        title,
        handle,
        tags,
        product_type,
        variants:product_variants(id)
      `);

    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds);
    }

    const { data: products, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const updates = [];
    const backups = [];

    for (const product of products || []) {
      const variantCount = product.variants?.length || 0;
      const originalTitle = product.title;
      const originalHandle = product.handle;
      const originalTags = product.tags || '';
      const originalType = product.product_type || 'Other';
      
      const cleanedTitle = cleanProductName(originalTitle);
      const standardizedType = PRODUCT_TYPE_MAPPINGS[originalType] || originalType;
      const cleanedTags = cleanupTags(originalTags, standardizedType);

      // Check if anything needs updating
      const titleChanged = cleanedTitle !== originalTitle && cleanedTitle.length > 0;
      const typeChanged = standardizedType !== originalType;
      const tagsChanged = cleanedTags !== originalTags;

      if (titleChanged || typeChanged || tagsChanged) {
        const newHandle = titleChanged ? generateHandle(cleanedTitle) : originalHandle;

        // Store backup info
        backups.push({
          id: product.id,
          originalTitle,
          originalHandle,
          originalTags,
          originalType,
          cleanedTitle: titleChanged ? cleanedTitle : originalTitle,
          newHandle,
          newTags: cleanedTags,
          newType: standardizedType
        });

        // Prepare update object
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (titleChanged) {
          updateData.title = cleanedTitle;
          updateData.handle = newHandle;
        }
        if (typeChanged) {
          updateData.product_type = standardizedType;
        }
        if (tagsChanged) {
          updateData.tags = cleanedTags;
        }

        // Update the product
        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', product.id);

        if (updateError) {
          console.error(`Error updating product ${product.id}:`, updateError);
        } else {
          updates.push({
            id: product.id,
            changes: {
              title: titleChanged ? { from: originalTitle, to: cleanedTitle } : null,
              type: typeChanged ? { from: originalType, to: standardizedType } : null,
              tags: tagsChanged ? { from: originalTags, to: cleanedTags } : null
            }
          });
        }
      }
    }

    // Store backup in a simple format (you could also store this in a database table)
    return NextResponse.json({
      success: true,
      updatedCount: updates.length,
      updates,
      backup: backups,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cleanup execution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Revert changes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { backup } = body;

    if (!backup || !Array.isArray(backup)) {
      return NextResponse.json({ error: 'Backup data is required' }, { status: 400 });
    }

    const reverted = [];

    for (const item of backup) {
      const { error: revertError } = await supabase
        .from('products')
        .update({
          title: item.originalTitle,
          handle: item.originalHandle,
          tags: item.originalTags,
          product_type: item.originalType,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (revertError) {
        console.error(`Error reverting product ${item.id}:`, revertError);
      } else {
        reverted.push({
          id: item.id,
          from: item.cleanedTitle,
          to: item.originalTitle
        });
      }
    }

    return NextResponse.json({
      success: true,
      revertedCount: reverted.length,
      reverted
    });
  } catch (error) {
    console.error('Error in cleanup revert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

