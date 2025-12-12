'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import BottomTabBar from './BottomTabBar';
import MobileDashboard from './MobileDashboard';
import MobileOrders from './MobileOrders';
import MobileProducts from './MobileProducts';
import MoreMenu from './MoreMenu';
import QuickActionsFAB from './QuickActionsFAB';
import { Shield, AlertTriangle, LogOut, Bell, User } from 'lucide-react';

export type MobileTab = 'home' | 'orders' | 'products' | 'more';
export type AdminSection = 'dashboard' | 'products' | 'orders' | 'fulfillment' | 'shipping' | 'customers' | 'discounts' | 'promotions' | 'featured' | 'blog' | 'menu' | 'email-templates' | 'files' | 'contacts' | 'stories' | 'survey' | 'settings' | 'users' | 'admin-settings' | 'ai-assistant' | 'sub-levels' | 'reviews';

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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-teal-900/50 rounded-lg">
                <Shield className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Kind Kandles</h1>
                <p className="text-xs text-slate-400">Command Center</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              {/* Maintenance Mode Badge */}
              {isMaintenanceMode && (
                <div className="flex items-center space-x-1 bg-red-900/50 text-red-300 px-2 py-1 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs font-medium">MAINT</span>
                </div>
              )}

              {/* Notifications */}
              <button className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-slate-400" />
                {pendingOrderCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingOrderCount > 9 ? '9+' : pendingOrderCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <User className="h-5 w-5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                      <div className="p-3 border-b border-slate-700">
                        <p className="text-sm font-medium text-white truncate">
                          {user?.name || user?.email || 'Admin'}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {user?.role?.replace('_', ' ') || 'Admin'}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2.5 text-red-400 hover:bg-slate-700/50 transition-colors"
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

      {/* Quick Actions FAB */}
      <QuickActionsFAB onAction={onSectionChange} />

      {/* Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingOrderCount={pendingOrderCount}
      />
    </div>
  );
}

