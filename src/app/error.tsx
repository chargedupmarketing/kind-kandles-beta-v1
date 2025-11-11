'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          Something went wrong!
        </h1>
        <p className="text-gray-600 dark:text-slate-300 mb-6">
          We encountered an unexpected error while loading this page. Don't worry, our team has been notified.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">Error Details:</h3>
            <p className="text-sm text-red-600 dark:text-red-400 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          
          <div className="flex space-x-3">
            <a
              href="/"
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </a>
            
            <a
              href="/"
              className="flex-1 flex items-center justify-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </a>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
            Still having trouble?
          </p>
          <a
            href="/about/contact"
            className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium text-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
