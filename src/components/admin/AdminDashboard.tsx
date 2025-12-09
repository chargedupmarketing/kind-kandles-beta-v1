'use client';

import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  Menu, 
  Settings, 
  MessageSquare, 
  BookOpen, 
  LogOut,
  Shield,
  AlertTriangle,
  Gift,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Cog,
  Megaphone,
  Star,
  FileText,
  Store,
  Layout,
  Mail,
  Wrench,
  ClipboardList
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import MenuManagement from './MenuManagement';
import MaintenanceMode from './MaintenanceMode';
import ContactSubmissions from './ContactSubmissions';
import StoryManagement from './StoryManagement';
import SurveyManagement from './SurveyManagement';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import OrderFulfillment from './OrderFulfillment';
import CustomerManagement from './CustomerManagement';
import DiscountManagement from './DiscountManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import SettingsPanel from './SettingsPanel';
import PromotionsManagement from './PromotionsManagement';
import FeaturedProductsManagement from './FeaturedProductsManagement';
import BlogManagement from './BlogManagement';

type AdminSection = 'dashboard' | 'products' | 'orders' | 'fulfillment' | 'customers' | 'discounts' | 'promotions' | 'featured' | 'blog' | 'menu' | 'maintenance' | 'contacts' | 'stories' | 'survey' | 'settings';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const { logout, isMaintenanceMode, user } = useAdmin();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  // Standalone items (always visible, not in groups)
  const standaloneItems = [
    {
      id: 'dashboard' as AdminSection,
      label: 'Dashboard',
      icon: BarChart3,
    }
  ];

  // Grouped sidebar items
  const sidebarGroups = [
    {
      id: 'store',
      label: 'Store',
      icon: Store,
      defaultOpen: true,
      items: [
        {
          id: 'fulfillment' as AdminSection,
          label: 'Order Fulfillment',
          icon: ClipboardList,
        },
        {
          id: 'orders' as AdminSection,
          label: 'All Orders',
          icon: ShoppingCart,
        },
        {
          id: 'products' as AdminSection,
          label: 'Products',
          icon: Package,
        },
        {
          id: 'customers' as AdminSection,
          label: 'Customers',
          icon: Users,
        },
        {
          id: 'discounts' as AdminSection,
          label: 'Discounts',
          icon: Tag,
        },
      ]
    },
    {
      id: 'website',
      label: 'Website',
      icon: Layout,
      defaultOpen: false,
      items: [
        {
          id: 'promotions' as AdminSection,
          label: 'Promotions & Banners',
          icon: Megaphone,
        },
        {
          id: 'featured' as AdminSection,
          label: 'Featured Products',
          icon: Star,
        },
        {
          id: 'blog' as AdminSection,
          label: 'Blog Posts',
          icon: FileText,
        },
        {
          id: 'menu' as AdminSection,
          label: 'Navigation Menu',
          icon: Menu,
        },
      ]
    },
    {
      id: 'engagement',
      label: 'Engagement',
      icon: Mail,
      defaultOpen: false,
      items: [
        {
          id: 'contacts' as AdminSection,
          label: 'Contact Forms',
          icon: MessageSquare,
        },
        {
          id: 'survey' as AdminSection,
          label: 'Survey & Newsletter',
          icon: Gift,
        },
        {
          id: 'stories' as AdminSection,
          label: 'Customer Stories',
          icon: BookOpen,
        },
      ]
    },
    {
      id: 'system',
      label: 'System',
      icon: Wrench,
      defaultOpen: false,
      items: [
        {
          id: 'settings' as AdminSection,
          label: 'Store Settings',
          icon: Cog,
        },
        {
          id: 'maintenance' as AdminSection,
          label: 'Maintenance Mode',
          icon: Settings,
          badge: isMaintenanceMode ? 'ON' : undefined,
          badgeColor: isMaintenanceMode ? 'bg-red-500' : undefined
        },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'products':
        return <ProductManagement />;
      case 'fulfillment':
        return <OrderFulfillment />;
      case 'orders':
        return <OrderManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'discounts':
        return <DiscountManagement />;
      case 'promotions':
        return <PromotionsManagement />;
      case 'featured':
        return <FeaturedProductsManagement />;
      case 'blog':
        return <BlogManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'maintenance':
        return <MaintenanceMode />;
      case 'contacts':
        return <ContactSubmissions />;
      case 'survey':
        return <SurveyManagement />;
      case 'stories':
        return <StoryManagement />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Shield className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Kind Kandles Admin
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage your store
                  </p>
                </div>
              </div>
              {isMaintenanceMode && (
                <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1.5 rounded-full">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Maintenance Mode</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.username || 'Administrator'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role || 'Admin'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar
          groups={sidebarGroups}
          standaloneItems={standaloneItems}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
