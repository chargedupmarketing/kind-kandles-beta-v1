'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TopBarBannerSettings {
  enabled: boolean;
  title: string;
  emoji_left: string;
  emoji_right: string;
  highlight_text: string;
  secondary_text: string;
  tertiary_text: string;
  background_gradient_from: string;
  background_gradient_via: string;
  background_gradient_to: string;
  text_color: string;
  dismissible: boolean;
  dismiss_duration_hours: number;
}

interface SimpleBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

const DEFAULT_SETTINGS: TopBarBannerSettings = {
  enabled: false, // DISABLED BY DEFAULT - prevents flash on load
  title: 'HOLIDAY SALE',
  emoji_left: '🎄',
  emoji_right: '🎁',
  highlight_text: 'Save 25% on everything',
  secondary_text: 'FREE shipping on orders $50+',
  tertiary_text: '',
  background_gradient_from: '#0d9488',
  background_gradient_via: '#14b8a6',
  background_gradient_to: '#2dd4bf',
  text_color: '#ffffff',
  dismissible: true,
  dismiss_duration_hours: 24
};

export default function SimpleBanner({ onVisibilityChange }: SimpleBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<TopBarBannerSettings>(DEFAULT_SETTINGS);

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/promotions', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.value?.top_bar_banner) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.value.top_bar_banner });
          }
        }
      } catch (error) {
        console.error('Error fetching banner settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  // Ensure component is mounted before accessing localStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // If banner is disabled in settings, don't show it
    if (!settings.enabled) {
      setIsVisible(false);
      onVisibilityChange?.(false);
      return;
    }
    
    // Check if banner was dismissed and when
    const bannerDismissed = localStorage.getItem('preBFBannerDismissed');
    
    if (bannerDismissed && settings.dismissible) {
      const dismissedTime = parseInt(bannerDismissed);
      const now = Date.now();
      const dismissDuration = settings.dismiss_duration_hours * 60 * 60 * 1000;
      
      // If less than dismiss duration has passed, keep banner hidden
      if (now - dismissedTime < dismissDuration) {
        setIsVisible(false);
        onVisibilityChange?.(false);
        return;
      } else {
        // More than dismiss duration has passed, remove the localStorage entry
        localStorage.removeItem('preBFBannerDismissed');
      }
    }
    
    // Show banner if not dismissed or if dismiss duration has passed
    setIsVisible(true);
    onVisibilityChange?.(true);
  }, [isMounted, settings, onVisibilityChange]);

  const handleClose = () => {
    // Store the current timestamp when banner is dismissed
    localStorage.setItem('preBFBannerDismissed', Date.now().toString());
    setIsVisible(false);
    onVisibilityChange?.(false);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted || !isVisible || !settings.enabled) {
    return null;
  }

  const gradientStyle = {
    background: `linear-gradient(to right, ${settings.background_gradient_from}, ${settings.background_gradient_via}, ${settings.background_gradient_to})`,
    color: settings.text_color
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 h-auto sm:h-8"
      style={gradientStyle}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center relative h-full px-8 sm:px-4 py-1 sm:py-0">
        {/* Mobile: Stacked layout, Desktop: Single line */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-center">
          <div className="flex items-center gap-2">
            {settings.emoji_left && (
              <span className="animate-pulse">{settings.emoji_left}</span>
            )}
            <span className="font-bold whitespace-nowrap">{settings.title}</span>
            {settings.emoji_right && (
              <span className="animate-pulse">{settings.emoji_right}</span>
            )}
          </div>
          {settings.highlight_text && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm">{settings.highlight_text}</span>
            </>
          )}
          {settings.secondary_text && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm">{settings.secondary_text}</span>
            </>
          )}
          {settings.tertiary_text && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs sm:text-sm">{settings.tertiary_text}</span>
            </>
          )}
        </div>
        
        {/* Close button */}
        {settings.dismissible && (
          <button
            onClick={handleClose}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
            style={{ color: settings.text_color }}
            aria-label="Close banner"
          >
            <X className="h-4 w-4 sm:h-3 sm:w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
