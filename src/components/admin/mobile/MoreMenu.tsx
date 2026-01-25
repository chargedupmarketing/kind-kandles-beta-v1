'use client';

import { useState, ReactNode } from 'react';
import { 
  Users, 
  Truck, 
  Star, 
  Tag, 
  ClipboardList,
  Megaphone,
  FileText,
  Mail,
  Menu,
  HardDrive,
  MessageSquare,
  Gift,
  BookOpen,
  Cog,
  Settings,
  UserCog,
  Shield,
  ChevronLeft,
  Search,
  X,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { hapticLight } from '@/lib/haptics';
import { useAdmin } from '@/contexts/AdminContext';
import type { AdminSection } from './MobileAppShell';

interface MoreMenuProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  renderContent: () => ReactNode;
}

interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

type Permission = 
  | 'view_dashboard'
  | 'manage_products'
  | 'manage_orders'
  | 'manage_customers'
  | 'manage_discounts'
  | 'website_settings'
  | 'view_admin_users'
  | 'manage_admin_users'
  | 'database_management'
  | 'manage_sub_levels';

interface MenuItem {
  id: AdminSection;
  label: string;
  icon: typeof Users;
  color: string;
  bgColor: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  requiresSuperAdmin?: boolean;
  requiresPermission?: Permission;
}

export default function MoreMenu({ activeSection, onSectionChange, renderContent }: MoreMenuProps) {
  const [selectedSection, setSelectedSection] = useState<AdminSection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { isSuperAdmin, hasPermission, isMaintenanceMode } = useAdmin();

  const menuCategories: MenuCategory[] = [
    {
      id: 'store',
      label: 'Store',
      items: [
        { id: 'customers', label: 'Customers', icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
        { id: 'shipping', label: 'Shipping', icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50' },
        { id: 'shipping-guide', label: 'Ship Guide', icon: HelpCircle, color: 'text-blue-600', bgColor: 'bg-blue-50', description: 'Pirate Ship Workflow' },
        { id: 'fulfillment', label: 'Fulfill', icon: ClipboardList, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { id: 'reviews', label: 'Reviews', icon: Star, color: 'text-amber-600', bgColor: 'bg-amber-50' },
        { id: 'discounts', label: 'Discounts', icon: Tag, color: 'text-pink-600', bgColor: 'bg-pink-50' },
      ],
    },
    {
      id: 'website',
      label: 'Website',
      items: [
        { id: 'promotions', label: 'Promos', icon: Megaphone, color: 'text-orange-600', bgColor: 'bg-orange-50' },
        { id: 'featured', label: 'Featured', icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
        { id: 'email-templates', label: 'Emails', icon: Mail, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
        { id: 'blog', label: 'Blog', icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { id: 'files', label: 'Files', icon: HardDrive, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      ],
    },
    {
      id: 'engagement',
      label: 'Engage',
      items: [
        { id: 'contacts', label: 'Contacts', icon: MessageSquare, color: 'text-teal-600', bgColor: 'bg-teal-50' },
        { id: 'survey', label: 'Survey', icon: Gift, color: 'text-rose-600', bgColor: 'bg-rose-50' },
        { id: 'stories', label: 'Stories', icon: BookOpen, color: 'text-violet-600', bgColor: 'bg-violet-50' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: Cog, color: 'text-gray-600', bgColor: 'bg-gray-100' },
        { 
          id: 'admin-settings', 
          label: 'Admin', 
          icon: Settings, 
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badge: isMaintenanceMode ? '!' : undefined,
          badgeColor: 'bg-red-500'
        },
        { 
          id: 'users', 
          label: 'Users', 
          icon: UserCog, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          requiresSuperAdmin: true,
          description: 'Users & Teams'
        },
        { 
          id: 'ai-assistant', 
          label: 'AI', 
          icon: Sparkles, 
          color: 'text-teal-600',
          bgColor: 'bg-gradient-to-br from-teal-50 to-purple-50',
          badge: '✨',
          badgeColor: 'bg-purple-500'
        },
      ],
    },
  ];

  const filteredCategories = menuCategories.map(category => ({
    ...category,
    items: category.items.filter(item => {
      if (item.requiresSuperAdmin && !isSuperAdmin) return false;
      if (item.requiresPermission && !hasPermission(item.requiresPermission)) return false;
      return true;
    }),
  })).filter(category => category.items.length > 0);

  const searchFilteredCategories = searchQuery
    ? filteredCategories.map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.items.length > 0)
    : filteredCategories;

  const handleItemClick = (section: AdminSection) => {
    hapticLight();
    setSelectedSection(section);
    onSectionChange(section);
  };

  const handleBack = () => {
    hapticLight();
    setSelectedSection(null);
  };

  if (selectedSection) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="sticky top-0 bg-white z-10 px-3 py-2 border-b border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900 capitalize">
              {selectedSection.replace(/-/g, ' ')}
            </h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Compact Search Toggle */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm">
        {showSearch ? (
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 text-sm"
              />
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">All Features</span>
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Search className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Compact Menu Grid */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {searchFilteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No features found</p>
          </div>
        ) : (
          searchFilteredCategories.map((category) => (
            <div key={category.id}>
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                {category.label}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`relative flex flex-col items-center p-2.5 rounded-xl transition-all active:scale-95 ${
                        isActive
                          ? 'bg-teal-50 border-2 border-teal-500'
                          : 'bg-white border border-gray-100 shadow-sm active:bg-gray-50'
                      }`}
                    >
                      {item.badge && (
                        <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[8px] font-bold text-white rounded-full flex items-center justify-center ${item.badgeColor || 'bg-blue-500'}`}>
                          {item.badge}
                        </span>
                      )}
                      <div className={`p-2 rounded-lg mb-1 ${item.bgColor}`}>
                        <Icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight ${
                        isActive ? 'text-teal-700' : 'text-gray-600'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
