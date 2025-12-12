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
  UsersRound,
  Shield,
  ChevronLeft,
  Search,
  X
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
  description?: string;
  badge?: string;
  badgeColor?: string;
  requiresSuperAdmin?: boolean;
  requiresPermission?: Permission;
}

export default function MoreMenu({ activeSection, onSectionChange, renderContent }: MoreMenuProps) {
  const [selectedSection, setSelectedSection] = useState<AdminSection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isSuperAdmin, hasPermission, isMaintenanceMode } = useAdmin();

  const menuCategories: MenuCategory[] = [
    {
      id: 'store',
      label: 'Store',
      items: [
        { id: 'customers', label: 'Customers', icon: Users, color: 'text-green-400 bg-green-500/20', description: 'Manage customer data' },
        { id: 'shipping', label: 'Shipping', icon: Truck, color: 'text-purple-400 bg-purple-500/20', description: 'Track shipments' },
        { id: 'fulfillment', label: 'Fulfillment', icon: ClipboardList, color: 'text-blue-400 bg-blue-500/20', description: 'Process orders' },
        { id: 'reviews', label: 'Reviews', icon: Star, color: 'text-amber-400 bg-amber-500/20', description: 'Customer feedback' },
        { id: 'discounts', label: 'Discounts', icon: Tag, color: 'text-pink-400 bg-pink-500/20', description: 'Promo codes' },
      ],
    },
    {
      id: 'website',
      label: 'Website',
      items: [
        { id: 'promotions', label: 'Promotions', icon: Megaphone, color: 'text-orange-400 bg-orange-500/20', description: 'Banners & promos' },
        { id: 'featured', label: 'Featured', icon: Star, color: 'text-yellow-400 bg-yellow-500/20', description: 'Featured products' },
        { id: 'email-templates', label: 'Emails', icon: Mail, color: 'text-cyan-400 bg-cyan-500/20', description: 'Email templates' },
        { id: 'blog', label: 'Blog', icon: FileText, color: 'text-indigo-400 bg-indigo-500/20', description: 'Blog posts' },
        { id: 'menu', label: 'Navigation', icon: Menu, color: 'text-slate-400 bg-slate-500/20', description: 'Site menu' },
        { id: 'files', label: 'Files', icon: HardDrive, color: 'text-emerald-400 bg-emerald-500/20', description: 'File storage' },
      ],
    },
    {
      id: 'engagement',
      label: 'Engagement',
      items: [
        { id: 'contacts', label: 'Contacts', icon: MessageSquare, color: 'text-teal-400 bg-teal-500/20', description: 'Contact forms' },
        { id: 'survey', label: 'Survey', icon: Gift, color: 'text-rose-400 bg-rose-500/20', description: 'Newsletter signup' },
        { id: 'stories', label: 'Stories', icon: BookOpen, color: 'text-violet-400 bg-violet-500/20', description: 'Customer stories' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: Cog, color: 'text-slate-400 bg-slate-500/20', description: 'Store settings' },
        { 
          id: 'admin-settings', 
          label: 'Admin', 
          icon: Settings, 
          color: 'text-red-400 bg-red-500/20', 
          description: 'Admin settings',
          badge: isMaintenanceMode ? 'MAINT' : undefined,
          badgeColor: 'bg-red-500'
        },
        { 
          id: 'users', 
          label: 'Users', 
          icon: UserCog, 
          color: 'text-blue-400 bg-blue-500/20', 
          description: 'Admin users',
          requiresSuperAdmin: true
        },
        { 
          id: 'sub-levels', 
          label: 'Teams', 
          icon: UsersRound, 
          color: 'text-purple-400 bg-purple-500/20', 
          description: 'Teams & sub-levels',
          requiresPermission: 'manage_sub_levels'
        },
        { 
          id: 'ai-assistant', 
          label: 'AI Assistant', 
          icon: Shield, 
          color: 'text-teal-400 bg-teal-500/20', 
          description: 'AI business helper',
          badge: 'NEW',
          badgeColor: 'bg-purple-500'
        },
      ],
    },
  ];

  // Filter items based on permissions
  const filteredCategories = menuCategories.map(category => ({
    ...category,
    items: category.items.filter(item => {
      if (item.requiresSuperAdmin && !isSuperAdmin) return false;
      if (item.requiresPermission && !hasPermission(item.requiresPermission)) return false;
      return true;
    }),
  })).filter(category => category.items.length > 0);

  // Search filter
  const searchFilteredCategories = searchQuery
    ? filteredCategories.map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

  // If a section is selected, show the desktop content
  if (selectedSection) {
    return (
      <div className="flex flex-col h-full">
        {/* Section Header */}
        <div className="sticky top-0 bg-slate-900 z-10 p-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-400" />
            </button>
            <h2 className="text-lg font-semibold text-white capitalize">
              {selectedSection.replace(/-/g, ' ')}
            </h2>
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 overflow-auto p-4">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="sticky top-0 bg-slate-900 z-10 p-4 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {searchFilteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No features found</p>
          </div>
        ) : (
          searchFilteredCategories.map((category) => (
            <div key={category.id}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {category.label}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`relative flex flex-col items-center p-4 rounded-xl transition-all ${
                        isActive
                          ? 'bg-teal-600/20 border border-teal-500/30'
                          : 'bg-slate-800 hover:bg-slate-700/80 border border-transparent'
                      }`}
                    >
                      {/* Badge */}
                      {item.badge && (
                        <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-medium text-white rounded-full ${item.badgeColor || 'bg-blue-500'}`}>
                          {item.badge}
                        </span>
                      )}

                      {/* Icon */}
                      <div className={`p-2.5 rounded-lg mb-2 ${item.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Label */}
                      <span className={`text-xs font-medium text-center ${
                        isActive ? 'text-teal-300' : 'text-slate-300'
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

