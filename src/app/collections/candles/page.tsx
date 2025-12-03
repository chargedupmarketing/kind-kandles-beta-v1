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

export default function CandlesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const candleCategories = [
    { name: 'Citrus', href: '/collections/candles/citrus', icon: '🍊' },
    { name: 'Fresh', href: '/collections/candles/fresh', icon: '🌿' },
    { name: 'Floral', href: '/collections/candles/floral', icon: '🌸' },
    { name: 'Sweet', href: '/collections/candles/sweet', icon: '🍯' },
    { name: 'Woodsy', href: '/collections/candles/woodsy', icon: '🌲' },
    { name: 'Herbal', href: '/collections/candles/herbal', icon: '🌱' },
    { name: 'Earthy', href: '/collections/candles/earthy', icon: '🍃' }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/collections/candles');
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
    description: product.description || '',
    isCandle: true,
    scentProfile: product.tags?.find(t => 
      ['fresh', 'floral', 'woodsy', 'sweet', 'citrus', 'herbal', 'earthy'].includes(t.toLowerCase())
    )?.toLowerCase() as any,
    burnTime: product.tags?.find(t => t.toLowerCase().includes('hour')) || undefined
  });

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="text-6xl flame-flicker">🕯️</span>
          </div>
          <h1 className="serif-font text-5xl md:text-6xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Handcrafted Candles
          </h1>
          <p className="text-xl text-gray-700 dark:text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Discover our collection of natural, hand-poured candles made with premium soy wax and essential oils. 
            Each candle is crafted with intention to bring warmth, comfort, and kindness to your space.
          </p>
          <div className="script-font text-2xl text-amber-600 dark:text-amber-400 mb-8">
            ✨ Light up your world with intention ✨
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/collections/candles/all" className="btn-candle glow-pulse">
              🔥 Shop All Candles
            </Link>
            <Link href="/about/mission" className="btn-secondary">
              📖 Learn About Our Process
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="serif-font text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              🌸 Shop by Scent Profile 🌸
            </h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              Find your perfect scent to match your mood and create the ambiance you desire
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {candleCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative"
              >
                <div className="text-center p-6 rounded-xl border-2 border-amber-200 dark:border-amber-600 hover:border-amber-400 dark:hover:border-amber-500 bg-white dark:bg-slate-800 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg">
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h3 className="serif-font font-semibold text-gray-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 mb-2 transition-colors">
                    {category.name}
                  </h3>
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-200/20 to-orange-200/20"></div>
                  </div>
                </div>
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
              All Candles {!isLoading && `(${products.length})`}
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
                No candles yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Check back soon for our handmade candle collection!
              </p>
              <Link href="/collections" className="btn-primary">
                Browse All Collections
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Why Choose Our Candles?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-4">🕯️</div>
              <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">Natural Soy Wax</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Made with 100% natural soy wax for a clean, long-lasting burn
              </p>
            </div>
            <div>
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">Essential Oils</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Fragranced with premium essential oils and natural fragrance blends
              </p>
            </div>
            <div>
              <div className="text-4xl mb-4">✋</div>
              <h3 className="text-lg font-semibold dark:text-slate-100 mb-2">Hand-Poured</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Each candle is carefully hand-poured with attention to detail
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
