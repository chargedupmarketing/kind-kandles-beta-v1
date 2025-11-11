'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Package, TrendingUp, Users } from 'lucide-react';

interface InventoryAlertProps {
  stockLevel: number;
  productName?: string;
  variant?: 'default' | 'minimal' | 'detailed';
  showTrending?: boolean;
}

export default function InventoryAlert({ 
  stockLevel, 
  productName = "this item",
  variant = 'default',
  showTrending = true 
}: InventoryAlertProps) {
  const [recentlyViewed, setRecentlyViewed] = useState(0);
  const [inCarts, setInCarts] = useState(0);

  useEffect(() => {
    // Simulate dynamic viewing/cart data
    const updateStats = () => {
      setRecentlyViewed(Math.floor(Math.random() * 20) + 5);
      setInCarts(Math.floor(Math.random() * 8) + 2);
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getUrgencyLevel = () => {
    if (stockLevel <= 2) return 'critical';
    if (stockLevel <= 5) return 'high';
    if (stockLevel <= 10) return 'medium';
    return 'low';
  };

  const urgencyLevel = getUrgencyLevel();

  const getUrgencyStyles = () => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          container: 'bg-red-100 border-red-300 text-red-800',
          icon: 'text-red-600',
          pulse: 'animate-pulse'
        };
      case 'high':
        return {
          container: 'bg-orange-100 border-orange-300 text-orange-800',
          icon: 'text-orange-600',
          pulse: 'animate-pulse'
        };
      case 'medium':
        return {
          container: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          icon: 'text-yellow-600',
          pulse: ''
        };
      default:
        return {
          container: 'bg-green-100 border-green-300 text-green-800',
          icon: 'text-green-600',
          pulse: ''
        };
    }
  };

  const styles = getUrgencyStyles();

  const getUrgencyMessage = () => {
    switch (urgencyLevel) {
      case 'critical':
        return `🔥 ALMOST GONE! Only ${stockLevel} left - Order now!`;
      case 'high':
        return `⚡ LOW STOCK! Only ${stockLevel} remaining`;
      case 'medium':
        return `📦 Limited quantity: ${stockLevel} left in stock`;
      default:
        return `✅ In stock (${stockLevel} available)`;
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${styles.container} ${styles.pulse}`}>
        <Package className={`h-4 w-4 ${styles.icon}`} />
        <span>{stockLevel} left</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`border rounded-lg p-4 ${styles.container}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-5 w-5 ${styles.icon} ${styles.pulse} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <div className="font-semibold mb-2">{getUrgencyMessage()}</div>
            
            {showTrending && urgencyLevel !== 'low' && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{recentlyViewed} people viewed {productName} in the last hour</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{inCarts} people have {productName} in their cart right now</span>
                </div>
              </div>
            )}
            
            {urgencyLevel === 'critical' && (
              <div className="mt-3 p-2 bg-white/50 rounded border border-current">
                <div className="text-xs font-medium">
                  ⏰ This item is selling fast! Secure yours before it's gone.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${styles.container} ${styles.pulse}`}>
      <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
      <span className="font-medium">{getUrgencyMessage()}</span>
    </div>
  );
}
