import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupDefaultTitleVariants() {
  console.log('🔍 Scanning for "Default Title" variants...\n');

  // Fetch all variants with "Default Title"
  const { data: defaultVariants, error: fetchError } = await supabase
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
    console.error('❌ Error fetching variants:', fetchError);
    return;
  }

  if (!defaultVariants || defaultVariants.length === 0) {
    console.log('✅ No "Default Title" variants found!');
    return;
  }

  console.log(`📊 Found ${defaultVariants.length} "Default Title" variants\n`);

  // Group by product to see which products have these variants
  const productGroups = new Map<string, any[]>();
  for (const variant of defaultVariants) {
    const productId = variant.product_id;
    if (!productGroups.has(productId)) {
      productGroups.set(productId, []);
    }
    productGroups.get(productId)!.push(variant);
  }

  console.log(`📦 Affected products: ${productGroups.size}\n`);

  let deletedCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  for (const [productId, variants] of productGroups) {
    const product = (variants[0] as any).products;
    console.log(`\n📦 Product: "${product.title}" (ID: ${productId})`);
    console.log(`   Variants with "Default Title": ${variants.length}`);

    // Check total variant count for this product
    const { count: totalVariants } = await supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    console.log(`   Total variants: ${totalVariants}`);

    if (totalVariants === 1 && variants.length === 1) {
      // This is the only variant - rename it instead of deleting
      const variant = variants[0];
      const newTitle = product.title;
      
      console.log(`   ⚠️  This is the only variant - renaming to "${newTitle}"`);
      
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ 
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', variant.id);

      if (updateError) {
        console.error(`   ❌ Error updating variant:`, updateError);
      } else {
        console.log(`   ✅ Renamed successfully`);
        updatedCount++;
      }
    } else if (totalVariants! > variants.length) {
      // There are other variants, safe to delete "Default Title" ones
      console.log(`   🗑️  Deleting ${variants.length} "Default Title" variant(s)...`);
      
      for (const variant of variants) {
        const { error: deleteError } = await supabase
          .from('product_variants')
          .delete()
          .eq('id', variant.id);

        if (deleteError) {
          console.error(`   ❌ Error deleting variant ${variant.id}:`, deleteError);
        } else {
          console.log(`   ✅ Deleted variant (QOH: ${variant.inventory_quantity})`);
          deletedCount++;
        }
      }
    } else {
      console.log(`   ⚠️  Skipping - would leave product with no variants`);
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Cleanup Complete!');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   • Deleted: ${deletedCount} variants`);
  console.log(`   • Renamed: ${updatedCount} variants`);
  console.log(`   • Skipped: ${skippedCount} variants`);
  console.log('='.repeat(60));
}

cleanupDefaultTitleVariants()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

