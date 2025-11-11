'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from './LazyImage';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface FragranceCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  link: string;
  color: string;
}

const fragranceCategories: FragranceCategory[] = [
  {
    id: 'amber',
    name: 'AMBER',
    description: 'Warm, rich, and luxurious scents',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=500&fit=crop&crop=center&auto=format&q=80',
    link: '/collections/candles/amber',
    color: 'from-orange-600 to-red-700'
  },
  {
    id: 'gourmand',
    name: 'GOURMAND',
    description: 'Sweet, edible, and comforting aromas',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=500&fit=crop&crop=center&auto=format&q=80',
    link: '/collections/candles/gourmand',
    color: 'from-amber-600 to-orange-700'
  },
  {
    id: 'earthy',
    name: 'EARTHY',
    description: 'Natural, grounding, and organic scents',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=500&fit=crop&crop=center&auto=format&q=80',
    link: '/collections/candles/earthy',
    color: 'from-green-600 to-emerald-700'
  },
  {
    id: 'floral',
    name: 'FLORAL',
    description: 'Delicate, romantic, and feminine notes',
    image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=500&fit=crop&crop=center&auto=format&q=80',
    link: '/collections/candles/floral',
    color: 'from-pink-500 to-rose-600'
  },
  {
    id: 'oceanic',
    name: 'OCEANIC',
    description: 'Fresh, clean, and aquatic vibes',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=500&fit=crop&crop=center&auto=format&q=80',
    link: '/collections/candles/oceanic',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'citrus',
    name: 'CITRUS',
    description: 'Bright, energizing, and zesty scents',
    image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400&h=500&fit=crop&crop=center&auto=format&q=80',
    link: '/collections/candles/citrus',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'woodsy',
    name: 'WOODSY',
    description: 'Deep, masculine, and forest-inspired',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=500&fit=crop&crop=center&auto=format&q=80',
    link: '/collections/candles/woodsy',
    color: 'from-amber-700 to-brown-800'
  },
  {
    id: 'fresh',
    name: 'FRESH',
    description: 'Clean, crisp, and invigorating scents',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=500&fit=crop&crop=center&auto=format&q=80',
    link: '/collections/candles/fresh',
    color: 'from-green-400 to-teal-500'
  }
];

const FragranceCarousel = memo(() => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.3,
    triggerOnce: false
  });

  // Auto-rotate carousel - only when visible
  useEffect(() => {
    if (!isAutoPlaying || !isIntersecting) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === fragranceCategories.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, isIntersecting]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? fragranceCategories.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex === fragranceCategories.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide]);

  // Calculate visible slides (show 5 at a time on desktop, 3 on tablet, 1 on mobile)
  const getVisibleSlides = () => {
    const slides = [];
    for (let i = 0; i < 5; i++) {
      const index = (currentIndex + i) % fragranceCategories.length;
      slides.push(fragranceCategories[index]);
    }
    return slides;
  };

  const visibleSlides = getVisibleSlides();

  return (
    <section ref={targetRef} className="py-20 px-4 sm:px-6 lg:px-8 gradient-teal-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="serif-font text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            ✨ Shop by Fragrance ✨
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Discover your perfect scent from our carefully curated fragrance families. 
            <span className="script-font text-2xl text-pink-600 dark:text-pink-400 block mt-2">
              🕯️ Each candle tells a story through scent 🕯️
            </span>
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110"
            aria-label="Previous fragrance"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-slate-300" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110"
            aria-label="Next fragrance"
          >
            <ChevronRight className="h-6 w-6 text-gray-700 dark:text-slate-300" />
          </button>

          {/* Carousel Track */}
          <div className="flex gap-4 transition-transform duration-700 ease-in-out px-12">
            {visibleSlides.map((category, index) => (
              <Link
                key={`${category.id}-${currentIndex}-${index}`}
                href={category.link}
                className="group flex-shrink-0 w-full sm:w-1/3 lg:w-1/5"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                  {/* Background Image */}
                  <div className="aspect-[4/5] relative">
                    <LazyImage
                      src={category.image}
                      alt={`${category.name} fragrance collection`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60 group-hover:opacity-70 transition-opacity duration-300`} />
                    
                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <h3 className="serif-font text-2xl font-bold mb-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        {category.name}
                      </h3>
                      <p className="text-sm opacity-90 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {category.description}
                      </p>
                      
                      {/* Hover Arrow */}
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-150">
                        <span className="inline-flex items-center text-sm font-medium">
                          Explore Collection
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 gap-2">
            {fragranceCategories.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-pink-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-gray-600 dark:text-slate-300 mb-6 leading-relaxed">
            Can't decide? Browse our complete collection or let us help you find your signature scent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/collections/candles" className="btn-candle">
              🕯️ Shop All Candles
            </Link>
            <Link href="/customs" className="teal-button">
              🎨 Create Custom Scent
            </Link>
          </div>
          <div className="script-font text-pink-600 dark:text-pink-400 text-lg mt-4">
            ✨ Handcrafted with love, just for you ✨
          </div>
        </div>
      </div>
    </section>
  );
});

FragranceCarousel.displayName = 'FragranceCarousel';

export default FragranceCarousel;
