'use client';

import { useState } from 'react';
import { Plus, X, Package, Truck, ShoppingCart, QrCode } from 'lucide-react';
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
      label: 'Add Product',
      icon: Package,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      section: 'products',
    },
    {
      id: 'quick-ship',
      label: 'Quick Ship',
      icon: Truck,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      section: 'fulfillment',
    },
    {
      id: 'view-orders',
      label: 'View Orders',
      icon: ShoppingCart,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed right-4 bottom-20 z-50 flex flex-col-reverse items-end space-y-reverse space-y-3">
        {/* Action Buttons */}
        {isOpen && actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className="flex items-center space-x-3 animate-fade-in-up"
              style={{ 
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'backwards'
              }}
            >
              {/* Label */}
              <span className="px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap">
                {action.label}
              </span>
              {/* Icon Button */}
              <div className={`p-3 rounded-full shadow-lg ${action.bgColor} border border-slate-700`}>
                <Icon className={`h-5 w-5 ${action.color}`} />
              </div>
            </button>
          );
        })}

        {/* Main FAB */}
        <button
          onClick={handleToggle}
          className={`p-4 rounded-full shadow-lg transition-all duration-300 ${
            isOpen 
              ? 'bg-slate-700 rotate-45' 
              : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
    </>
  );
}

