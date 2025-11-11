import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import shopifyClient from '@/lib/shopify';
import { GET_COLLECTION_BY_HANDLE } from '@/lib/queries/collections';
import { formatPrice, getShopifyImageUrl } from '@/lib/shopify';

interface CollectionPageProps {
  params: {
    handle: string;
  };
  searchParams: {
    sort?: string;
    page?: string;
  };
}

async function getCollection(handle: string, sortKey = 'COLLECTION_DEFAULT', reverse = false) {
  try {
    if (!shopifyClient) {
      console.warn('Shopify client not configured - using mock data');
      return null;
    }
    const { data } = await shopifyClient.request(GET_COLLECTION_BY_HANDLE, {
      variables: { 
        handle, 
        first: 24, 
        sortKey,
        reverse 
      },
    });

    return data?.collection;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  // Handle sorting
  let sortKey = 'COLLECTION_DEFAULT';
  let reverse = false;
  
  switch (searchParams.sort) {
    case 'price-low-high':
      sortKey = 'PRICE';
      reverse = false;
      break;
    case 'price-high-low':
      sortKey = 'PRICE';
      reverse = true;
      break;
    case 'title-a-z':
      sortKey = 'TITLE';
      reverse = false;
      break;
    case 'title-z-a':
      sortKey = 'TITLE';
      reverse = true;
      break;
    case 'created':
      sortKey = 'CREATED';
      reverse = true;
      break;
    default:
      sortKey = 'COLLECTION_DEFAULT';
  }

  const collection = await getCollection(params.handle, sortKey, reverse);

  if (!collection) {
    notFound();
  }

  const products = collection.products.edges.map((edge: any) => {
    const product = edge.node;
    const image = product.images.edges[0]?.node;
    
    return {
      id: product.id,
      name: product.title,
      price: formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode),
      originalPrice: product.compareAtPriceRange?.minVariantPrice?.amount 
        ? formatPrice(product.compareAtPriceRange.minVariantPrice.amount, product.compareAtPriceRange.minVariantPrice.currencyCode)
        : undefined,
      image: image ? getShopifyImageUrl(image.url, 400, 400) : '/api/placeholder/400/400',
      badge: product.compareAtPriceRange?.minVariantPrice?.amount ? 'Sale' : undefined,
      href: `/products/${product.handle}`,
      description: product.description.length > 100 
        ? product.description.substring(0, 100) + '...' 
        : product.description,
    };
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <nav className="mb-6">
            <Link href="/collections" className="text-gray-600 hover:text-gray-900">
              Collections
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{collection.title}</span>
          </nav>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {collection.title}
          </h1>
          
          {collection.description && (
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              {collection.description}
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
                defaultValue={searchParams.sort || 'featured'}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value === 'featured') {
                    url.searchParams.delete('sort');
                  } else {
                    url.searchParams.set('sort', e.target.value);
                  }
                  window.location.href = url.toString();
                }}
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
              <Link href="/collections" className="btn-primary mt-4 inline-block">
                Browse All Collections
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
  const collection = await getCollection(params.handle);

  if (!collection) {
    return {
      title: 'Collection Not Found',
    };
  }

  return {
    title: collection.seo?.title || collection.title,
    description: collection.seo?.description || collection.description,
    openGraph: {
      title: collection.title,
      description: collection.description,
      images: collection.image ? [{
        url: collection.image.url,
        alt: collection.image.altText || collection.title,
      }] : [],
    },
  };
}
