'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Package, Loader } from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  product_type: string | null;
  tags: string[] | null;
  images: { url: string }[];
  variants: { inventory_quantity: number }[];
}

export default function SkincarePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const skincareCategories = [
    { name: 'Foaming Body Scrub', href: '/collections/skincare/foaming-body-scrub', icon: '✨' },
    { name: 'Body Spray Mist', href: '/collections/skincare/body-spray-mist', icon: '🌸' },
    { name: 'Handmade Lotion', href: '/collections/skincare/handmade-lotion', icon: '🧴' },
    { name: 'Whipped Body Butter', href: '/collections/skincare/whipped-body-butter', icon: '🍦' },
    { name: 'Natural Bar Soap', href: '/collections/skincare/natural-handmade-bar-soap', icon: '🧼' }
  ];

  const benefits = [
    {
      title: 'Natural Ingredients',
      description: 'Our natural ingredients aim to promote healthy skin and even reduce inflammation!',
      icon: '🌿'
    },
    {
      title: 'Exfoliating Benefits',
      description: 'Did you know, exfoliating helps to remove dead skin cells? This leaves your skin smooth and fresh.',
      icon: '✨'
    },
    {
      title: 'Deep Moisturizing',
      description: 'Moisturizing with body butter deeply hydrates your skin, keeping it soft and nourished.',
      icon: '💧'
    }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/collections/skincare');
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
  }, []);

  const formatProductForCard = (product: Product) => ({
    id: product.id,
    name: product.title,
    price: formatPrice(product.price),
    originalPrice: product.compare_at_price ? formatPrice(product.compare_at_price) : undefined,
    image: product.images?.[0]?.url || '/api/placeholder/300/300',
    badge: product.compare_at_price ? 'Sale' : undefined,
    href: `/products/${product.handle}`,
    description: product.description || ''
  });

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Natural Skincare
          </h1>
          <p className="text-xl text-gray-700 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Nourish your skin with our handmade, natural skincare products crafted with love and the finest ingredients.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 text-center mb-12">
            Why Natural Skincare?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-slate-300">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {skincareCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="text-center p-6 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-slate-600 transition-colors group"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              All Skincare Products {!isLoading && `(${products.length})`}
            </h2>
            <select className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-2 text-sm">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name: A to Z</option>
              <option>Name: Z to A</option>
            </select>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} {...formatProductForCard(product)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No skincare products yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Check back soon for our handmade skincare collection!
              </p>
              <Link href="/collections" className="btn-primary">
                Browse All Collections
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Ingredients Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Premium Natural Ingredients
          </h2>
          <p className="text-lg text-gray-700 dark:text-slate-300 mb-8">
            We carefully select each ingredient for its beneficial properties and skin-loving qualities.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🥥</div>
              <p className="font-medium text-gray-900 dark:text-slate-100">Coconut Oil</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🍯</div>
              <p className="font-medium text-gray-900 dark:text-slate-100">Raw Honey</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌾</div>
              <p className="font-medium text-gray-900 dark:text-slate-100">Oatmeal</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌿</div>
              <p className="font-medium text-gray-900 dark:text-slate-100">Essential Oils</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
