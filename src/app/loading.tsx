import { Loader } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-8">
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-500 to-teal-500 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-2xl">🕯️</span>
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-pink-200 dark:border-pink-800 rounded-full animate-spin border-t-transparent"></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Loading...
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          Preparing your Kind Kandles experience
        </p>

        {/* Loading Bar */}
        <div className="mt-6 w-64 mx-auto">
          <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-pink-500 to-teal-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Spinning Icon */}
        <div className="mt-6">
          <Loader className="h-6 w-6 text-pink-500 animate-spin mx-auto" />
        </div>
      </div>
    </div>
  );
}
