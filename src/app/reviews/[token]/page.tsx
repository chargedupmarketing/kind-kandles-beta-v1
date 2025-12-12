'use client';

import { useState, useEffect, use } from 'react';
import { Star, CheckCircle, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  images?: { url: string }[];
}

interface TokenData {
  customer_name: string;
  customer_email: string;
  product_ids: string[];
  expires_at: string;
  used_at: string | null;
}

interface ReviewData {
  product_id: string;
  rating: number;
  title: string;
  content: string;
}

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({});

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/reviews/validate?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired link');
        setLoading(false);
        return;
      }

      setTokenData(data.tokenData);
      setProducts(data.products || []);
      
      // Initialize reviews state
      const initialReviews: Record<string, ReviewData> = {};
      data.products?.forEach((product: Product) => {
        initialReviews[product.id] = {
          product_id: product.id,
          rating: 0,
          title: '',
          content: '',
        };
      });
      setReviews(initialReviews);
      setLoading(false);
    } catch (err) {
      setError('Failed to validate review link');
      setLoading(false);
    }
  };

  const handleRatingChange = (productId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating },
    }));
  };

  const handleInputChange = (productId: string, field: 'title' | 'content', value: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    // Validate all reviews have ratings
    const reviewsToSubmit = Object.values(reviews).filter(r => r.rating > 0);
    
    if (reviewsToSubmit.length === 0) {
      setError('Please rate at least one product');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          reviews: reviewsToSubmit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit reviews');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Failed to submit reviews');
      setSubmitting(false);
    }
  };

  const renderStars = (productId: string, currentRating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(productId, star)}
            className="p-1 transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`h-8 w-8 ${
                star <= currentRating
                  ? 'text-amber-400 fill-current'
                  : 'text-gray-300 hover:text-amber-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your review...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your review has been submitted successfully. It will be published after approval.
          </p>
          <Link
            href="/collections/all"
            className="inline-block bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-3 rounded-full font-semibold hover:from-amber-600 hover:to-amber-700 transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logos/logo.png"
              alt="My Kind Kandles"
              width={120}
              height={120}
              className="mx-auto"
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Experience</h1>
          <p className="text-gray-600">
            Hi {tokenData?.customer_name || 'there'}! We&apos;d love to hear about your recent purchase.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Products to Review */}
        <div className="space-y-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {product.images?.[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{product.title}</h3>
                  <p className="text-sm text-gray-500">How would you rate this product?</p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating <span className="text-red-500">*</span>
                </label>
                {renderStars(product.id, reviews[product.id]?.rating || 0)}
                {reviews[product.id]?.rating > 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviews[product.id].rating]}
                  </p>
                )}
              </div>

              {/* Review Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  value={reviews[product.id]?.title || ''}
                  onChange={(e) => handleInputChange(product.id, 'title', e.target.value)}
                  placeholder="Summarize your experience..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  maxLength={100}
                />
              </div>

              {/* Review Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review (optional)
                </label>
                <textarea
                  value={reviews[product.id]?.content || ''}
                  onChange={(e) => handleInputChange(product.id, 'content', e.target.value)}
                  placeholder="Tell us what you loved about this product..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {reviews[product.id]?.content?.length || 0}/1000
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.values(reviews).every(r => r.rating === 0)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Your review will be published after approval.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Thank you for shopping with My Kind Kandles & Boutique</p>
        </div>
      </div>
    </div>
  );
}

