import { notFound } from 'next/navigation';
import ProductPage from '@/components/ProductPage';
import shopifyClient from '@/lib/shopify';
import { GET_PRODUCT_BY_HANDLE } from '@/lib/queries/products';

interface ProductPageProps {
  params: {
    handle: string;
  };
}

async function getProduct(handle: string) {
  try {
    if (!shopifyClient) {
      console.warn('Shopify client not configured - using mock data');
      return null;
    }
    const { data } = await shopifyClient.request(GET_PRODUCT_BY_HANDLE, {
      variables: { handle },
    });

    return data?.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await getProduct(params.handle);

  if (!product) {
    notFound();
  }

  // Transform Shopify product data to match our component interface
  const transformedProduct = {
    id: product.id,
    name: product.title,
    price: `$${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}`,
    originalPrice: product.compareAtPriceRange?.minVariantPrice?.amount 
      ? `$${parseFloat(product.compareAtPriceRange.minVariantPrice.amount).toFixed(2)}`
      : undefined,
    description: product.description,
    ingredients: product.tags.find((tag: string) => tag.startsWith('ingredients:'))?.replace('ingredients:', ''),
    careInstructions: product.tags.find((tag: string) => tag.startsWith('care:'))?.replace('care:', ''),
    image: product.images.edges[0]?.node.url || '/api/placeholder/500/500',
    category: product.productType,
    inStock: product.availableForSale && product.totalInventory > 0,
    sizes: product.options.find((option: any) => option.name.toLowerCase() === 'size')?.values,
    colors: product.options.find((option: any) => option.name.toLowerCase() === 'color')?.values,
    variants: product.variants.edges.map((edge: any) => edge.node),
    handle: product.handle,
    // Enhanced conversion data
    isCandle: product.productType?.toLowerCase().includes('candle') || product.tags?.some((tag: string) => tag.toLowerCase().includes('candle')),
    burnTime: product.tags?.find((tag: string) => tag.toLowerCase().includes('hour'))?.replace(/[^0-9]/g, '') + ' hours',
    scentProfile: product.tags?.find((tag: string) => 
      ['fresh', 'floral', 'woodsy', 'sweet', 'citrus', 'herbal', 'earthy'].includes(tag.toLowerCase())
    )?.toLowerCase(),
    rating: 4.8, // Will be replaced with actual Shopify review data
    reviewCount: 127, // Will be replaced with actual review count
    stockLevel: product.totalInventory,
    isHandmade: product.tags?.some((tag: string) => tag.toLowerCase().includes('handmade')) ?? true,
    isNatural: product.tags?.some((tag: string) => tag.toLowerCase().includes('natural')) ?? true,
  };

  return <ProductPage product={transformedProduct} />;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProduct(params.handle);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: product.seo?.title || product.title,
    description: product.seo?.description || product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images.edges.map((edge: any) => ({
        url: edge.node.url,
        alt: edge.node.altText || product.title,
      })),
    },
  };
}
