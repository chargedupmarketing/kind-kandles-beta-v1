import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/localStore';
import CollectionsPageClient from '@/components/CollectionsPageClient';

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

  // Format collections data
  const collections = collectionsData.length > 0 ? collectionsData.map((collection: any) => ({
    name: collection.title,
    description: collection.description || `Discover our ${collection.title.toLowerCase()} collection`,
    href: `/collections/${collection.handle}`,
    image: collection.image_url || '/api/placeholder/400/300',
    productCount: `Browse collection`
  })) : [
    {
      name: "Candles",
      description: "Discover our handmade candle collection",
      href: "/collections/candles",
      image: "/api/placeholder/400/300",
      productCount: "12+ products"
    },
    {
      name: "Skincare",
      description: "Natural skincare products crafted with love",
      href: "/collections/skincare",
      image: "/api/placeholder/400/300",
      productCount: "8+ products"
    },
    {
      name: "Body Oils",
      description: "Nourishing body oils for radiant skin",
      href: "/collections/body-oils",
      image: "/api/placeholder/400/300",
      productCount: "6+ products"
    }
  ];

  // Format products data
  const featuredProducts = productsData.length > 0 ? productsData.map((product: any) => {
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
      burnTime: product.tags?.find((tag: string) => tag.toLowerCase().includes('hour'))?.replace(/[^0-9]/g, '') + ' hours',
      stockLevel: product.variants?.[0]?.inventory_quantity || 0,
      isLimitedEdition: product.tags?.some((tag: string) => tag.toLowerCase().includes('limited')),
      isTrending: product.featured,
    };
  }) : [
    {
      id: '1',
      name: "Calm Down Girl - Eucalyptus & Spearmint Candle",
      price: "$24.99",
      originalPrice: "$29.99",
      image: "/api/placeholder/300/300",
      badge: "Sale",
      href: "/products/calm-down-girl-candle",
      description: "A soothing blend of eucalyptus and spearmint to help you unwind after a long day.",
      isCandle: true,
      scentProfile: "fresh" as const,
      burnTime: "45 hours",
      stockLevel: 12,
      isLimitedEdition: false,
      isTrending: true
    },
    {
      id: '2',
      name: "Lavender Dreams Candle",
      price: "$22.99",
      image: "/api/placeholder/300/300",
      href: "/products/lavender-dreams-candle",
      description: "Pure lavender essential oil creates the perfect atmosphere for relaxation and sleep.",
      isCandle: true,
      scentProfile: "floral" as const,
      burnTime: "40 hours",
      stockLevel: 8,
      isLimitedEdition: true,
      isTrending: false
    },
    {
      id: '3',
      name: "Vanilla Bourbon Candle",
      price: "$26.99",
      image: "/api/placeholder/300/300",
      href: "/products/vanilla-bourbon-candle",
      description: "Rich vanilla with warm bourbon notes for a cozy, luxurious ambiance.",
      isCandle: true,
      scentProfile: "sweet" as const,
      burnTime: "50 hours",
      stockLevel: 15,
      isLimitedEdition: false,
      isTrending: true
    }
  ];

  return <CollectionsPageClient collections={collections} featuredProducts={featuredProducts} />;
}
