'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Heart, Leaf, Clock, Shield, Truck } from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
import LimitedTimeOffer from '@/components/LimitedTimeOffer';
import TrustBadges from '@/components/TrustBadges';
import SocialProofNotifications from '@/components/SocialProofNotifications';
import FragranceCarousel from '@/components/FragranceCarousel';

export default function Home() {
  // Pre-Black Friday sale end time (November 26th, 2024 at 11:59 PM)
  const preBlackFridayEndTime = new Date('2024-11-26T23:59:59');

  const featuredProducts = [
    {
      id: 1,
      name: "Calm Down Girl-Eucalyptus and Spearmint Candle",
      price: "$20.00",
      originalPrice: "$25.00",
      image: "/api/placeholder/300/300",
      badge: "🔥 Flash Sale",
      href: "/products/calm-down-girl-eucalyptus-spearmint",
      isCandle: true,
      scentProfile: "herbal",
      burnTime: "45 hours",
      stockLevel: 3
    },
    {
      id: 2,
      name: "Whipped Body Butter",
      price: "$22.00",
      image: "/api/placeholder/300/300",
      href: "/products/whipped-body-butter",
      isCandle: false,
      stockLevel: 12,
      isTrending: true
    },
    {
      id: 3,
      name: "Purple Love Candle",
      price: "From $16.00",
      image: "/api/placeholder/300/300",
      href: "/products/purple-love",
      isCandle: true,
      scentProfile: "floral",
      burnTime: "40 hours",
      stockLevel: 7,
      isLimitedEdition: true
    }
  ];

  const benefits = [
    {
      icon: <Leaf className="h-8 w-8 text-green-600" />,
      title: "Natural Ingredients",
      description: "Our natural ingredients aim to promote healthy skin and even reduce inflammation!"
    },
    {
      icon: <Sparkles className="h-8 w-8 text-purple-600" />,
      title: "Exfoliating Benefits",
      description: "Did you know, exfoliating helps to remove dead skin cells? This leaves your skin smooth and fresh."
    },
    {
      icon: <Heart className="h-8 w-8 text-pink-600" />,
      title: "Deep Moisturizing",
      description: "Moisturizing with body butter deeply hydrates your skin, keeping it soft and nourished."
    }
  ];

  return (
    <>
        {/* Social Proof Notifications */}
        <SocialProofNotifications position="bottom-left" />

      {/* Hero Section */}
      <section className="hero-section relative h-screen flex flex-col justify-end overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/logos/hero.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Content - Positioned at bottom right to align with video text */}
        <div className="hero-text relative z-10 text-right text-white px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl ml-auto pr-8 sm:pr-12 lg:pr-16">
              <p className="text-lg md:text-xl opacity-80 mb-10 font-light leading-relaxed animate-fade-in-up">
                Discover our collection of natural handmade candles, luxurious skincare, and boutique items crafted with love and natural ingredients.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-end animate-fade-in-up animation-delay-300">
              <Link href="/collections/all" className="glass-button bg-white bg-opacity-20 hover:bg-opacity-30 font-medium py-3 px-8 rounded-full transition-all duration-300 border border-white border-opacity-30 inline-flex items-center justify-center transform hover:scale-105">
                Shop All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/about/mission" className="bg-transparent hover:bg-white hover:bg-opacity-10 font-medium py-3 px-8 rounded-full border-2 border-white border-opacity-50 transition-all duration-300 transform hover:scale-105">
                Our Mission
              </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="hero-text absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-70">
          <div className="animate-bounce">
            <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-candle dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="serif-font text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
              ✨ Shop by Category ✨
            </h2>
            <p className="text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Explore our carefully curated collections of handmade treasures, each crafted with love and intention
            </p>
            <div className="script-font text-amber-600 dark:text-amber-400 text-lg mt-3">
              🕯️ Light up your world with kindness 🕯️
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="group text-center">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl w-32 h-32 mx-auto flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 border-2 border-amber-200">
                  <span className="text-6xl flame-flicker">🕯️</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  Sale!
                </div>
              </div>
              <h3 className="serif-font text-2xl font-bold mb-3 text-gray-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Essence</h3>
              <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">Handcrafted candles with natural fragrances that fill your space with warmth and intention</p>
              <Link href="/collections/candles" className="btn-candle inline-block">
                🔥 Shop Candles
              </Link>
            </div>
            
            <div className="group text-center">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl w-32 h-32 mx-auto flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 border-2 border-purple-200">
                  <span className="text-6xl">✨</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  New!
                </div>
              </div>
              <h3 className="serif-font text-2xl font-bold mb-3 text-gray-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Glow</h3>
              <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">Natural skincare for radiant, healthy skin that glows from within</p>
              <Link href="/collections/skincare" className="teal-button inline-block">
                💫 Shop Skincare
              </Link>
            </div>
            
            <div className="group text-center">
              <div className="relative mb-6">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl w-32 h-32 mx-auto flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 border-2 border-green-200">
                  <span className="text-6xl">🌿</span>
                </div>
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Popular
                </div>
              </div>
              <h3 className="serif-font text-2xl font-bold mb-3 text-gray-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Renew</h3>
              <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">Body oils and treatments for self-care rituals that nourish your soul</p>
              <Link href="/collections/body-oils" className="btn-secondary inline-block">
                🌱 Shop Body Oils
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Black Friday Countdown */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto">
          <CountdownTimer
            endTime={preBlackFridayEndTime}
            title="🔥 PRE-BLACK FRIDAY SALE ENDS SOON! 🔥"
            subtitle="Get ready for Black Friday - Save 25% on everything + FREE shipping!"
            variant="default"
          />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-amber-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="serif-font text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
              🌟 Featured Products 🌟
            </h2>
            <p className="text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Our most beloved handmade treasures, crafted with love and flying off the shelves
            </p>
            <div className="script-font text-amber-600 dark:text-amber-400 text-lg mt-3">
              ✨ Each piece tells a story of kindness ✨
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredProducts.map((product) => (
              <div key={product.id} className={`${product.isCandle ? 'card-candle' : 'card'} group relative`}>
                <div className="relative overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-amber-50 to-orange-50 rounded-t-lg flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    <div className="flex flex-col items-center justify-center text-amber-400">
                      <div className="text-4xl mb-2">
                        {product.isCandle ? '🕯️' : '✨'}
                      </div>
                      <span className="text-sm font-medium">Product Image</span>
                    </div>
                  </div>
                  
                  {/* Enhanced Badge System */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.badge && (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse">
                        {product.badge}
                      </span>
                    )}
                    {product.isLimitedEdition && (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg">
                        Limited Edition
                      </span>
                    )}
                    {product.isTrending && (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                        🔥 Trending
                      </span>
                    )}
                  </div>

                  {/* Stock Level Indicator */}
                  {product.stockLevel && product.stockLevel <= 5 && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        Only {product.stockLevel} left!
                      </span>
                    </div>
                  )}

                  {/* Candle Flame Effect on Hover */}
                  {product.isCandle && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-orange-400 flame-flicker">🔥</div>
                    </div>
                  )}
                </div>
                
                <div className="p-6 bg-white">
                  {/* Product Title */}
                  <h3 className="serif-font text-xl font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  
                  {/* Burn Time for Candles */}
                  {product.isCandle && product.burnTime && (
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-gray-600 font-medium">{product.burnTime} burn time</span>
                    </div>
                  )}
                  
                  {/* Pricing */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="serif-font text-xl font-bold text-gray-900">{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
                      )}
                    </div>
                    {product.originalPrice && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Save 20%
                      </span>
                    )}
                  </div>
                  
                  {/* Enhanced CTA Button */}
                  <Link
                    href={product.href}
                    className={`w-full text-center transition-all duration-300 block ${
                      product.isCandle 
                        ? 'btn-candle glow-pulse' 
                        : 'btn-primary'
                    }`}
                  >
                    {product.isCandle ? '🕯️ Light Up Your Space' : '✨ Choose Options'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 gradient-teal-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Natural?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The benefits of our natural ingredients and handmade process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
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

      {/* Fragrance Carousel Section */}
      <FragranceCarousel />

      {/* CTA Section */}
      <section className="gradient-warm py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 to-orange-100/30"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="text-6xl flame-flicker">🕯️</span>
          </div>
          <h2 className="serif-font text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Experience Kindness?
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of customers who have made the switch to natural, handmade products that care for your skin and the environment.
          </p>
          <div className="script-font text-2xl text-amber-600 mb-8">
            ✨ Light up your world with intention ✨
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/collections/all" className="btn-candle text-lg px-10 py-4">
              🛍️ Start Shopping Now
            </Link>
            <Link href="/customs" className="btn-secondary text-lg px-10 py-4">
              🎨 Book Candle Making Experience
            </Link>
          </div>
          
          {/* Urgency Element */}
          <div className="mt-8 inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-6 py-3">
            <Clock className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="text-red-700 font-medium">Flash sale ends in 24 hours - Don't miss out!</span>
          </div>
        </div>
      </section>
    </>
  );
}