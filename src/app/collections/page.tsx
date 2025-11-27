import { getAllCollections, getFeaturedProducts, formatPrice } from '@/lib/localStore';
import CollectionsPageClient from '@/components/CollectionsPageClient';

export default async function CollectionsPage() {
  const collectionsData = getAllCollections();
  const featuredProductsData = getFeaturedProducts(6);

  // Transform collections for the client component
  const collections = collectionsData.map((collection) => ({
    name: collection.title,
    description: collection.description,
    href: `/collections/${collection.handle}`,
    image: collection.image || '/api/placeholder/400/300',
    productCount: `${collection.productIds.length} products`
  }));

  // Transform featured products for the client component
  const featuredProducts = featuredProductsData.map((product) => ({
    id: product.id,
    name: product.title,
    price: formatPrice(product.price),
    originalPrice: product.compareAtPrice ? formatPrice(product.compareAtPrice) : undefined,
    image: product.images[0] || '/api/placeholder/300/300',
    badge: product.badge,
    href: `/products/${product.handle}`,
    description: product.description.length > 100 
      ? product.description.substring(0, 100) + '...' 
      : product.description,
    isCandle: product.isCandle,
    scentProfile: product.scentProfile,
    burnTime: product.burnTime,
    stockLevel: product.inventoryQuantity,
    isLimitedEdition: product.isLimitedEdition,
    isTrending: product.isTrending
  }));

  return <CollectionsPageClient collections={collections} featuredProducts={featuredProducts} />;
}
