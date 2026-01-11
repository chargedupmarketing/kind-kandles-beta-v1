import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const serverClient = createServerClient();
    const body = await request.json();
    const { dryRun = true } = body;

    console.log(`🔍 Scanning for "Default Title" variants (Dry Run: ${dryRun})...`);

    // Fetch all variants with "Default Title"
    const { data: defaultVariants, error: fetchError } = await serverClient
      .from('product_variants')
      .select(`
        id,
        title,
        product_id,
        inventory_quantity,
        products!inner(id, title)
      `)
      .ilike('title', 'Default Title');

    if (fetchError) {
      console.error('Error fetching variants:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch variants' },
        { status: 500 }
      );
    }

    if (!defaultVariants || defaultVariants.length === 0) {
      return NextResponse.json({
        message: 'No "Default Title" variants found',
        deletedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        changes: [],
      });
    }

    // Group by product
    const productGroups = new Map<string, any[]>();
    for (const variant of defaultVariants) {
      const productId = variant.product_id;
      if (!productGroups.has(productId)) {
        productGroups.set(productId, []);
      }
      productGroups.get(productId)!.push(variant);
    }

    const changes: any[] = [];
    let deletedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const [productId, variants] of productGroups) {
      const product = (variants[0] as any).products;

      // Check total variant count for this product
      const { count: totalVariants } = await serverClient
        .from('product_variants')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);

      if (totalVariants === 1 && variants.length === 1) {
        // This is the only variant - rename it instead of deleting
        const variant = variants[0];
        const newTitle = product.title;

        changes.push({
          action: 'rename',
          productTitle: product.title,
          variantId: variant.id,
          oldTitle: variant.title,
          newTitle: newTitle,
          inventoryQuantity: variant.inventory_quantity,
        });

        if (!dryRun) {
          const { error: updateError } = await serverClient
            .from('product_variants')
            .update({
              title: newTitle,
              updated_at: new Date().toISOString(),
            })
            .eq('id', variant.id);

          if (updateError) {
            console.error('Error updating variant:', updateError);
          } else {
            updatedCount++;
          }
        } else {
          updatedCount++;
        }
      } else if (totalVariants! > variants.length) {
        // There are other variants, safe to delete "Default Title" ones
        for (const variant of variants) {
          changes.push({
            action: 'delete',
            productTitle: product.title,
            variantId: variant.id,
            title: variant.title,
            inventoryQuantity: variant.inventory_quantity,
            totalVariants: totalVariants,
          });

          if (!dryRun) {
            const { error: deleteError } = await serverClient
              .from('product_variants')
              .delete()
              .eq('id', variant.id);

            if (deleteError) {
              console.error('Error deleting variant:', deleteError);
            } else {
              deletedCount++;
            }
          } else {
            deletedCount++;
          }
        }
      } else {
        skippedCount++;
        changes.push({
          action: 'skip',
          productTitle: product.title,
          reason: 'Would leave product with no variants',
          variantCount: variants.length,
        });
      }
    }

    return NextResponse.json({
      message: dryRun
        ? `Preview: Found ${defaultVariants.length} "Default Title" variants`
        : `Cleanup complete: Processed ${defaultVariants.length} variants`,
      dryRun,
      totalFound: defaultVariants.length,
      affectedProducts: productGroups.size,
      deletedCount,
      updatedCount,
      skippedCount,
      changes,
    });
  } catch (error) {
    console.error('Error in cleanup-default-titles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Just return a preview (dry run)
  return POST(request);
}

