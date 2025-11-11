'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function WoodsyCandlesPage() {
  const woodsyCandles = [
    { id: 'mahogany-wood', name: 'Mahogany and Wood Scent', price: '$24.00', href: '/products/mahogany-and-wood-scent', description: 'Rich mahogany with warm wood notes' },
    { id: 'man-cave-season', name: 'Man Cave Season', price: '$24.00', href: '/products/man-cave-season-soy-candle', description: 'Masculine blend of cedar, sandalwood, and musk' },
    { id: 'cozy-evergreen-woods', name: 'Cozy Evergreen Woods - Fraser Fir', price: '$24.00', href: '/products/cozy-evergreen-woods-soy-candle-scent-fraser-fir', description: 'Fresh Fraser Fir with pine and cedar notes' },
    { id: 'cocoa-butter-cashmere', name: 'Cocoa Butter Cashmere', price: '$22.00', href: '/products/cocoa-butter-cashmere', description: 'Luxurious cocoa butter with soft cashmere' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/collections/candles" 
            className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Candles
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Woodsy Candles</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Rich, sophisticated wood scents that create a warm, masculine, and grounding atmosphere.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {woodsyCandles.map((product) => (
              <Link key={product.id} href={product.href} className="group">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-square relative">
                    <Image
                      src="/api/placeholder/300/300"
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {product.description}
                    </p>
                    <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                      {product.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
