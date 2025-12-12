'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2, Minus, Plus, Star, Shield, Truck, Heart, Clock, Users, ShoppingCart, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/localStore';
import type { Product } from '@/lib/types';
import InventoryAlert from './InventoryAlert';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  title?: string;
  content?: string;
  verified_purchase: boolean;
  created_at: string;
  admin_response?: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ProductPageProps {
  product: Product;
}

export default function ProductPage({ product }: ProductPageProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [showReviews, setShowReviews] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Real reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  // Fetch reviews when showReviews is toggled on
  useEffect(() => {
    if (showReviews && !reviewsLoaded) {
      fetchReviews();
    }
  }, [showReviews]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await fetch(`/api/reviews/${product.id}?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setReviewStats(data.stats || null);
        setReviewsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Format date for display
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Breadcrumb */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
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
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {renderStars(reviewStats?.averageRating || 0)}
                    <span className="text-sm font-medium text-gray-700 ml-1">
                      {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : 'No ratings yet'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowReviews(!showReviews)}
                    className="text-sm text-amber-600 hover:text-amber-700 underline font-medium"
                  >
                    {reviewStats?.totalReviews ? `(${reviewStats.totalReviews} reviews)` : 'Be the first to review'}
                  </button>
                </div>
                
              {/* Candle-Specific Info */}
              {product.isCandle && (product.burnTime || product.scentProfile) && (
                <div className="flex flex-wrap gap-4 mb-4">
                  {product.burnTime && product.burnTime !== 'undefined' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>{product.burnTime} burn time</span>
                    </div>
                  )}
                  {product.scentProfile && product.scentProfile !== 'undefined' && (
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
                  onClick={() => {
                    const selectedVariant = product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0];
                    addItem({
                      variantId: selectedVariantId || product.id,
                      productId: product.id,
                      title: product.name,
                      variantTitle: selectedVariant?.title || 'Default',
                      price: typeof product.price === 'string' ? parseFloat(product.price.replace('$', '')) : product.price,
                      quantity: quantity,
                      image: product.image,
                      handle: product.handle,
                    });
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 2000);
                  }}
                  disabled={!product.inStock || (product.stockLevel ?? 0) === 0}
                  className={`w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                    product.inStock && (product.stockLevel ?? 0) > 0
                      ? 'btn-candle hover:scale-105 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.inStock && (product.stockLevel ?? 0) > 0 ? (
                    <span className="flex items-center justify-center gap-2">
                      {addedToCart ? (
                        <>✓ Added to Cart!</>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5" />
                          Add to Cart - {formatPrice(product.price)}
                        </>
                      )}
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
                <div 
                  className="text-gray-600 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none
                    prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                    prose-h2:text-base prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2
                    prose-p:my-2 prose-p:text-gray-600 dark:prose-p:text-gray-300
                    prose-strong:text-gray-800 dark:prose-strong:text-gray-200
                    prose-ul:my-2 prose-li:my-0.5
                    [&_.fragrance-notes]:bg-amber-50 [&_.fragrance-notes]:dark:bg-amber-900/20 [&_.fragrance-notes]:rounded-lg [&_.fragrance-notes]:p-4 [&_.fragrance-notes]:my-4
                    [&_.detail-row]:py-1 [&_.detail-row]:border-b [&_.detail-row]:border-amber-200 [&_.detail-row]:dark:border-amber-800 [&_.detail-row]:last:border-b-0
                    [&_.detail-row-name]:text-sm [&_.detail-row-name]:text-gray-700 [&_.detail-row-name]:dark:text-gray-300
                    [&_.headline]:text-base [&_.headline]:font-semibold [&_.headline]:text-gray-900 [&_.headline]:dark:text-white [&_.headline]:mt-4 [&_.headline]:mb-2
                    [&_br]:hidden"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
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
                {reviewStats && reviewStats.totalReviews > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(reviewStats.averageRating)}
                    </div>
                    <span className="text-sm text-gray-600">{reviewStats.averageRating.toFixed(1)} out of 5</span>
                  </div>
                )}
              </div>
              
              {/* Rating Distribution */}
              {reviewStats && reviewStats.totalReviews > 0 && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-center mb-4">
                        <div className="text-4xl font-bold text-gray-900">{reviewStats.averageRating.toFixed(1)}</div>
                        <div className="flex justify-center gap-1 my-2">
                          {renderStars(reviewStats.averageRating)}
                        </div>
                        <div className="text-sm text-gray-600">Based on {reviewStats.totalReviews} reviews</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewStats.distribution[star as keyof typeof reviewStats.distribution];
                        const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-6">{star}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-amber-400 h-full rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading State */}
              {loadingReviews && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                  <span className="ml-2 text-gray-600">Loading reviews...</span>
                </div>
              )}
              
              {/* No Reviews State */}
              {!loadingReviews && reviews.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📝</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h4>
                  <p className="text-gray-600 mb-4">
                    Be the first to share your experience with this product!
                  </p>
                  <p className="text-sm text-gray-500">
                    Reviews can only be submitted by verified purchasers after delivery.
                  </p>
                </div>
              )}
              
              {/* Reviews List */}
              {!loadingReviews && reviews.length > 0 && (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {review.customer_name || 'Anonymous'}
                            </span>
                            {review.verified_purchase && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                ✓ Verified Purchase
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-500">{formatReviewDate(review.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      {review.title && (
                        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                      )}
                      {review.content && (
                        <p className="text-gray-700 leading-relaxed">{review.content}</p>
                      )}
                      {review.admin_response && (
                        <div className="mt-4 bg-amber-50 rounded-lg p-4 border-l-4 border-amber-400">
                          <p className="text-sm font-medium text-amber-800 mb-1">Response from My Kind Kandles:</p>
                          <p className="text-sm text-amber-700">{review.admin_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Info about review eligibility */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>How to leave a review:</strong> After your order is delivered, you&apos;ll receive an email 
                  with a link to submit your review. Only verified purchasers can leave reviews.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Trust & Guarantee Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
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
