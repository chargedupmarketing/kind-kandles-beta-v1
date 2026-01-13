'use client';

import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import TrustBadges from '@/components/TrustBadges';

interface CollectionsPageClientProps {
  collections: any[];
  featuredProducts: any[];
}

export default function CollectionsPageClient({ collections, featuredProducts }: CollectionsPageClientProps) {
  return (
    <>
      {/* Main Content */}
      <div className="min-h-screen dark:bg-slate-900">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="serif-font text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
              Our Collections
            </h1>
            <p className="text-xl text-gray-700 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover our carefully curated collections of natural, handmade products crafted with kindness and love. 
              <span className="script-font text-2xl text-amber-600 dark:text-amber-400 block mt-2">✨ Light up your world with intention ✨</span>
            </p>
          </div>
        </section>

        {/* Collections Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.map((collection) => (
                <Link key={collection.name} href={collection.href} className="group">
                  <div className="card">
                    <div className="aspect-[4/3] bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Collection Image</span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {collection.description}
                      </p>
                      <p className="text-sm text-pink-600 font-medium">
                        {collection.productCount}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="serif-font text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                ✨ Featured Products ✨
              </h2>
              <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
                Browse our most beloved handmade treasures, crafted with love and intention
              </p>
              <div className="script-font text-amber-600 dark:text-amber-400 text-lg mt-2">
                🕯️ Each piece tells a story of kindness 🕯️
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6 leading-relaxed">
                Looking for something specific? Browse by category or contact us for custom orders.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/customs" className="btn-candle">
                  🎨 Request Custom Order
                </Link>
                <Link href="/collections/candles" className="btn-secondary">
                  🕯️ Shop All Candles
                </Link>
              </div>
              <div className="script-font text-amber-600 text-lg mt-4">
                ✨ Made with kindness, just for you ✨
              </div>
            </div>
          </div>
        </section>
        
        {/* Trust Badges Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="serif-font text-3xl font-bold text-gray-900 mb-4">
                Why Choose My Kind Kandles & Boutique?
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We're committed to bringing you the highest quality handmade products with exceptional service and care.
              </p>
            </div>
            <TrustBadges variant="horizontal" showAll={true} />
          </div>
        </section>
      </div>
    </>
  );
}
