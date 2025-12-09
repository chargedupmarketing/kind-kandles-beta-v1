import { notFound } from 'next/navigation';
import ProductPage from '@/components/ProductPage';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/localStore';

interface ProductPageProps {
  params: Promise<{
    handle: string;
  }>;
}

async function getProduct(handle: string) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('handle', handle)
      .eq('status', 'active')
      .single();

    if (error || !product) {
      return null;
    }

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    notFound();
  }

  // Get first variant for availability check
  const firstVariant = product.variants?.[0];
  const inStock = firstVariant?.available_for_sale && (firstVariant?.inventory_quantity || 0) > 0;

  // Transform product data to match our component interface
  const transformedProduct = {
    id: product.id,
    name: product.title,
    price: formatPrice(product.price),
    originalPrice: product.compare_at_price 
      ? formatPrice(product.compare_at_price)
      : undefined,
    description: product.description || '',
    ingredients: product.tags?.find((tag: string) => tag.startsWith('ingredients:'))?.replace('ingredients:', ''),
    careInstructions: product.tags?.find((tag: string) => tag.startsWith('care:'))?.replace('care:', ''),
    image: product.images?.[0]?.url || '/api/placeholder/500/500',
    category: product.product_type,
    inStock,
    sizes: product.variants?.filter((v: any) => v.option1_name?.toLowerCase() === 'size').map((v: any) => v.option1_value),
    colors: product.variants?.filter((v: any) => v.option1_name?.toLowerCase() === 'color').map((v: any) => v.option1_value),
    variants: product.variants || [],
    handle: product.handle,
    // Enhanced conversion data
    isCandle: product.product_type?.toLowerCase().includes('candle') || product.tags?.some((tag: string) => tag.toLowerCase().includes('candle')),
    burnTime: (() => {
      const hourTag = product.tags?.find((tag: string) => tag.toLowerCase().includes('hour'));
      if (!hourTag) return undefined;
      const hours = hourTag.replace(/[^0-9]/g, '');
      return hours ? `${hours} hours` : undefined;
    })(),
    scentProfile: product.tags?.find((tag: string) => 
      ['fresh', 'floral', 'woodsy', 'sweet', 'citrus', 'herbal', 'earthy'].includes(tag.toLowerCase())
    )?.toLowerCase(),
    rating: 4.8, // Placeholder for reviews
    reviewCount: 127, // Placeholder for review count
    stockLevel: firstVariant?.inventory_quantity || 0,
    isHandmade: product.tags?.some((tag: string) => tag.toLowerCase().includes('handmade')) ?? true,
    isNatural: product.tags?.some((tag: string) => tag.toLowerCase().includes('natural')) ?? true,
  };

  return <ProductPage product={transformedProduct} />;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.title} | My Kind Kandles & Boutique`,
    description: product.description || `Shop ${product.title} at My Kind Kandles & Boutique`,
    openGraph: {
      title: product.title,
      description: product.description || `Shop ${product.title}`,
      images: product.images?.map((img: any) => ({
        url: img.url,
        alt: img.alt_text || product.title,
      })) || [],
    },
  };
}
