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
      activeColor: 'text-teal-400',
      activeBg: 'bg-teal-500/20',
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      activeColor: 'text-blue-400',
      activeBg: 'bg-blue-500/20',
      badge: pendingOrderCount,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      activeColor: 'text-purple-400',
      activeBg: 'bg-purple-500/20',
    },
    {
      id: 'more',
      label: 'More',
      icon: MoreHorizontal,
      activeColor: 'text-slate-300',
      activeBg: 'bg-slate-500/20',
    },
  ];

  const handleTabPress = (tab: MobileTab) => {
    hapticLight();
    onTabChange(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-50 safe-area-bottom">
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
                    isActive ? tab.activeColor : 'text-slate-500'
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

