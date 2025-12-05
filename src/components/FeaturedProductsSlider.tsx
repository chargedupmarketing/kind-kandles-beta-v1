'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Sparkles, ChevronRight, Package } from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  collectionHandle: string;
  enabled: boolean;
  order: number;
}

interface FeaturedSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  tagline: string;
  show_emojis: boolean;
  categories: ProductCategory[];
  products_per_category: number;
  show_sale_badge: boolean;
  show_stock_alert: boolean;
  stock_alert_threshold: number;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  product_type: string | null;
  tags: string[] | null;
  images: { url: string; alt_text: string | null }[];
  variants: { inventory_quantity: number }[];
}

const DEFAULT_SETTINGS: FeaturedSettings = {
  enabled: true,
  title: 'Featured Products',
  subtitle: 'Our most beloved handmade treasures, crafted with love and flying off the shelves',
  tagline: 'Each piece tells a story of kindness',
  show_emojis: true,
  categories: [
    {
      id: 'candles',
      name: 'Candles',
      icon: '🕯️',
      color: 'from-amber-500 to-orange-500',
      collectionHandle: 'candles',
      enabled: true,
      order: 0
    },
    {
      id: 'skincare',
      name: 'Skincare',
      icon: '✨',
      color: 'from-teal-500 to-cyan-500',
      collectionHandle: 'skincare',
      enabled: true,
      order: 1
    },
    {
      id: 'body-oils',
      name: 'Body Oils',
      icon: '🌿',
      color: 'from-green-500 to-emerald-500',
      collectionHandle: 'body-oils',
      enabled: true,
      order: 2
    }
  ],
  products_per_category: 3,
  show_sale_badge: true,
  show_stock_alert: true,
  stock_alert_threshold: 5
};

export default function FeaturedProductsSlider() {
  const [settings, setSettings] = useState<FeaturedSettings>(DEFAULT_SETTINGS);
  const [activeCategory, setActiveCategory] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/featured_products');
        if (response.ok) {
          const data = await response.json();
          if (data.value) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.value });
          }
        }
      } catch (error) {
        console.error('Error fetching featured products settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    fetchSettings();
  }, []);

  // Get enabled categories sorted by order
  const enabledCategories = settings.categories
    .filter(cat => cat.enabled)
    .sort((a, b) => a.order - b.order);

  const currentCategory = enabledCategories[activeCategory] || enabledCategories[0];

  // Fetch products from database
  useEffect(() => {
    if (!settingsLoaded || !currentCategory) return;

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/collections/${currentCategory.collectionHandle}?limit=${settings.products_per_category}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [currentCategory?.collectionHandle, settingsLoaded, settings.products_per_category]);

  const handleCategoryChange = (index: number) => {
    setActiveCategory(index);
  };

  const isCandle = (product: Product) => {
    return product.product_type?.toLowerCase().includes('candle') || 
           product.tags?.some(tag => tag.toLowerCase().includes('candle'));
  };

  const getBurnTime = (product: Product) => {
    const burnTimeTag = product.tags?.find(tag => tag.toLowerCase().includes('hour'));
    return burnTimeTag || null;
  };

  // Don't render if section is disabled or no categories
  if (!settings.enabled || enabledCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="serif-font text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">
            {settings.show_emojis ? '🌟 ' : ''}{settings.title}{settings.show_emojis ? ' 🌟' : ''}
          </h2>
          <p className="text-base sm:text-xl text-gray-700 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed px-2">
            {settings.subtitle}
          </p>
          <div className="script-font text-amber-600 dark:text-amber-400 text-base sm:text-lg mt-2 sm:mt-3">
            ✨ {settings.tagline} ✨
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 flex-wrap">
          {enabledCategories.map((category, index) => (
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-600 border-t-transparent"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && currentCategory && (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No products yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Check back soon for our handmade {currentCategory.name.toLowerCase()}!
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
            >
              Browse All Collections
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && products.length > 0 && currentCategory && (
          <div className={`grid grid-cols-1 ${settings.products_per_category === 2 ? 'md:grid-cols-2' : settings.products_per_category >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-4 sm:gap-8`}>
            {products.map((product) => {
              const discountPercent = product.compare_at_price 
                ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                : 0;
              const inventoryQuantity = product.variants?.[0]?.inventory_quantity || 0;
              const productIsCandle = isCandle(product);
              const burnTime = getBurnTime(product);
              
              return (
                <div key={product.id} className="bg-white dark:bg-gray-700 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
                  {/* Product Image */}
                  <div className="relative h-[250px] sm:h-[300px]">
                    <img
                      src={product.images?.[0]?.url || '/api/placeholder/300/300'}
                      alt={product.images?.[0]?.alt_text || product.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {settings.show_sale_badge && product.compare_at_price && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse">
                          Sale
                        </span>
                      )}
                    </div>

                    {/* Stock Alert */}
                    {settings.show_stock_alert && inventoryQuantity <= settings.stock_alert_threshold && inventoryQuantity > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                          Only {inventoryQuantity} left!
                        </span>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${currentCategory.color} text-white shadow-lg`}>
                        {product.product_type || currentCategory.name}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 sm:p-6 flex flex-col flex-grow">
                    <h3 className="serif-font text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 line-clamp-2">
                      {product.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 text-sm leading-relaxed line-clamp-2 flex-grow">
                      {product.description || 'Handcrafted with love and care.'}
                    </p>

                    {/* Burn Time for Candles */}
                    {productIsCandle && burnTime && (
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {burnTime} burn time
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                      <span className="serif-font text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(product.price)}
                      </span>
                      {product.compare_at_price && (
                        <>
                          <span className="text-base sm:text-lg text-gray-500 line-through">
                            {formatPrice(product.compare_at_price)}
                          </span>
                          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            Save {discountPercent}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link
                      href={`/products/${product.handle}`}
                      className="btn-primary w-full text-center py-2.5 sm:py-3 text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all mt-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      {productIsCandle ? 'Light Up Your Space' : 'Choose Options'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View All Link */}
        {currentCategory && (
          <div className="text-center mt-12">
            <Link
              href={`/collections/${currentCategory.collectionHandle}`}
              className="inline-flex items-center gap-2 text-lg font-semibold text-pink-600 hover:text-pink-700 transition-colors"
            >
              View All {currentCategory.name}
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
