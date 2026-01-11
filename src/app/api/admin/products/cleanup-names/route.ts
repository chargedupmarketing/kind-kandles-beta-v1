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

function cleanProductName(title: string): string {
  let cleanedTitle = title;

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
    // Fetch all products with their variants
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        handle,
        variants:product_variants(id, title, option1_value)
      `)
      .order('title');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const preview = [];

    for (const product of products || []) {
      const variantCount = product.variants?.length || 0;

      // Only preview products with multiple variants
      if (variantCount <= 1) continue;

      const originalTitle = product.title;
      const cleanedTitle = cleanProductName(originalTitle);

      // Only include if the title will actually change
      if (cleanedTitle !== originalTitle && cleanedTitle.length > 0) {
        preview.push({
          id: product.id,
          originalTitle,
          cleanedTitle,
          originalHandle: product.handle,
          newHandle: generateHandle(cleanedTitle),
          variantCount
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

      // Only update products with multiple variants
      if (variantCount <= 1) continue;

      const originalTitle = product.title;
      const originalHandle = product.handle;
      const cleanedTitle = cleanProductName(originalTitle);

      // Only update if the title actually changed
      if (cleanedTitle !== originalTitle && cleanedTitle.length > 0) {
        const newHandle = generateHandle(cleanedTitle);

        // Store backup info
        backups.push({
          id: product.id,
          originalTitle,
          originalHandle,
          cleanedTitle,
          newHandle
        });

        // Update the product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            title: cleanedTitle,
            handle: newHandle,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`Error updating product ${product.id}:`, updateError);
        } else {
          updates.push({
            id: product.id,
            from: originalTitle,
            to: cleanedTitle
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

