'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function AllCandlesPage() {
  const allCandles = [
    // Citrus
    { id: 'lifes-a-squeeze', name: 'Lifes a Squeeze', price: '$20.00', category: 'Citrus', href: '/products/lifes-a-squeeze' },
    { id: 'eucalyptus-orange-mental-clarity', name: 'Eucalyptus and Orange Mental Clarity', price: '$24.00', category: 'Citrus', href: '/products/eucalyptus-and-orange-mental-clarity-soy-candle' },
    { id: 'happy', name: 'Happy', price: '$20.00', category: 'Citrus', href: '/products/happy' },
    
    // Fresh
    { id: 'calm-down-girl-eucalyptus-spearmint', name: 'Calm Down Girl-Eucalyptus and Spearmint', price: '$20.00', originalPrice: '$25.00', category: 'Fresh', href: '/products/calm-down-girl-eucalyptus-spearmint', badge: 'Sale' },
    { id: 'fresh-linen', name: 'Fresh Linen', price: '$20.00', category: 'Fresh', href: '/products/fresh-linen' },
    { id: 'secret-waters', name: 'Secret Waters', price: '$22.00', category: 'Fresh', href: '/products/secret-waters-soy-and-soy-blend-candle' },
    
    // Floral
    { id: 'lavender', name: 'Lavender', price: '$22.00', category: 'Floral', href: '/products/lavender' },
    { id: 'lavender-candle', name: 'Lavender Candle', price: '$22.00', category: 'Floral', href: '/products/lavender-candle' },
    { id: 'pink-rose', name: 'Pink Rose', price: '$24.00', category: 'Floral', href: '/products/pink-rose-soy-candle' },
    { id: 'let-love-blossom', name: 'Let Love Blossom - Baja Cactus Blossom', price: '$24.00', category: 'Floral', href: '/products/let-love-blossom-baja-cactus-blossom-inspired-by-bbw-soy-candle' },
    
    // Sweet
    { id: 'cinnabuns', name: 'Cinnabuns', price: '$20.00', category: 'Sweet', href: '/products/cinnabuns' },
    { id: 'butterscotch', name: 'Butterscotch', price: '$20.00', category: 'Sweet', href: '/products/butterscotch' },
    { id: 'pink-sugar', name: 'Pink Sugar', price: '$20.00', category: 'Sweet', href: '/products/pink-sugar' },
    { id: 'strawberry-cheesecake', name: 'Strawberry Cheesecake', price: '$22.00', category: 'Sweet', href: '/products/strawberry-cheesecake-soy-candl' },
    { id: 'grandmas-house', name: 'Grandmas House', price: '$22.00', category: 'Sweet', href: '/products/grandmas-house' },
    { id: 'hey-pumpkin', name: 'Hey Pumpkin', price: '$22.00', category: 'Sweet', href: '/products/hey-pumpkin' },
    { id: 'mango-coconut', name: 'Mango Coconut', price: '$22.00', category: 'Sweet', href: '/products/mango-coconut' },
    
    // Woodsy
    { id: 'mahogany-wood', name: 'Mahogany and Wood Scent', price: '$24.00', category: 'Woodsy', href: '/products/mahogany-and-wood-scent' },
    { id: 'man-cave-season', name: 'Man Cave Season', price: '$24.00', category: 'Woodsy', href: '/products/man-cave-season-soy-candle' },
    { id: 'cozy-evergreen-woods', name: 'Cozy Evergreen Woods - Fraser Fir', price: '$24.00', category: 'Woodsy', href: '/products/cozy-evergreen-woods-soy-candle-scent-fraser-fir' },
    { id: 'cocoa-butter-cashmere', name: 'Cocoa Butter Cashmere', price: '$22.00', category: 'Woodsy', href: '/products/cocoa-butter-cashmere' },
    
    // Herbal
    { id: 'ginger-spice', name: 'Ginger Spice', price: '$22.00', category: 'Herbal', href: '/products/ginger-spice' },
    
    // Earthy
    { id: 'purple-love', name: 'Purple Love', price: 'From $16.00', category: 'Earthy', href: '/products/purple-love' },
    { id: 'no-sad-songs', name: 'No Sad Songs For Me', price: '$22.00', category: 'Earthy', href: '/products/no-sad-songs-for-me' },
    
    // Other
    { id: 'wax-melts', name: 'Wax Melts', price: '$8.00', category: 'Other', href: '/products/wax-melts' },
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
            <h1 className="text-4xl font-bold mb-4">All Candles</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Discover our complete collection of handcrafted soy candles, organized by scent profile.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {allCandles.map((product) => (
              <Link key={product.id} href={product.href} className="group">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded z-10">
                      {product.badge}
                    </span>
                  )}
                  <div className="aspect-square relative">
                    <Image
                      src="/api/placeholder/300/300"
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs text-pink-600 dark:text-pink-400 font-medium mb-2 block">
                      {product.category}
                    </span>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                        {product.price}
                      </p>
                      {product.originalPrice && (
                        <p className="text-sm text-gray-500 line-through">
                          {product.originalPrice}
                        </p>
                      )}
                    </div>
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
