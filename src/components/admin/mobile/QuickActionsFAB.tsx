'use client';

import { useState } from 'react';
import { Plus, X, Package, Truck, ShoppingCart } from 'lucide-react';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import type { AdminSection } from './MobileAppShell';

interface QuickActionsFABProps {
  onAction: (section: AdminSection) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Plus;
  color: string;
  bgColor: string;
  section: AdminSection;
}

export default function QuickActionsFAB({ onAction }: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions: QuickAction[] = [
    {
      id: 'add-product',
      label: 'Product',
      icon: Package,
      color: 'text-white',
      bgColor: 'bg-purple-600',
      section: 'products',
    },
    {
      id: 'quick-ship',
      label: 'Ship',
      icon: Truck,
      color: 'text-white',
      bgColor: 'bg-blue-600',
      section: 'fulfillment',
    },
    {
      id: 'view-orders',
      label: 'Orders',
      icon: ShoppingCart,
      color: 'text-white',
      bgColor: 'bg-green-600',
      section: 'orders',
    },
  ];

  const handleToggle = () => {
    hapticLight();
    setIsOpen(!isOpen);
  };

  const handleAction = (action: QuickAction) => {
    hapticMedium();
    setIsOpen(false);
    onAction(action.section);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed right-3 bottom-[72px] z-50 flex flex-col-reverse items-end space-y-reverse space-y-2">
        {/* Action Buttons */}
        {isOpen && actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className="flex items-center space-x-2 animate-fade-in-up"
              style={{ 
                animationDelay: `${index * 40}ms`,
                animationFillMode: 'backwards'
              }}
            >
              <span className="px-2.5 py-1 bg-white text-gray-700 text-xs font-medium rounded-lg shadow-lg border border-gray-100">
                {action.label}
              </span>
              <div className={`p-2.5 rounded-full shadow-lg ${action.bgColor}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </button>
          );
        })}

        {/* Main FAB */}
        <button
          onClick={handleToggle}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
            isOpen 
              ? 'bg-gray-600 rotate-45' 
              : 'bg-teal-600 active:bg-teal-700'
          }`}
        >
          <Plus className="h-5 w-5 text-white" />
        </button>
      </div>
    </>
  );
}
