'use client';

import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function SkincarePage() {
  const skincareCategories = [
    { name: 'Foaming Body Scrub', href: '/collections/skincare/foaming-body-scrub', count: 3 },
    { name: 'Body Spray Mist', href: '/collections/skincare/body-spray-mist', count: 4 },
    { name: 'Handmade Lotion', href: '/collections/skincare/handmade-lotion', count: 5 },
    { name: 'Whipped Body Butter', href: '/collections/skincare/whipped-body-butter', count: 6 },
    { name: 'Natural Bar Soap', href: '/collections/skincare/natural-handmade-bar-soap', count: 4 }
  ];

  const skincareProducts = [
    {
      id: 'luxury-whipped-body-butter',
      name: 'Luxury Whipped Body Butter',
      price: '$22.00',
      image: '/api/placeholder/300/300',
      href: '/products/luxury-whipped-body-butter',
      description: 'Rich, creamy body butter that deeply moisturizes and nourishes skin with natural ingredients'
    },
    {
      id: 'foaming-body-scrub-lavender',
      name: 'Foaming Body Scrub - Lavender',
      price: '$18.00',
      image: '/api/placeholder/300/300',
      href: '/products/foaming-body-scrub-lavender',
      description: 'Gentle exfoliating scrub with lavender essential oil to remove dead skin cells'
    },
    {
      id: 'handmade-lotion-vanilla',
      name: 'Handmade Lotion - Vanilla',
      price: '$15.00',
      image: '/api/placeholder/300/300',
      href: '/products/handmade-lotion-vanilla',
      description: 'Daily moisturizing lotion with warm vanilla scent and natural ingredients'
    },
    {
      id: 'body-spray-mist-rose',
      name: 'Body Spray Mist - Rose',
      price: '$12.00',
      image: '/api/placeholder/300/300',
      href: '/products/body-spray-mist-rose',
      description: 'Refreshing body mist with delicate rose fragrance for all-day freshness'
    },
    {
      id: 'natural-bar-soap-oatmeal',
      name: 'Natural Bar Soap - Oatmeal & Honey',
      price: '$8.00',
      image: '/api/placeholder/300/300',
      href: '/products/natural-bar-soap-oatmeal',
      description: 'Gentle cleansing bar with oatmeal and honey for sensitive skin'
    },
    {
      id: 'whipped-body-butter-coconut',
      name: 'Whipped Body Butter - Coconut',
      price: '$20.00',
      image: '/api/placeholder/300/300',
      href: '/products/whipped-body-butter-coconut',
      description: 'Light, fluffy body butter with tropical coconut scent'
    }
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

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Hero Section */}
      <section className="gradient-bg dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 py-16 px-4 sm:px-6 lg:px-8">
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 gradient-teal-subtle">
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
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {category.count} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              All Skincare Products ({skincareProducts.length})
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
            {skincareProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Ingredients Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 gradient-amber-subtle">
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
