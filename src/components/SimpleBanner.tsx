'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SimpleBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function SimpleBanner({ onVisibilityChange }: SimpleBannerProps) {
  const [isVisible, setIsVisible] = useState(false); // Start as false, will be set by useEffect
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before accessing localStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Check if banner was dismissed and when
    const bannerDismissed = localStorage.getItem('preBFBannerDismissed');
    
    if (bannerDismissed) {
      const dismissedTime = parseInt(bannerDismissed);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      // If less than 24 hours have passed, keep banner hidden
      if (now - dismissedTime < twentyFourHours) {
        setIsVisible(false);
        onVisibilityChange?.(false);
        return;
      } else {
        // More than 24 hours have passed, remove the localStorage entry
        localStorage.removeItem('preBFBannerDismissed');
      }
    }
    
    // Show banner if not dismissed or if 24 hours have passed
    setIsVisible(true);
    onVisibilityChange?.(true);
  }, [isMounted, onVisibilityChange]);

  const handleClose = () => {
    // Store the current timestamp when banner is dismissed
    localStorage.setItem('preBFBannerDismissed', Date.now().toString());
    setIsVisible(false);
    onVisibilityChange?.(false);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-teal-600 via-teal-500 to-teal-400 text-white h-auto sm:h-8">
      <div className="max-w-7xl mx-auto flex items-center justify-center relative h-full px-8 sm:px-4 py-1 sm:py-0">
        {/* Mobile: Stacked layout, Desktop: Single line */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-center">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">🔥</span>
            <span className="font-bold whitespace-nowrap">PRE-BLACK FRIDAY SALE</span>
            <span className="animate-pulse">🔥</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="text-xs sm:text-sm">Save 25% on everything</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-xs sm:text-sm">FREE shipping on orders $50+</span>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition-colors"
          aria-label="Close banner"
        >
          <X className="h-4 w-4 sm:h-3 sm:w-3" />
        </button>
      </div>
    </div>
  );
}
