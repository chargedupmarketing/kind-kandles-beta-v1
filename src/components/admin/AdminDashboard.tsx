'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useIsMobile } from '@/hooks/useMobileDetect';
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
  ClipboardList,
  UserCog,
  PanelLeft,
  UsersRound,
  Truck,
  HardDrive
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import MenuManagement from './MenuManagement';
import ContactSubmissions from './ContactSubmissions';
import StoryManagement from './StoryManagement';
import SurveyManagement from './SurveyManagement';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import OrderFulfillment from './OrderFulfillment';
import CustomerManagement from './CustomerManagement';
import ReviewManagement from './ReviewManagement';
import DiscountManagement from './DiscountManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import SettingsPanel from './SettingsPanel';
import PromotionsManagement from './PromotionsManagement';
import FeaturedProductsManagement from './FeaturedProductsManagement';
import BlogManagement from './BlogManagement';
import UserManagement from './UserManagement';
import AdminSettings from './AdminSettings';
import AIAssistant from './AIAssistant';
import EmailManagement from './EmailManagement';
import SubLevelManagement from './SubLevelManagement';
import ShippingManagement from './ShippingManagement';
import FileManagement from './FileManagement';
import MobileAppShell from './mobile/MobileAppShell';

type AdminSection = 'dashboard' | 'products' | 'orders' | 'fulfillment' | 'shipping' | 'customers' | 'discounts' | 'promotions' | 'featured' | 'blog' | 'menu' | 'email-templates' | 'files' | 'contacts' | 'stories' | 'survey' | 'settings' | 'users' | 'admin-settings' | 'ai-assistant' | 'sub-levels' | 'reviews';

// Access Denied component for unauthorized sections
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Shield className="h-16 w-16 text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
      <p className="text-gray-600 dark:text-gray-400">
        You don't have permission to access this section.
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, isMaintenanceMode, user, isSuperAdmin, hasPermission } = useAdmin();
  const isMobile = useIsMobile();

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

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
          id: 'orders' as AdminSection,
          label: 'All Orders',
          icon: ShoppingCart,
        },
        {
          id: 'fulfillment' as AdminSection,
          label: 'Order Fulfillment',
          icon: ClipboardList,
        },
        {
          id: 'shipping' as AdminSection,
          label: 'Shipping',
          icon: Truck,
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
          id: 'reviews' as AdminSection,
          label: 'Reviews',
          icon: Star,
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
          id: 'email-templates' as AdminSection,
          label: 'Email Templates',
          icon: Mail,
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
        {
          id: 'files' as AdminSection,
          label: 'File Storage',
          icon: HardDrive,
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
        // Admin Settings - visible to all admins, but database section hidden for non-super admins
        {
          id: 'admin-settings' as AdminSection,
          label: 'Admin Settings',
          icon: Settings,
          badge: isMaintenanceMode ? 'MAINT' : undefined,
          badgeColor: isMaintenanceMode ? 'bg-red-500' : undefined
        },
        // Admin Users - Super Admin only
        ...(isSuperAdmin ? [{
          id: 'users' as AdminSection,
          label: 'Admin Users',
          icon: UserCog,
        }] : []),
        // Sub-Levels - Super Admin or Developer
        ...(hasPermission('manage_sub_levels') ? [{
          id: 'sub-levels' as AdminSection,
          label: 'Teams & Sub-Levels',
          icon: UsersRound,
        }] : []),
        {
          id: 'ai-assistant' as AdminSection,
          label: 'AI Assistant',
          icon: Shield,
          badge: 'NEW',
          badgeColor: 'bg-purple-500'
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
      case 'shipping':
        return <ShippingManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'reviews':
        return <ReviewManagement />;
      case 'discounts':
        return <DiscountManagement />;
      case 'promotions':
        return <PromotionsManagement />;
      case 'featured':
        return <FeaturedProductsManagement />;
      case 'email-templates':
        return <EmailManagement />;
      case 'blog':
        return <BlogManagement />;
      case 'menu':
        return <MenuManagement />;
      case 'files':
        return <FileManagement />;
      case 'contacts':
        return <ContactSubmissions />;
      case 'survey':
        return <SurveyManagement />;
      case 'stories':
        return <StoryManagement />;
      case 'settings':
        return <SettingsPanel />;
      case 'users':
        return isSuperAdmin ? <UserManagement /> : <AccessDenied />;
      case 'sub-levels':
        return hasPermission('manage_sub_levels') ? <SubLevelManagement /> : <AccessDenied />;
      case 'admin-settings':
        return <AdminSettings />;
      case 'ai-assistant':
        return <AIAssistant />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  // Render mobile app shell on mobile devices
  if (isMobile) {
    return (
      <MobileAppShell
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        renderDesktopContent={renderContent}
      />
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <PanelLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    <span className="hidden sm:inline">Kind Kandles Admin</span>
                    <span className="sm:hidden">Admin</span>
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                    Manage your store
                  </p>
                </div>
              </div>
              {isMaintenanceMode && (
                <div className="flex items-center space-x-1 sm:space-x-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">Maintenance Mode</span>
                  <span className="text-xs sm:hidden">MAINT</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {user?.name || user?.email || 'Administrator'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role || 'Admin'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar */}
        <AdminSidebar
          groups={sidebarGroups}
          standaloneItems={standaloneItems}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-80px)]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
