import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/admin/products/organize - Organize products by adding tags based on title patterns
// Updated: Dec 11, 2025
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Fetch all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, title, tags, product_type')
      .order('title');

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const updates: { id: string; tags: string[]; product_type?: string }[] = [];

    for (const product of products || []) {
      const title = product.title.toLowerCase();
      const currentTags: string[] = Array.isArray(product.tags) ? product.tags.map(String) : [];
      const newTags = new Set<string>(currentTags);
      let productType = product.product_type;

      // Calm Down Girl collection - products with "calm down girl" in the title
      if (title.includes('calm down girl')) {
        newTags.add('calm-down-girl');
      }

      // Candle products
      if (title.includes('candle') || title.includes('soy candle')) {
        productType = 'CANDLE';
        
        // Categorize by scent type
        if (title.includes('eucalyptus') || title.includes('spearmint') || title.includes('peppermint') || title.includes('rosemary')) {
          newTags.add('herbal');
        }
        if (title.includes('lavender') || title.includes('rose') || title.includes('blossom')) {
          newTags.add('floral');
        }
        if (title.includes('lemon') || title.includes('orange') || title.includes('citrus') || title.includes('squeeze')) {
          newTags.add('citrus');
        }
        if (title.includes('cedar') || title.includes('mahogany') || title.includes('wood') || title.includes('fir') || title.includes('evergreen')) {
          newTags.add('woodsy');
        }
        if (title.includes('linen') || title.includes('fresh') || title.includes('sea salt') || title.includes('ocean') || title.includes('waters')) {
          newTags.add('fresh');
        }
        if (title.includes('sugar') || title.includes('vanilla') || title.includes('cheesecake') || title.includes('butterscotch') || title.includes('cocoa') || title.includes('cashmere') || title.includes('delightful')) {
          newTags.add('sweet');
        }
        if (title.includes('pumpkin') || title.includes('ginger') || title.includes('spice') || title.includes('cinnamon')) {
          newTags.add('earthy');
        }
      }

      // Room Spray products
      if (title.includes('room spray')) {
        productType = 'ROOM SPRAY';
      }

      // Body Spray Mist products
      if (title.includes('body spray') || title.includes('body mist')) {
        productType = 'BODY SPRAY MIST';
      }

      // Lotion products
      if (title.includes('lotion')) {
        productType = 'LOTION';
      }

      // Body Butter products
      if (title.includes('body butter') || title.includes('whipped body butter')) {
        productType = 'BODY BUTTER';
      }

      // Body Scrub products
      if (title.includes('scrub') || title.includes('foaming body scrub')) {
        productType = 'FOAMING BODY SCRUB';
      }

      // Bar Soap products
      if (title.includes('bar soap') || title.includes('handmade soap')) {
        productType = 'BAR SOAP';
      }

      // Body Oil products
      if (title.includes('body oil') || title.includes('hair oil') || title.includes('beard oil') || title.includes('herbal hair oil')) {
        productType = 'BODY OIL';
      }

      // Clothing & Accessories
      if (title.includes('t-shirt') || title.includes('tee') || title.includes('dress') || title.includes('hair wrap') || title.includes('tote bag')) {
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
          tags: tagsArray,
          product_type: productType
        });
      }
    }

    // Apply updates
    const results = [];
    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({
          tags: update.tags,
          product_type: update.product_type
        })
        .eq('id', update.id);

      if (error) {
        results.push({ id: update.id, success: false, error: error.message });
      } else {
        results.push({ id: update.id, success: true, tags: update.tags, product_type: update.product_type });
      }
    }

    return NextResponse.json({
      message: `Organized ${results.filter(r => r.success).length} products`,
      totalProducts: products?.length || 0,
      updatedProducts: results.filter(r => r.success).length,
      results
    });
  } catch (error) {
    console.error('Organize products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/products/organize - Preview organization without applying
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, tags, product_type')
      .order('title');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Return current product organization
    const summary = {
      total: products?.length || 0,
      byProductType: {} as Record<string, number>,
      byTag: {} as Record<string, number>,
      products: products?.map(p => ({
        id: p.id,
        title: p.title,
        product_type: p.product_type,
        tags: p.tags
      }))
    };

    for (const product of products || []) {
      const type = product.product_type || 'Uncategorized';
      summary.byProductType[type] = (summary.byProductType[type] || 0) + 1;
      
      for (const tag of product.tags || []) {
        summary.byTag[tag] = (summary.byTag[tag] || 0) + 1;
      }
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Preview organization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

