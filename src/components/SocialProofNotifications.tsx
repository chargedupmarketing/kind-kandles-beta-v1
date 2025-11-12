'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Heart, MapPin } from 'lucide-react';

interface SocialProofNotification {
  id: string;
  type: 'purchase' | 'view' | 'wishlist' | 'review';
  message: string;
  location?: string;
  timeAgo: string;
  productName?: string;
}

interface SocialProofNotificationsProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  autoHide?: boolean;
  hideDelay?: number;
}

export default function SocialProofNotifications({
  position = 'bottom-left',
  autoHide = true,
  hideDelay = 10000 // 10 seconds
}: SocialProofNotificationsProps) {
  const [notifications, setNotifications] = useState<SocialProofNotification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<SocialProofNotification | null>(null);

  // Mock notifications data
  const mockNotifications: SocialProofNotification[] = [
    {
      id: '1',
      type: 'purchase',
      message: 'Sarah from Baltimore just purchased',
      location: 'Baltimore, MD',
      timeAgo: '2 minutes ago',
      productName: 'Calm Down Girl Candle'
    },
    {
      id: '2',
      type: 'view',
      message: 'Someone from Annapolis is viewing',
      location: 'Annapolis, MD',
      timeAgo: '1 minute ago',
      productName: 'Lavender Dreams Candle'
    },
    {
      id: '3',
      type: 'purchase',
      message: 'Jennifer from Rockville just bought',
      location: 'Rockville, MD',
      timeAgo: '5 minutes ago',
      productName: 'Vanilla Spice Candle'
    },
    {
      id: '4',
      type: 'wishlist',
      message: 'Michelle from Silver Spring added to wishlist',
      location: 'Silver Spring, MD',
      timeAgo: '3 minutes ago',
      productName: 'Ocean Breeze Candle'
    },
    {
      id: '5',
      type: 'review',
      message: 'Amanda from Frederick left a 5-star review for',
      location: 'Frederick, MD',
      timeAgo: '8 minutes ago',
      productName: 'Forest Walk Candle'
    }
  ];

  useEffect(() => {
    let notificationIndex = 0;
    let timeoutId: NodeJS.Timeout;
    
    const showNextNotification = () => {
      if (mockNotifications.length > 0) {
        setCurrentNotification(mockNotifications[notificationIndex]);
        notificationIndex = (notificationIndex + 1) % mockNotifications.length;
        
        // Schedule next notification after 1 minute + 10 seconds (display time)
        timeoutId = setTimeout(() => {
          showNextNotification();
        }, 70000); // 70 seconds total (10s visible + 60s wait)
      }
    };

    // Show first notification immediately
    showNextNotification();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (currentNotification && autoHide) {
      const timer = setTimeout(() => {
        setCurrentNotification(null);
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [currentNotification, autoHide, hideDelay]);

  if (!currentNotification) return null;

  const getIcon = () => {
    switch (currentNotification.type) {
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-green-600" />;
      case 'view':
        return <Eye className="h-4 w-4 text-blue-600" />;
      case 'wishlist':
        return <Heart className="h-4 w-4 text-pink-600" />;
      case 'review':
        return <span className="text-amber-500">⭐</span>;
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      default:
        return 'bottom-6 left-6';
    }
  };

  const getBorderColor = () => {
    switch (currentNotification.type) {
      case 'purchase':
        return 'border-l-green-500';
      case 'view':
        return 'border-l-blue-500';
      case 'wishlist':
        return 'border-l-pink-500';
      case 'review':
        return 'border-l-amber-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-40 max-w-sm animate-in slide-in-from-left-5 fade-in duration-500`}>
      <div className={`bg-white border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 border border-gray-200`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {currentNotification.message}
                </p>
                {currentNotification.productName && (
                  <p className="text-sm font-semibold text-amber-600 mt-1">
                    {currentNotification.productName}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => setCurrentNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              {currentNotification.location && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span>{currentNotification.location}</span>
                  <span>•</span>
                </>
              )}
              <span>{currentNotification.timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
