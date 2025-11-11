import shopifyClient from '@/lib/shopify';
import { GET_COLLECTIONS } from '@/lib/queries/collections';
import { GET_PRODUCTS } from '@/lib/queries/products';
import { formatPrice, getShopifyImageUrl } from '@/lib/shopify';
import CollectionsPageClient from '@/components/CollectionsPageClient';

async function getCollections() {
  try {
    if (!shopifyClient) {
      console.warn('Shopify client not configured - using mock data');
      return [];
    }
    const { data } = await shopifyClient.request(GET_COLLECTIONS, {
      variables: { first: 10 },
    });
    return data?.collections?.edges || [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    if (!shopifyClient) {
      console.warn('Shopify client not configured - using mock data');
      return [];
    }
    const { data } = await shopifyClient.request(GET_PRODUCTS, {
      variables: { first: 6, sortKey: 'BEST_SELLING' },
    });
    return data?.products?.edges || [];
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

  // Mock collections data when Shopify is not configured
  const collections = collectionsData.length > 0 ? collectionsData.map((edge: any) => ({
    name: edge.node.title,
    description: edge.node.description || `Discover our ${edge.node.title.toLowerCase()} collection`,
    href: `/collections/${edge.node.handle}`,
    image: edge.node.image ? getShopifyImageUrl(edge.node.image.url, 400, 300) : '/api/placeholder/400/300',
    productCount: `${edge.node.products.edges.length}+ products`
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
      name: "Essential Oils",
      description: "Pure essential oils for wellness and aromatherapy",
      href: "/collections/essential-oils",
      image: "/api/placeholder/400/300",
      productCount: "15+ products"
    }
  ];

  // Mock products data when Shopify is not configured
  const featuredProducts = productsData.length > 0 ? productsData.map((edge: any) => {
    const product = edge.node;
    const image = product.images.edges[0]?.node;
    
    return {
      id: product.id,
      name: product.title,
      price: formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode),
      originalPrice: product.compareAtPriceRange?.minVariantPrice?.amount 
        ? formatPrice(product.compareAtPriceRange.minVariantPrice.amount, product.compareAtPriceRange.minVariantPrice.currencyCode)
        : undefined,
      image: image ? getShopifyImageUrl(image.url, 300, 300) : '/api/placeholder/300/300',
      badge: product.compareAtPriceRange?.minVariantPrice?.amount ? 'Sale' : undefined,
      href: `/products/${product.handle}`,
      description: product.description.length > 100 
        ? product.description.substring(0, 100) + '...' 
        : product.description,
      isCandle: product.productType?.toLowerCase().includes('candle') || product.tags?.some((tag: string) => tag.toLowerCase().includes('candle')),
      scentProfile: product.tags?.find((tag: string) => 
        ['fresh', 'floral', 'woodsy', 'sweet', 'citrus', 'herbal', 'earthy'].includes(tag.toLowerCase())
      )?.toLowerCase() as 'fresh' | 'floral' | 'woodsy' | 'sweet' | 'citrus' | 'herbal' | 'earthy',
      burnTime: product.tags?.find((tag: string) => tag.toLowerCase().includes('hour'))?.replace(/[^0-9]/g, '') + ' hours',
      stockLevel: product.totalInventory,
      isLimitedEdition: product.tags?.some((tag: string) => tag.toLowerCase().includes('limited')),
      isTrending: Math.random() > 0.7, // Random trending for demo
    };
  }) : [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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