'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Cancelled
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your payment was cancelled. Don't worry - your cart items are still saved.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center gap-2 w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            Return to Checkout
          </Link>

          <Link
            href="/collections/all"
            className="inline-flex items-center justify-center gap-2 w-full py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Continue Shopping
          </Link>
        </div>

        {/* Help */}
        <p className="mt-8 text-sm text-gray-500">
          Need help?{' '}
          <Link href="/about/contact" className="text-pink-600 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}

