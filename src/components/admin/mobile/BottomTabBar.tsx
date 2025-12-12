'use client';

import { BarChart3, ShoppingCart, Package, MoreHorizontal } from 'lucide-react';
import { hapticLight } from '@/lib/haptics';
import type { MobileTab } from './MobileAppShell';

interface BottomTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  pendingOrderCount?: number;
}

interface TabConfig {
  id: MobileTab;
  label: string;
  icon: typeof BarChart3;
  activeColor: string;
  badge?: number;
}

export default function BottomTabBar({ 
  activeTab, 
  onTabChange, 
  pendingOrderCount = 0 
}: BottomTabBarProps) {
  const tabs: TabConfig[] = [
    {
      id: 'home',
      label: 'Home',
      icon: BarChart3,
      activeColor: 'text-teal-400',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      activeColor: 'text-blue-400',
      badge: pendingOrderCount,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      activeColor: 'text-purple-400',
    },
    {
      id: 'more',
      label: 'More',
      icon: MoreHorizontal,
      activeColor: 'text-slate-300',
    },
  ];

  const handleTabPress = (tab: MobileTab) => {
    hapticLight();
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full ${
                  tab.id === 'home' ? 'bg-teal-400' :
                  tab.id === 'orders' ? 'bg-blue-400' :
                  tab.id === 'products' ? 'bg-purple-400' :
                  'bg-slate-400'
                }`} />
              )}

              {/* Icon Container */}
              <div className="relative">
                <Icon 
                  className={`h-6 w-6 transition-colors duration-200 ${
                    isActive ? tab.activeColor : 'text-slate-500'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Badge */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                isActive ? tab.activeColor : 'text-slate-500'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

