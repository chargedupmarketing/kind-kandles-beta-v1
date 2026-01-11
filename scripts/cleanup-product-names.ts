import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Common size patterns to remove from product names
const SIZE_PATTERNS = [
  /\s*-?\s*\d+(\.\d+)?\s*(oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|ml|l)\b/gi,
  /\s*\(\s*\d+(\.\d+)?\s*(oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|ml|l)\s*\)/gi,
  /\s*\[\s*\d+(\.\d+)?\s*(oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|ml|l)\s*\]/gi,
  /\s*\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*(oz|ounce|ounces|inch|inches|cm)\b/gi,
  /\s*-\s*(small|medium|large|xl|xxl|xs|s|m|l)\b/gi,
  /\s*\(\s*(small|medium|large|xl|xxl|xs|s|m|l)\s*\)/gi,
];

interface Product {
  id: string;
  title: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    option1_value?: string;
  }>;
}

async function cleanupProductNames() {
  console.log('🧹 Starting product name cleanup...\n');

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
    console.error('❌ Error fetching products:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No products found');
    return;
  }

  console.log(`Found ${products.length} products\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const product of products as unknown as Product[]) {
    const variantCount = product.variants?.length || 0;

    // Only clean up products with multiple variants
    if (variantCount <= 1) {
      skippedCount++;
      continue;
    }

    const originalTitle = product.title;
    let cleanedTitle = originalTitle;

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

    // Only update if the title actually changed
    if (cleanedTitle !== originalTitle && cleanedTitle.length > 0) {
      // Generate new handle from cleaned title
      const newHandle = cleanedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      console.log(`📝 Updating: "${originalTitle}"`);
      console.log(`   → "${cleanedTitle}"`);
      console.log(`   Variants: ${variantCount}`);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: cleanedTitle,
          handle: newHandle,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated successfully\n`);
        updatedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Cleanup complete!`);
  console.log(`   Updated: ${updatedCount} products`);
  console.log(`   Skipped: ${skippedCount} products (single variant or no changes needed)`);
  console.log('='.repeat(60));
}

// Run the cleanup
cleanupProductNames()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

