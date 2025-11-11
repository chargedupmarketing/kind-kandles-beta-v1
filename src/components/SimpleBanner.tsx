'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SimpleBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function SimpleBanner({ onVisibilityChange }: SimpleBannerProps) {
  const [isVisible, setIsVisible] = useState(false); // Start as false, will be set by useEffect

  useEffect(() => {
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
  }, [onVisibilityChange]);

  const handleClose = () => {
    // Store the current timestamp when banner is dismissed
    localStorage.setItem('preBFBannerDismissed', Date.now().toString());
    setIsVisible(false);
    onVisibilityChange?.(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-pink-600 via-pink-400 to-white text-gray-900 h-8">
      <div className="max-w-7xl mx-auto flex items-center justify-center relative h-full px-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="animate-pulse">🔥</span>
          <span className="font-bold">PRE-BLACK FRIDAY SALE</span>
          <span>•</span>
          <span>Save 25% on everything + FREE shipping on orders $50+</span>
          <span className="animate-pulse">🔥</span>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Close banner"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
