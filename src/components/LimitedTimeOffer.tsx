'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Gift, Percent } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { useBanner } from '../contexts/BannerContext';

interface LimitedTimeOfferProps {
  title: string;
  description: string;
  discount: number;
  endTime: Date;
  minOrderAmount?: number;
  isDismissible?: boolean;
  variant?: 'banner' | 'popup' | 'inline';
  onDismiss?: () => void;
}

export default function LimitedTimeOffer({
  title,
  description,
  discount,
  endTime,
  minOrderAmount,
  isDismissible = true,
  variant = 'banner',
  onDismiss
}: LimitedTimeOfferProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const { setBannerVisible } = useBanner();

  useEffect(() => {
    const checkExpiry = () => {
      if (new Date() >= endTime) {
        setIsExpired(true);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const handleDismiss = () => {
    setIsVisible(false);
    setBannerVisible(false);
    if (onDismiss) onDismiss();
  };

  const handleExpire = () => {
    setIsExpired(true);
    setTimeout(() => {
      setIsVisible(false);
      setBannerVisible(false);
    }, 3000); // Auto-hide after 3 seconds
  };

  if (!isVisible || isExpired) {
    return null;
  }

  if (variant === 'popup') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
          {isDismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mb-6">
              <Gift className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="serif-font text-2xl font-bold text-gray-900 mb-3">{title}</h2>
            <p className="text-gray-600 mb-6">{description}</p>
            
            <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Percent className="h-6 w-6" />
                <span className="text-3xl font-bold">{discount}% OFF</span>
              </div>
              {minOrderAmount && (
                <p className="text-sm opacity-90">
                  On orders over ${minOrderAmount}
                </p>
              )}
            </div>
            
            <CountdownTimer 
              endTime={endTime} 
              title="Offer ends in:"
              variant="compact"
              onExpire={handleExpire}
            />
            
            <button className="w-full btn-candle mt-6">
              🛍️ Shop Now & Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="serif-font text-xl font-bold mb-2">{title}</h3>
              <p className="text-white/90 mb-4">{description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{discount}% OFF</span>
                  {minOrderAmount && (
                    <span className="text-sm opacity-80">orders ${minOrderAmount}+</span>
                  )}
                </div>
                <CountdownTimer 
                  endTime={endTime} 
                  variant="compact"
                  onExpire={handleExpire}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-2 px-4 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <div className="flex items-center gap-2 text-sm sm:text-base text-center">
            <span className="font-bold">{title}</span>
            <span>•</span>
            <span>{description}</span>
          </div>
          <CountdownTimer 
            endTime={endTime} 
            variant="compact"
            onExpire={handleExpire}
          />
        </div>
        
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors p-1 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
