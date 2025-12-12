import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/localStore';
import CollectionsPageClient from '@/components/CollectionsPageClient';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Shop All Collections - Candles, Skincare & More',
  description: 'Browse our complete collection of handmade candles, natural skincare, body oils, room sprays, and boutique items. Crafted with love in Maryland.',
  keywords: [...SEO_KEYWORDS.general, ...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.skincare],
  path: '/collections',
});

async function getCollections() {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('status', 'active')
      .eq('featured', true)
      .limit(6);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function CollectionsPage() {
  const [collectionsData, productsData] = await Promise.all([
    getCollections(),
    getFeaturedProducts()
  ]);

  // Format collections data - no fallback mock data
  const collections = collectionsData.map((collection: any) => ({
    name: collection.title,
    description: collection.description || `Discover our ${collection.title.toLowerCase()} collection`,
    href: `/collections/${collection.handle}`,
    image: collection.image_url || '/api/placeholder/400/300',
    productCount: `Browse collection`
  }));

  // Format products data - no fallback mock data
  const featuredProducts = productsData.map((product: any) => {
    const image = product.images?.[0];
    
    return {
      id: product.id,
      name: product.title,
      price: formatPrice(product.price),
      originalPrice: product.compare_at_price 
        ? formatPrice(product.compare_at_price)
        : undefined,
      image: image?.url || '/api/placeholder/300/300',
      badge: product.compare_at_price ? 'Sale' : undefined,
      href: `/products/${product.handle}`,
      description: product.description && product.description.length > 100 
        ? product.description.substring(0, 100) + '...' 
        : product.description || '',
      isCandle: product.product_type?.toLowerCase().includes('candle') || product.tags?.some((tag: string) => tag.toLowerCase().includes('candle')),
      scentProfile: product.tags?.find((tag: string) => 
        ['fresh', 'floral', 'woodsy', 'sweet', 'citrus', 'herbal', 'earthy'].includes(tag.toLowerCase())
      )?.toLowerCase() as 'fresh' | 'floral' | 'woodsy' | 'sweet' | 'citrus' | 'herbal' | 'earthy',
      burnTime: (() => {
        const hourTag = product.tags?.find((tag: string) => tag.toLowerCase().includes('hour'));
        if (!hourTag) return undefined;
        const hours = hourTag.replace(/[^0-9]/g, '');
        return hours ? `${hours} hours` : undefined;
      })(),
      stockLevel: product.variants?.[0]?.inventory_quantity || 0,
      isLimitedEdition: product.tags?.some((tag: string) => tag.toLowerCase().includes('limited')),
      isTrending: product.featured,
    };
  });

  return <CollectionsPageClient collections={collections} featuredProducts={featuredProducts} />;
}
