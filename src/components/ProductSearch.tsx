'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface ProductSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductSearch({ isOpen, onClose }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl z-50 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-4 text-gray-500 dark:text-gray-400">
            Search functionality coming soon...
          </div>
        )}
      </div>
    </>
  );
}

