import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/localStore';
import { stripHTML } from '@/lib/htmlUtils';

interface CollectionPageProps {
  params: Promise<{
    handle: string;
  }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
  }>;
}

async function getCollection(handle: string, sortBy = 'created_at', ascending = false) {
  try {
    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('handle', handle)
      .single();

    if (collectionError || !collection) {
      return null;
    }

    // Get products in collection
    let productsQuery = supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('status', 'active');

    // Handle 'all' collection specially
    if (handle !== 'all') {
      productsQuery = productsQuery.eq('collection_id', (collection as any).id);
    }

    // Apply sorting
    productsQuery = productsQuery.order(sortBy, { ascending });

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return { ...collection, products: [] };
    }

    return { ...collection, products: products || [] };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { handle } = await params;
  const { sort } = await searchParams;

  // Handle sorting
  let sortBy = 'created_at';
  let ascending = false;
  
  switch (sort) {
    case 'price-low-high':
      sortBy = 'price';
      ascending = true;
      break;
    case 'price-high-low':
      sortBy = 'price';
      ascending = false;
      break;
    case 'title-a-z':
      sortBy = 'title';
      ascending = true;
      break;
    case 'title-z-a':
      sortBy = 'title';
      ascending = false;
      break;
    case 'created':
      sortBy = 'created_at';
      ascending = false;
      break;
    default:
      sortBy = 'created_at';
      ascending = false;
  }

  const collection = await getCollection(handle, sortBy, ascending);

  if (!collection) {
    notFound();
  }

  const products = (collection.products || []).map((product: any) => {
    const image = product.images?.[0];
    const plainDescription = stripHTML(product.description || '');
    
    return {
      id: product.id,
      name: product.title,
      price: formatPrice(product.price),
      originalPrice: product.compare_at_price 
        ? formatPrice(product.compare_at_price)
        : undefined,
      image: image?.url || '/api/placeholder/400/400',
      badge: product.compare_at_price ? 'Sale' : undefined,
      href: `/products/${product.handle}`,
      description: plainDescription.length > 100 
        ? plainDescription.substring(0, 100) + '...' 
        : plainDescription,
    };
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <nav className="mb-6">
            <Link href="/collections/all" className="text-gray-600 hover:text-gray-900">
              All Products
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{collection.title}</span>
          </nav>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {collection.title}
          </h1>
          
          {collection.description && (
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              {stripHTML(collection.description)}
            </p>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Sort and Filter Bar */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {collection.title} ({products.length} products)
            </h2>
            
            <div className="flex items-center space-x-4">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select 
                id="sort"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                defaultValue={sort || 'featured'}
              >
                <option value="featured">Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="title-a-z">Name: A to Z</option>
                <option value="title-z-a">Name: Z to A</option>
                <option value="created">Newest First</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product: any) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found in this collection.</p>
              <Link href="/collections/all" className="btn-primary mt-4 inline-block">
                Browse All Products
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CollectionPageProps) {
  const { handle } = await params;
  const collection = await getCollection(handle);

  if (!collection) {
    return {
      title: 'Collection Not Found',
    };
  }

  const cleanDescription = stripHTML(collection.description || `Browse our ${collection.title} collection`);
  
  return {
    title: `${collection.title} | My Kind Kandles & Boutique`,
    description: cleanDescription,
    openGraph: {
      title: collection.title,
      description: cleanDescription,
      images: collection.image_url ? [{
        url: collection.image_url,
        alt: collection.title,
      }] : [],
    },
  };
}
