'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  href: string;
  category: string;
  description: string;
  badge?: string;
  isCandle?: boolean;
  burnTime?: string;
  stockLevel?: number;
}

const productCategories = [
  {
    id: 'candles',
    name: 'Candles',
    icon: '🕯️',
    color: 'from-amber-500 to-orange-500',
    products: [
      {
        id: 1,
        name: "Calm Down Girl - Eucalyptus and Spearmint Candle",
        price: "$20.00",
        originalPrice: "$25.00",
        image: "https://i.imgur.com/s1R5mn7.jpg",
        href: "/products/calm-down-girl-eucalyptus-spearmint",
        category: "Candles",
        description: "Relaxing eucalyptus and spearmint blend for ultimate calm",
        badge: "🔥 Flash Sale",
        isCandle: true,
        burnTime: "45 hours",
        stockLevel: 3
      },
      {
        id: 2,
        name: "Purple Love Candle",
        price: "From $16.00",
        image: "https://i.imgur.com/s2aqKw9.jpg",
        href: "/products/purple-love",
        category: "Candles",
        description: "Floral and romantic scent that fills your space with love",
        isCandle: true,
        burnTime: "40 hours",
        stockLevel: 7,
        badge: "Limited Edition"
      },
      {
        id: 3,
        name: "No Sad Songs for Me - Sea Salt and Orchid",
        price: "$22.00",
        image: "https://i.imgur.com/53mlnaz.jpg",
        href: "/products/no-sad-songs-for-me-sea-salt-orchid",
        category: "Candles",
        description: "Refreshing sea salt and exotic orchid fragrance blend",
        isCandle: true,
        burnTime: "50 hours",
        stockLevel: 12
      }
    ]
  },
  {
    id: 'skincare',
    name: 'Skincare',
    icon: '✨',
    color: 'from-pink-500 to-purple-500',
    products: [
      {
        id: 4,
        name: "Whipped Body Butter",
        price: "$22.00",
        image: "https://i.imgur.com/bPkDJHq.jpg",
        href: "/products/whipped-body-butter",
        category: "Skincare",
        description: "Luxurious hydration that melts into your skin",
        badge: "🔥 Trending",
        isCandle: false,
        stockLevel: 12
      },
      {
        id: 5,
        name: "Foaming Body Scrub",
        price: "$18.00",
        image: "https://i.imgur.com/16wnKXs.jpg",
        href: "/products/foaming-body-scrub",
        category: "Skincare",
        description: "Exfoliating scrub that leaves skin smooth and radiant",
        isCandle: false,
        stockLevel: 8
      },
      {
        id: 6,
        name: "Natural Handmade Bar Soap",
        price: "$8.00",
        image: "https://i.imgur.com/6wxzohI.jpg",
        href: "/products/natural-bar-soap",
        category: "Skincare",
        description: "Gentle cleansing with natural ingredients",
        isCandle: false,
        stockLevel: 20
      }
    ]
  },
  {
    id: 'body-oils',
    name: 'Body Oils',
    icon: '🌿',
    color: 'from-green-500 to-emerald-500',
    products: [
      {
        id: 7,
        name: "Rosemary & Peppermint Herbal Hair Oil",
        price: "$18.00",
        image: "https://i.imgur.com/XOUMRVy.jpg",
        href: "/products/rosemary-peppermint-herbal-hair-oil",
        category: "Body Oils",
        description: "Invigorating herbal blend for healthy, lustrous hair",
        isCandle: false,
        stockLevel: 6
      },
      {
        id: 8,
        name: "Calm Down Girl - Herbal Hair Oil",
        price: "$24.00",
        image: "https://i.imgur.com/MZGGxzk.jpg",
        href: "/products/calm-down-girl-herbal-hair-oil",
        category: "Body Oils",
        description: "Soothing herbal formula for relaxation and hair health",
        badge: "Best Seller",
        isCandle: false,
        stockLevel: 15
      },
      {
        id: 9,
        name: "Warm Embrace Body Oil",
        price: "$20.00",
        image: "https://i.imgur.com/lUQKxUw.jpg",
        href: "/products/warm-embrace-body-oil",
        category: "Body Oils",
        description: "Comforting blend that wraps you in warmth",
        isCandle: false,
        stockLevel: 10
      }
    ]
  }
];

export default function FeaturedProductsSlider() {
  const [activeCategory, setActiveCategory] = useState(0);

  const currentCategory = productCategories[activeCategory];

  const handleCategoryChange = (index: number) => {
    setActiveCategory(index);
  };

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="serif-font text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">
            🌟 Featured Products 🌟
          </h2>
          <p className="text-base sm:text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed px-2">
            Our most beloved handmade treasures, crafted with love and flying off the shelves
          </p>
          <div className="script-font text-amber-600 dark:text-amber-400 text-base sm:text-lg mt-2 sm:mt-3">
            ✨ Each piece tells a story of kindness ✨
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 flex-wrap">
          {productCategories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(index)}
              className={`px-4 sm:px-8 py-2 sm:py-4 rounded-xl font-semibold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 ${
                activeCategory === index
                  ? `bg-gradient-to-r ${category.color} text-white shadow-xl`
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:shadow-lg'
              }`}
            >
              <span className="mr-1 sm:mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Product Grid - All 3 Products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {currentCategory.products.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              {/* Product Image */}
              <div className="relative h-[250px] sm:h-[300px]">
                {/* TODO: Replace with Shopify product images when backend is connected */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.badge && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse">
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Stock Alert */}
                {product.stockLevel && product.stockLevel <= 5 && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      Only {product.stockLevel} left!
                    </span>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute bottom-3 left-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${currentCategory.color} text-white shadow-lg`}>
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <h3 className="serif-font text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 line-clamp-2">
                  {product.name}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 text-sm leading-relaxed line-clamp-2 flex-grow">
                  {product.description}
                </p>

                {/* Burn Time for Candles */}
                {product.isCandle && 'burnTime' in product && product.burnTime && (
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {product.burnTime} burn time
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                  <span className="serif-font text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {product.price}
                  </span>
                  {'originalPrice' in product && product.originalPrice && (
                    <>
                      <span className="text-base sm:text-lg text-gray-500 line-through">
                        {product.originalPrice}
                      </span>
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        Save 20%
                      </span>
                    </>
                  )}
                </div>

                {/* CTA Button */}
                <Link
                  href={product.href}
                  className="btn-primary w-full text-center py-2.5 sm:py-3 text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all mt-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  {product.isCandle ? 'Light Up Your Space' : 'Choose Options'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            href={`/collections/${currentCategory.id}`}
            className="inline-flex items-center gap-2 text-lg font-semibold text-pink-600 hover:text-pink-700 transition-colors"
          >
            View All {currentCategory.name}
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

