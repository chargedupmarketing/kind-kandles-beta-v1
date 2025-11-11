'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function SweetCandlesPage() {
  const sweetCandles = [
    { id: 'cinnabuns', name: 'Cinnabuns', price: '$20.00', href: '/products/cinnabuns', description: 'Warm cinnamon bun aroma with vanilla and butter' },
    { id: 'butterscotch', name: 'Butterscotch', price: '$20.00', href: '/products/butterscotch', description: 'Sweet and creamy butterscotch candy scent' },
    { id: 'pink-sugar', name: 'Pink Sugar', price: '$20.00', href: '/products/pink-sugar', description: 'Playful cotton candy and vanilla sugar blend' },
    { id: 'strawberry-cheesecake', name: 'Strawberry Cheesecake', price: '$22.00', href: '/products/strawberry-cheesecake-soy-candl', description: 'Indulgent dessert scent with strawberry and cream' },
    { id: 'grandmas-house', name: 'Grandmas House', price: '$22.00', href: '/products/grandmas-house', description: 'Nostalgic blend of fresh baked cookies and vanilla' },
    { id: 'hey-pumpkin', name: 'Hey Pumpkin', price: '$22.00', href: '/products/hey-pumpkin', description: 'Warm pumpkin spice with cinnamon and nutmeg' },
    { id: 'mango-coconut', name: 'Mango Coconut', price: '$22.00', href: '/products/mango-coconut', description: 'Tropical paradise with sweet mango and coconut' },
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
            <h1 className="text-4xl font-bold mb-4">Sweet Candles</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Indulgent dessert and sweet scents that satisfy your cravings and create a cozy atmosphere.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sweetCandles.map((product) => (
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
