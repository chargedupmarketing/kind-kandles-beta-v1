'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Heart, Leaf, Clock, Shield, Truck } from 'lucide-react';
import CountdownTimer from '@/components/CountdownTimer';
import LimitedTimeOffer from '@/components/LimitedTimeOffer';
import TrustBadges from '@/components/TrustBadges';
import FragranceCarousel from '@/components/FragranceCarousel';
import FeaturedProductsSlider from '@/components/FeaturedProductsSlider';

interface CountdownPromo {
  enabled: boolean;
  title: string;
  subtitle: string;
  end_date: string;
  end_time: string;
  background_style: 'pink-purple' | 'teal' | 'dark' | 'custom';
}

interface FlashSaleUrgency {
  enabled: boolean;
  text: string;
  show_icon: boolean;
}

interface PromotionsSettings {
  countdown_promo: CountdownPromo;
  flash_sale_urgency: FlashSaleUrgency;
}

const DEFAULT_COUNTDOWN: CountdownPromo = {
  enabled: true,
  title: '🔥 PRE-BLACK FRIDAY SALE ENDS SOON! 🔥',
  subtitle: 'Early Bird Special - Save 25% on everything + FREE shipping over $50!',
  end_date: '2025-11-27',
  end_time: '23:59',
  background_style: 'pink-purple'
};

const DEFAULT_URGENCY: FlashSaleUrgency = {
  enabled: true,
  text: 'Flash sale ends in 24 hours - Don\'t miss out!',
  show_icon: true
};

export default function Home() {
  const [countdownSettings, setCountdownSettings] = useState<CountdownPromo>(DEFAULT_COUNTDOWN);
  const [urgencySettings, setUrgencySettings] = useState<FlashSaleUrgency>(DEFAULT_URGENCY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/promotions');
        if (response.ok) {
          const data = await response.json();
          if (data.value?.countdown_promo) {
            setCountdownSettings({ ...DEFAULT_COUNTDOWN, ...data.value.countdown_promo });
          }
          if (data.value?.flash_sale_urgency) {
            setUrgencySettings({ ...DEFAULT_URGENCY, ...data.value.flash_sale_urgency });
          }
        }
      } catch (error) {
        console.error('Error fetching promotions settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchSettings();
  }, []);

  // Parse end date and time from settings
  const getEndTime = () => {
    const dateStr = countdownSettings.end_date;
    const timeStr = countdownSettings.end_time;
    return new Date(`${dateStr}T${timeStr}:59`);
  };

  const getBackgroundClass = () => {
    switch (countdownSettings.background_style) {
      case 'teal':
        return 'bg-gradient-to-r from-teal-50 to-emerald-100 dark:from-teal-900 dark:to-cyan-900';
      case 'dark':
        return 'bg-gradient-to-r from-gray-700 to-gray-800';
      case 'custom':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900';
      case 'pink-purple':
      default:
        return 'bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700';
    }
  };

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
      {/* Hero Section */}
      <section className="hero-section relative h-screen flex flex-col justify-end overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-[67%_center] sm:object-center"
        >
          <source src="/logos/hero.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay - Much lighter on mobile for maximum video visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent sm:bg-black sm:bg-opacity-40"></div>
        
        {/* Content - Minimal on mobile, at very bottom */}
        <div className="hero-text relative z-10 text-white text-center sm:text-right">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-20">
            <div className="max-w-3xl mx-auto sm:ml-auto sm:mr-0 sm:pr-8 md:pr-12 lg:pr-16">
              {/* Hide description on mobile, show on tablet+ */}
              <p className="hidden sm:block text-lg md:text-xl opacity-80 mb-10 font-light leading-relaxed animate-fade-in-up">
                Discover our collection of natural handmade candles, luxurious skincare, and boutique items crafted with love and natural ingredients.
              </p>
              
              {/* Compact buttons on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center sm:justify-end animate-fade-in-up animation-delay-300">
                <Link href="/collections/all" className="glass-button bg-white/30 backdrop-blur-sm hover:bg-white/40 font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 border border-white/50 inline-flex items-center justify-center transform hover:scale-105 text-sm sm:text-base whitespace-nowrap shadow-lg">
                  Shop All Products
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link href="/about/mission" className="bg-transparent hover:bg-white/20 backdrop-blur-sm font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full border-2 border-white/70 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base whitespace-nowrap shadow-lg">
                  Our Mission
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator - At very bottom on mobile */}
        <div className="hero-text absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-2 sm:gap-3 animate-bounce bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-white font-bold text-xs sm:text-lg" style={{ textShadow: '0 0 10px rgba(236, 72, 153, 1), 0 0 20px rgba(236, 72, 153, 0.8)' }}>
              Deals Below!
            </span>
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 1))' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Pre-Black Friday Countdown */}
      {countdownSettings.enabled && (
        <section className={`py-12 px-4 sm:px-6 lg:px-8 ${getBackgroundClass()}`}>
          <div className="max-w-4xl mx-auto">
            <CountdownTimer
              endTime={getEndTime()}
              title={countdownSettings.title}
              subtitle={countdownSettings.subtitle}
              variant="default"
            />
          </div>
        </section>
      )}

      {/* Featured Products Slider */}
      <FeaturedProductsSlider />

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Why Choose Natural?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 px-2">
              The benefits of our natural ingredients and handmade process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center px-4">
                <div className="flex justify-center mb-3 sm:mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
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
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="serif-font text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Why Choose My Kind Kandles & Boutique?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              We're committed to bringing you the highest quality handmade products with exceptional service and care.
            </p>
          </div>
          <TrustBadges variant="horizontal" showAll={true} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <span className="text-5xl sm:text-6xl flame-flicker">🕯️</span>
          </div>
          <h2 className="serif-font text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
            Ready to Experience Kindness?
          </h2>
          <p className="text-base sm:text-xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            Join thousands of customers who have made the switch to natural, handmade products that care for your skin and the environment.
          </p>
          <div className="script-font text-xl sm:text-2xl text-amber-600 mb-6 sm:mb-8">
            ✨ Light up your world with intention ✨
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
            <Link href="/collections/all" className="btn-candle text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4">
              🛍️ Start Shopping Now
            </Link>
            <Link href="/customs" className="btn-secondary text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4">
              🎨 Book Candle Making Experience
            </Link>
          </div>
          
          {/* Urgency Element */}
          {urgencySettings.enabled && (
            <div className="mt-6 sm:mt-8 inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 sm:px-6 py-2 sm:py-3 mx-4">
              {urgencySettings.show_icon && (
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 animate-pulse flex-shrink-0" />
              )}
              <span className="text-red-700 font-medium text-xs sm:text-base">{urgencySettings.text}</span>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
