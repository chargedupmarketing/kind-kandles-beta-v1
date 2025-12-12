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
  activeBg: string;
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
      activeColor: 'text-teal-600',
      activeBg: 'bg-teal-50',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      activeColor: 'text-blue-600',
      activeBg: 'bg-blue-50',
      badge: pendingOrderCount,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      activeColor: 'text-purple-600',
      activeBg: 'bg-purple-50',
    },
    {
      id: 'more',
      label: 'More',
      icon: MoreHorizontal,
      activeColor: 'text-gray-700',
      activeBg: 'bg-gray-100',
    },
  ];

  const handleTabPress = (tab: MobileTab) => {
    hapticLight();
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabPress(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all active:scale-95 ${
                isActive ? tab.activeBg : ''
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon Container */}
              <div className="relative">
                <Icon 
                  className={`h-5 w-5 transition-colors ${
                    isActive ? tab.activeColor : 'text-gray-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Badge */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-0.5 font-medium transition-colors ${
                isActive ? tab.activeColor : 'text-gray-400'
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
