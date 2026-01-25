'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import BottomTabBar from './BottomTabBar';
import MobileDashboard from './MobileDashboard';
import MobileOrders from './MobileOrders';
import MobileProducts from './MobileProducts';
import MobileShippingGuide from './MobileShippingGuide';
import MoreMenu from './MoreMenu';
import { Shield, AlertTriangle, LogOut, Bell, User } from 'lucide-react';

export type MobileTab = 'home' | 'orders' | 'products' | 'more';
export type AdminSection = 'dashboard' | 'products' | 'cleanup-names' | 'cleanup-default-titles' | 'orders' | 'fulfillment' | 'shipping' | 'shipping-guide' | 'customers' | 'discounts' | 'promotions' | 'featured' | 'blog' | 'menu' | 'email-templates' | 'files' | 'contacts' | 'stories' | 'survey' | 'settings' | 'users' | 'admin-settings' | 'ai-assistant' | 'reviews' | 'events' | 'event-editor' | 'event-bookings';

interface MobileAppShellProps {
  children?: ReactNode;
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  renderDesktopContent: () => ReactNode;
}

export default function MobileAppShell({ 
  activeSection, 
  onSectionChange,
  renderDesktopContent 
}: MobileAppShellProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout, isMaintenanceMode, user } = useAdmin();

  // Map sections to tabs
  useEffect(() => {
    if (activeSection === 'dashboard') setActiveTab('home');
    else if (activeSection === 'orders' || activeSection === 'fulfillment') setActiveTab('orders');
    else if (activeSection === 'products') setActiveTab('products');
    else setActiveTab('more');
  }, [activeSection]);

  // Fetch pending order count
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const response = await fetch('/api/orders?status=pending&limit=1', {
          headers: { 'Authorization': 'Bearer admin-token' }
        });
        const data = await response.json();
        setPendingOrderCount(data.total || 0);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

    fetchPendingOrders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    // Map tab to section
    switch (tab) {
      case 'home':
        onSectionChange('dashboard');
        break;
      case 'orders':
        onSectionChange('orders');
        break;
      case 'products':
        onSectionChange('products');
        break;
      case 'more':
        // Don't change section, just show the menu
        break;
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const renderContent = () => {
    // Handle special sections that need custom mobile views
    if (activeSection === 'shipping-guide') {
      return (
        <MobileShippingGuide 
          onBack={() => onSectionChange('dashboard')}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <MobileDashboard 
            onNavigate={onSectionChange}
            pendingOrderCount={pendingOrderCount}
          />
        );
      case 'orders':
        return (
          <MobileOrders 
            onNavigate={onSectionChange}
          />
        );
      case 'products':
        return (
          <MobileProducts 
            onNavigate={onSectionChange}
          />
        );
      case 'more':
        return (
          <MoreMenu 
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            renderContent={renderDesktopContent}
          />
        );
      default:
        return (
          <MobileDashboard 
            onNavigate={onSectionChange}
            pendingOrderCount={pendingOrderCount}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header - Light Theme */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-area-top shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-none">Kind Kandles</h1>
                <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              {/* Maintenance Mode Badge */}
              {isMaintenanceMode && (
                <div className="flex items-center space-x-1 bg-red-100 text-red-600 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">MAINT</span>
                </div>
              )}

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="h-6 w-6 text-gray-600" />
                {pendingOrderCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingOrderCount > 9 ? '!' : pendingOrderCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <User className="h-6 w-6 text-gray-600" />
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name || user?.email || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">
                          {user?.role?.replace('_', ' ') || 'Admin'}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {renderContent()}
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingOrderCount={pendingOrderCount}
      />
    </div>
  );
}
