'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Loader } from 'lucide-react';
import { formatPrice, getExcerpt } from '@/lib/localStore';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  product_type: string | null;
  images: { url: string }[];
}

interface DynamicCollectionPageProps {
  title: string;
  description: string;
  backLink: string;
  backLabel: string;
  collectionHandle?: string;
  productType?: string;
  tag?: string;
}

export default function DynamicCollectionPage({
  title,
  description,
  backLink,
  backLabel,
  collectionHandle,
  productType,
  tag
}: DynamicCollectionPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = '/api/products?';
        if (collectionHandle) url += `collection=${encodeURIComponent(collectionHandle)}&`;
        if (productType) url += `type=${encodeURIComponent(productType)}&`;
        if (tag) url += `tag=${encodeURIComponent(tag)}&`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [collectionHandle, productType, tag]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link 
            href={backLink}
            className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {description}
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.handle}`} className="group">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
                    {product.compare_at_price && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded z-10">
                        Sale
                      </span>
                    )}
                    <div className="aspect-square relative">
                      <Image
                        src={product.images?.[0]?.url || '/api/placeholder/300/300'}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {getExcerpt(product.description || '', 120) || 'Handcrafted with love and care.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                          {formatPrice(product.price)}
                        </p>
                        {product.compare_at_price && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(product.compare_at_price)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No products yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Check back soon for our handmade collection!
              </p>
              <Link href={backLink} className="btn-primary">
                {backLabel}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


