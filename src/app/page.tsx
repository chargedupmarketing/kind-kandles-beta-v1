'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Heart, Leaf, Clock, Shield, Truck } from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
import LimitedTimeOffer from '@/components/LimitedTimeOffer';
import TrustBadges from '@/components/TrustBadges';
import SocialProofNotifications from '@/components/SocialProofNotifications';
import FragranceCarousel from '@/components/FragranceCarousel';
import FeaturedProductsSlider from '@/components/FeaturedProductsSlider';

export default function Home() {
  // Pre-Black Friday sale end time (November 27th, 2025 at 11:59 PM)
  const preBlackFridayEndTime = new Date('2025-11-27T23:59:59');

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
        <div className="hero-text absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-3 animate-bounce">
            <span className="text-white font-semibold text-lg" style={{ textShadow: '0 0 8px rgba(236, 72, 153, 1), 0 0 12px rgba(236, 72, 153, 0.6)' }}>
              Deals Below!
            </span>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 6px rgba(236, 72, 153, 1))' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Pre-Black Friday Countdown */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-100 to-purple-100">
        <div className="max-w-4xl mx-auto">
          <CountdownTimer
            endTime={preBlackFridayEndTime}
            title="🔥 PRE-BLACK FRIDAY SALE ENDS SOON! 🔥"
            subtitle="Early Bird Special - Save 25% on everything + FREE shipping over $50!"
            variant="default"
          />
        </div>
      </section>

      {/* Featured Products Slider */}
      <FeaturedProductsSlider />

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
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

      {/* Fragrance Carousel Section */}
      <FragranceCarousel />

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

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-r from-pink-100 to-purple-100 dark:from-gray-800 dark:to-gray-700">
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