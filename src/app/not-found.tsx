import Link from 'next/link';
import { Search, Home, ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-9xl font-bold text-gray-200 dark:text-slate-700 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg">
                <Compass className="h-12 w-12 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-300 mb-8">
          Oops! The page you're looking for seems to have wandered off. 
          Let's help you find your way back to our wonderful collection of candles and boutique items.
        </p>

        {/* Suggestions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-8 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Where would you like to go?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/collections/candles"
              className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors group"
            >
              <span className="text-2xl">🕯️</span>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                  Candles
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  Handcrafted scents
                </div>
              </div>
            </Link>

            <Link
              href="/collections/skincare"
              className="flex items-center space-x-3 p-3 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-lg transition-colors group"
            >
              <span className="text-2xl">✨</span>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-slate-100 group-hover:text-pink-700 dark:group-hover:text-pink-300">
                  Skincare
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  Natural beauty
                </div>
              </div>
            </Link>

            <Link
              href="/customs"
              className="flex items-center space-x-3 p-3 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg transition-colors group"
            >
              <span className="text-2xl">🎨</span>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                  Custom Orders
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  Made just for you
                </div>
              </div>
            </Link>

            <Link
              href="/about"
              className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group"
            >
              <span className="text-2xl">💝</span>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  About Us
                </div>
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  Our story
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Go Home</span>
            </Link>
            
            <Link
              href="/"
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Go Back</span>
            </Link>
          </div>

          {/* Search Suggestion */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-600">
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
              Looking for something specific?
            </p>
            <Link
              href="/collections/all"
              className="inline-flex items-center space-x-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium"
            >
              <Search className="h-4 w-4" />
              <span>Browse All Collections</span>
            </Link>
          </div>
        </div>

        {/* Kindness Message */}
        <div className="mt-8 p-4 bg-gradient-to-r from-pink-100 to-teal-100 dark:from-pink-900/30 dark:to-teal-900/30 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-slate-300 italic">
            "Do all things with kindness" - even when pages go missing! 💕
          </p>
        </div>
      </div>
    </div>
  );
}
