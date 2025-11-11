'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function AllProductsPage() {
  const allProducts = [
    // Candles
    {
      id: 'calm-down-girl-eucalyptus-spearmint',
      name: 'Calm Down Girl-Eucalyptus and Spearmint Candle',
      price: '$20.00',
      originalPrice: '$25.00',
      image: '/api/placeholder/300/300',
      href: '/products/calm-down-girl-eucalyptus-spearmint',
      category: 'Candles',
      badge: 'Sale'
    },
    {
      id: 'lavender-candle',
      name: 'Lavender Soy Candle',
      price: '$22.00',
      image: '/api/placeholder/300/300',
      href: '/products/lavender-candle',
      category: 'Candles'
    },
    {
      id: 'purple-love',
      name: 'Purple Love',
      price: 'From $16.00',
      image: '/api/placeholder/300/300',
      href: '/products/purple-love',
      category: 'Candles'
    },
    {
      id: 'fresh-linen',
      name: 'Fresh Linen Soy Candle',
      price: '$20.00',
      image: '/api/placeholder/300/300',
      href: '/products/fresh-linen',
      category: 'Candles'
    },
    // Skincare
    {
      id: 'whipped-body-butter',
      name: 'Whipped Body Butter',
      price: '$22.00',
      image: '/api/placeholder/300/300',
      href: '/products/whipped-body-butter',
      category: 'Skincare'
    },
    {
      id: 'exfoliating-foaming-body-scrubs',
      name: 'Exfoliating Foaming Body Scrub',
      price: '$18.00',
      image: '/api/placeholder/300/300',
      href: '/products/exfoliating-foaming-body-scrubs',
      category: 'Skincare'
    },
    {
      id: 'natural-handmade-bar-soap',
      name: 'Natural Handmade Bar Soap',
      price: '$8.00',
      image: '/api/placeholder/300/300',
      href: '/products/natural-handmade-bar-soap',
      category: 'Skincare'
    },
    {
      id: 'calm-down-girl-body-mist',
      name: 'Calm Down Girl Body Spray Mist',
      price: '$12.00',
      image: '/api/placeholder/300/300',
      href: '/products/calm-down-girl-body-mist',
      category: 'Skincare'
    },
    // Body Oils
    {
      id: 'hair-growth-oil',
      name: 'Hair Growth Oil',
      price: '$18.00',
      image: '/api/placeholder/300/300',
      href: '/products/hair-growth-oil',
      category: 'Body Oils'
    },
    {
      id: 'beard-oil',
      name: 'Beard Oil - For beards and hair',
      price: '$15.00',
      image: '/api/placeholder/300/300',
      href: '/products/beard-oil',
      category: 'Body Oils'
    },
    // Room Sprays
    {
      id: 'calm-down-girl-room-spray',
      name: 'Calm Down Girl Room Spray',
      price: '$12.00',
      image: '/api/placeholder/300/300',
      href: '/products/calm-down-girl-room-spray',
      category: 'Room Sprays'
    },
    // Clothing
    {
      id: 'calm-down-girl-ladies-dress',
      name: 'Calm Down Girl Ladies Dress',
      price: '$35.00',
      image: '/api/placeholder/300/300',
      href: '/products/calm-down-girl-ladies-dress',
      category: 'Clothing & Accessories'
    }
  ];

  const categories = ['All', 'Candles', 'Skincare', 'Body Oils', 'Room Sprays', 'Clothing & Accessories'];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/collections" 
            className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Link>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">All Products</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Discover our complete collection of handcrafted candles, skincare products, body oils, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {allProducts.map((product) => (
              <Link key={product.id} href={product.href} className="group">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 relative">
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded z-10">
                      {product.badge}
                    </span>
                  )}
                  <div className="aspect-square relative">
                    <Image
                      src={product.image}
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
