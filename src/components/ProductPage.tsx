'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2, Minus, Plus, Star, Shield, Truck, Heart, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import CountdownTimer from './CountdownTimer';
import InventoryAlert from './InventoryAlert';
import LimitedTimeOffer from './LimitedTimeOffer';
import SocialProofNotifications from './SocialProofNotifications';

interface ProductPageProps {
  product: {
    id: string;
    name: string;
    price: string;
    originalPrice?: string;
    description: string;
    ingredients?: string;
    careInstructions?: string;
    image: string;
    category: string;
    inStock: boolean;
    sizes?: string[];
    colors?: string[];
    variants?: any[];
    handle?: string;
    isCandle?: boolean;
    burnTime?: string;
    scentProfile?: string;
    rating?: number;
    reviewCount?: number;
    stockLevel?: number;
    isHandmade?: boolean;
    isNatural?: boolean;
  };
}

export default function ProductPage({ product }: ProductPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [showReviews, setShowReviews] = useState(false);
  const [showLimitedOffer, setShowLimitedOffer] = useState(true);

  // Create urgency timers (24 hours from now for demo)
  const saleEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  // Mock data for demonstration (will be replaced by Shopify data)
  const mockReviews = [
    {
      id: 1,
      name: "Sarah M.",
      rating: 5,
      date: "2 weeks ago",
      comment: "Absolutely love this candle! The scent is perfect and it burns evenly. Will definitely order again!",
      verified: true
    },
    {
      id: 2,
      name: "Jennifer K.",
      rating: 5,
      date: "1 month ago", 
      comment: "Beautiful candle with amazing throw. My whole house smells incredible when I light this!",
      verified: true
    },
    {
      id: 3,
      name: "Michelle R.",
      rating: 4,
      date: "3 weeks ago",
      comment: "Great quality and long burn time. The scent is exactly as described. Highly recommend!",
      verified: true
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-amber-50">
      {/* Limited Time Offer Banner */}
      {showLimitedOffer && product.originalPrice && (
        <LimitedTimeOffer
          title="🔥 Flash Sale Alert!"
          description="Save 20% on all candles - Limited time only!"
          discount={20}
          endTime={saleEndTime}
          minOrderAmount={50}
          variant="banner"
          onDismiss={() => setShowLimitedOffer(false)}
        />
      )}

      {/* Social Proof Notifications */}
      <SocialProofNotifications position="bottom-left" />

      {/* Breadcrumb */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 bg-gradient-candle">
        <div className="max-w-7xl mx-auto">
          <Link href="/collections" className="inline-flex items-center text-amber-700 hover:text-amber-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Link>
        </div>
      </section>

      {/* Product Details */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl overflow-hidden shadow-lg group">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                />
                {/* Trust Badges Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isHandmade && (
                    <span className="bg-white/90 backdrop-blur-sm text-amber-700 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                      ✋ Handmade
                    </span>
                  )}
                  {product.isNatural && (
                    <span className="bg-white/90 backdrop-blur-sm text-green-700 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                      🌿 Natural
                    </span>
                  )}
                  {product.isCandle && (
                    <span className="bg-white/90 backdrop-blur-sm text-orange-700 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                      🕯️ Soy Wax
                    </span>
                  )}
                </div>
                
                {/* Stock Level Indicator */}
                {product.stockLevel && product.stockLevel <= 5 && (
                  <div className="absolute bottom-4 right-4">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      Only {product.stockLevel} left!
                    </span>
                  </div>
                )}
              </div>
              
              {/* Recently Viewed Indicator */}
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span>12 people viewed this in the last hour</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-amber-600 font-medium">My Kind Kandles & Boutique</p>
                  <span className="text-amber-400">✨</span>
                </div>
                <h1 className="serif-font text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {product.name}
                </h1>
                
                {/* Rating & Reviews */}
                {product.rating && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {renderStars(product.rating)}
                      <span className="text-sm font-medium text-gray-700 ml-1">
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowReviews(!showReviews)}
                      className="text-sm text-amber-600 hover:text-amber-700 underline font-medium"
                    >
                      ({product.reviewCount || mockReviews.length} reviews)
                    </button>
                  </div>
                )}
                
                {/* Candle-Specific Info */}
                {product.isCandle && (
                  <div className="flex flex-wrap gap-4 mb-4">
                    {product.burnTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span>{product.burnTime} burn time</span>
                      </div>
                    )}
                    {product.scentProfile && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-amber-600">🌸</span>
                        <span className="capitalize">{product.scentProfile} scent</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price & Savings */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="serif-font text-3xl font-bold text-gray-900">
                      {product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xl text-gray-500 line-through">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                  {product.originalPrice && (
                    <div className="text-right">
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                        Save 20%
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Value Propositions */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <Shield className="h-3 w-3" />
                    30-day guarantee
                  </span>
                  <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                    <Truck className="h-3 w-3" />
                    Free shipping over $50
                  </span>
                  <span className="flex items-center gap-1 text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                    <Heart className="h-3 w-3" />
                    Made with kindness
                  </span>
                </div>
              </div>

              {/* Enhanced Stock Status with Inventory Alert */}
              <div className="mb-6">
                {product.inStock ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 font-medium">✅ In Stock - Ready to ship</span>
                    </div>
                    
                    {/* Advanced Inventory Alert */}
                    {product.stockLevel && product.stockLevel <= 15 && (
                      <InventoryAlert 
                        stockLevel={product.stockLevel}
                        productName={product.name}
                        variant="detailed"
                        showTrending={true}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 font-medium">❌ Currently sold out</span>
                  </div>
                )}
              </div>

              {/* Flash Sale Countdown for Individual Product */}
              {product.originalPrice && (
                <div className="mb-6">
                  <CountdownTimer
                    endTime={saleEndTime}
                    title="⚡ Flash Sale Ends In"
                    subtitle="Don't miss out on this special price!"
                    variant="default"
                  />
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <div className="flex space-x-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded-md ${
                          selectedSize === size
                            ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={decreaseQuantity}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-medium text-gray-900 dark:text-white w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Enhanced Add to Cart */}
              <div className="mb-8 space-y-4">
                <button
                  disabled={!product.inStock}
                  className={`w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                    product.inStock
                      ? 'btn-candle hover:scale-105 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.inStock ? (
                    <span className="flex items-center justify-center gap-2">
                      🕯️ Add to Cart - {product.price}
                    </span>
                  ) : (
                    'Currently Sold Out'
                  )}
                </button>
                
                {/* Secondary Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 btn-secondary py-3">
                    <Heart className="h-4 w-4 inline mr-2" />
                    Add to Wishlist
                  </button>
                  <button className="flex-1 btn-secondary py-3">
                    <Share2 className="h-4 w-4 inline mr-2" />
                    Share
                  </button>
                </div>
                
                {/* Trust Signals */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure & Safe Purchase</span>
                  </div>
                  <ul className="text-xs text-green-600 space-y-1">
                    <li>✓ SSL encrypted checkout</li>
                    <li>✓ 30-day money-back guarantee</li>
                    <li>✓ Handmade in Maryland with love</li>
                  </ul>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Ingredients */}
              {product.ingredients && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ingredients</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {product.ingredients}
                  </p>
                </div>
              )}

              {/* Care Instructions */}
              {product.careInstructions && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Care Instructions</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {product.careInstructions}
                  </p>
                </div>
              )}

            </div>
          </div>
          
          {/* Customer Reviews Section */}
          {showReviews && (
            <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="serif-font text-2xl font-bold text-gray-900">Customer Reviews</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(4.8)}
                  </div>
                  <span className="text-sm text-gray-600">4.8 out of 5</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {mockReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{review.name}</span>
                          {review.verified && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                              ✓ Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button className="btn-secondary">
                  View All Reviews
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Trust & Guarantee Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="serif-font text-3xl font-bold text-gray-900 mb-8">
            ✨ Our Promise to You ✨
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-4">🕯️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Handcrafted Quality</h3>
              <p className="text-sm text-gray-600">Each candle is hand-poured with premium soy wax and natural fragrances in our Maryland studio.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-4">💚</div>
              <h3 className="font-semibold text-gray-900 mb-2">Natural Ingredients</h3>
              <p className="text-sm text-gray-600">We use only natural, eco-friendly ingredients that are safe for you and your family.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="font-semibold text-gray-900 mb-2">Satisfaction Guaranteed</h3>
              <p className="text-sm text-gray-600">Not completely satisfied? We offer a 30-day money-back guarantee, no questions asked.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
