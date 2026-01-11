import { supabase } from '../src/lib/supabase';

// Manual product name cleanups - more comprehensive than the automated tool
const manualCleanups: Record<string, string> = {
  // Remove redundant descriptors and clean up formatting
  'Mental Clarity-Eucalyptus and Orange': 'Mental Clarity Candle',
  'Calm Down Girl-Eucalyptus and Spearmint Candle': 'Calm Down Girl Candle',
  'Royal Mahogany Woods-Compared to and inspired by BBW': 'Royal Mahogany Woods Candle',
  'Let Love Blossom- Inspired by BBW, Baja Cactus Blossom': 'Let Love Blossom Candle',
  'Live Love Linen Soy Candle-Fresh Linen': 'Live Love Linen Candle',
  'Cozy Evergreen Woods Soy Candle-Scent Fraser Fir': 'Cozy Evergreen Woods Candle',
  'Beard Oil-For beards and hair': 'Beard Oil',
  'No Sad Songs for Me-Sea Salt and Orchid': 'No Sad Songs for Me Candle',
  'Life\'s A Squeeze': 'Life\'s A Squeeze Candle',
  'Hey Pumpkin, I think I\'m falling for you': 'Hey Pumpkin Candle',
  'Grandma\'s House': 'Grandma\'s House Candle',
  'Happy-Room Spray': 'Happy Room Spray',
  'Live Love Linen-Room Spray': 'Live Love Linen Room Spray',
};

function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function cleanupProductNames() {
  console.log('🧹 Starting manual product name cleanup...\n');

  const updates = [];
  const errors = [];

  for (const [oldName, newName] of Object.entries(manualCleanups)) {
    try {
      // Find product by old name
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, title, handle')
        .eq('title', oldName);

      if (fetchError) {
        errors.push(`Error fetching "${oldName}": ${fetchError.message}`);
        continue;
      }

      if (!products || products.length === 0) {
        console.log(`⚠️  Product not found: "${oldName}"`);
        continue;
      }

      const product = products[0];
      const newHandle = generateHandle(newName);

      // Update the product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: newName,
          handle: newHandle,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) {
        errors.push(`Error updating "${oldName}": ${updateError.message}`);
      } else {
        updates.push({
          id: product.id,
          from: oldName,
          to: newName,
          oldHandle: product.handle,
          newHandle
        });
        console.log(`✅ Updated: "${oldName}" → "${newName}"`);
      }
    } catch (error) {
      errors.push(`Exception for "${oldName}": ${error}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully updated: ${updates.length}`);
  console.log(`   ❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach(err => console.log(`   ${err}`));
  }

  if (updates.length > 0) {
    console.log(`\n📝 Backup data (save this in case you need to revert):`);
    console.log(JSON.stringify(updates, null, 2));
  }
}

cleanupProductNames()
  .then(() => {
    console.log('\n✨ Cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

