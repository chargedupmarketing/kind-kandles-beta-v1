'use client';

import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function CandlesPage() {
  const candleCategories = [
    { name: 'Citrus', href: '/collections/candles/citrus', count: 4 },
    { name: 'Fresh', href: '/collections/candles/fresh', count: 6 },
    { name: 'Floral', href: '/collections/candles/floral', count: 5 },
    { name: 'Sweet', href: '/collections/candles/sweet', count: 4 },
    { name: 'Woodsy', href: '/collections/candles/woodsy', count: 3 },
    { name: 'Herbal', href: '/collections/candles/herbal', count: 2 },
    { name: 'Earthy', href: '/collections/candles/earthy', count: 3 }
  ];

  const candles = [
    {
      id: 'calm-down-girl-candle',
      name: 'Calm Down Girl-Eucalyptus and Spearmint Candle',
      price: 'From $20.00',
      originalPrice: '$25.00',
      image: '/api/placeholder/300/300',
      badge: 'Sale',
      href: '/products/calm-down-girl-candle',
      description: 'Relaxing eucalyptus and spearmint blend perfect for unwinding after a long day',
      isCandle: true,
      scentProfile: 'herbal' as const,
      burnTime: '45 hours'
    },
    {
      id: 'lavender-dreams',
      name: 'Lavender Dreams Candle',
      price: '$24.00',
      image: '/api/placeholder/300/300',
      href: '/products/lavender-dreams',
      description: 'Soothing lavender scent to promote relaxation and better sleep',
      isCandle: true,
      scentProfile: 'floral' as const,
      burnTime: '50 hours'
    },
    {
      id: 'citrus-burst',
      name: 'Citrus Burst Candle',
      price: '$22.00',
      image: '/api/placeholder/300/300',
      href: '/products/citrus-burst',
      description: 'Energizing blend of orange, lemon, and grapefruit',
      isCandle: true,
      scentProfile: 'citrus' as const,
      burnTime: '40 hours'
    },
    {
      id: 'vanilla-spice',
      name: 'Vanilla Spice Candle',
      price: '$23.00',
      image: '/api/placeholder/300/300',
      href: '/products/vanilla-spice',
      description: 'Warm vanilla with hints of cinnamon and nutmeg',
      isCandle: true,
      scentProfile: 'sweet' as const,
      burnTime: '48 hours'
    },
    {
      id: 'ocean-breeze',
      name: 'Ocean Breeze Candle',
      price: '$21.00',
      image: '/api/placeholder/300/300',
      href: '/products/ocean-breeze',
      description: 'Fresh, clean scent reminiscent of seaside mornings',
      isCandle: true,
      scentProfile: 'fresh' as const,
      burnTime: '42 hours'
    },
    {
      id: 'forest-walk',
      name: 'Forest Walk Candle',
      price: '$25.00',
      image: '/api/placeholder/300/300',
      href: '/products/forest-walk',
      description: 'Earthy blend of pine, cedar, and moss',
      isCandle: true,
      scentProfile: 'woodsy' as const,
      burnTime: '55 hours'
    }
  ];

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Hero Section */}
      <section className="gradient-warm dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 to-orange-100/30 dark:from-slate-700/30 dark:to-slate-800/30"></div>
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
            <button className="btn-candle glow-pulse">
              🔥 Shop All Candles
            </button>
            <button className="btn-secondary">
              📖 Learn About Our Process
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 gradient-amber-subtle">
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
                  <div className="text-3xl mb-3">
                    {category.name === 'Citrus' && '🍊'}
                    {category.name === 'Fresh' && '🌿'}
                    {category.name === 'Floral' && '🌸'}
                    {category.name === 'Sweet' && '🍯'}
                    {category.name === 'Woodsy' && '🌲'}
                    {category.name === 'Herbal' && '🌱'}
                    {category.name === 'Earthy' && '🍃'}
                  </div>
                  <h3 className="serif-font font-semibold text-gray-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 mb-2 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {category.count} candles
                  </p>
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              All Candles ({candles.length})
            </h2>
            <select className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md px-3 py-2 text-sm">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Name: A to Z</option>
              <option>Name: Z to A</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {candles.map((candle) => (
              <ProductCard key={candle.id} {...candle} />
            ))}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 gradient-teal-subtle">
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
