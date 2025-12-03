'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { clearCart, shippingAddress } = useCart();

  useEffect(() => {
    // Clear the cart after successful purchase
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Thank You Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Thank You for Your Order!
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your order has been placed successfully. We're preparing your items with kindness!
        </p>

        {/* Order Number */}
        {orderNumber && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{orderNumber}</p>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 text-left">
          <h2 className="font-bold text-lg mb-4">What's Next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                <Mail className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <p className="font-medium">Confirmation Email</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You'll receive an order confirmation email shortly
                  {shippingAddress?.email && ` at ${shippingAddress.email}`}.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <p className="font-medium">Shipping Updates</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We'll send you tracking information once your order ships.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/collections/all"
            className="inline-flex items-center justify-center gap-2 w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="h-5 w-5" />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Return to Home
          </Link>
        </div>

        {/* Contact Info */}
        <p className="mt-8 text-sm text-gray-500">
          Questions about your order?{' '}
          <Link href="/about/contact" className="text-pink-600 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

