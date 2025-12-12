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
  X,
  Sparkles
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
  const [showSearch, setShowSearch] = useState(false);
  const { isSuperAdmin, hasPermission, isMaintenanceMode } = useAdmin();

  const menuCategories: MenuCategory[] = [
    {
      id: 'store',
      label: 'Store',
      items: [
        { id: 'customers', label: 'Customers', icon: Users, color: 'text-green-400 bg-green-500/20' },
        { id: 'shipping', label: 'Shipping', icon: Truck, color: 'text-purple-400 bg-purple-500/20' },
        { id: 'fulfillment', label: 'Fulfill', icon: ClipboardList, color: 'text-blue-400 bg-blue-500/20' },
        { id: 'reviews', label: 'Reviews', icon: Star, color: 'text-amber-400 bg-amber-500/20' },
        { id: 'discounts', label: 'Discounts', icon: Tag, color: 'text-pink-400 bg-pink-500/20' },
      ],
    },
    {
      id: 'website',
      label: 'Website',
      items: [
        { id: 'promotions', label: 'Promos', icon: Megaphone, color: 'text-orange-400 bg-orange-500/20' },
        { id: 'featured', label: 'Featured', icon: Star, color: 'text-yellow-400 bg-yellow-500/20' },
        { id: 'email-templates', label: 'Emails', icon: Mail, color: 'text-cyan-400 bg-cyan-500/20' },
        { id: 'blog', label: 'Blog', icon: FileText, color: 'text-indigo-400 bg-indigo-500/20' },
        { id: 'menu', label: 'Nav', icon: Menu, color: 'text-slate-400 bg-slate-500/20' },
        { id: 'files', label: 'Files', icon: HardDrive, color: 'text-emerald-400 bg-emerald-500/20' },
      ],
    },
    {
      id: 'engagement',
      label: 'Engage',
      items: [
        { id: 'contacts', label: 'Contacts', icon: MessageSquare, color: 'text-teal-400 bg-teal-500/20' },
        { id: 'survey', label: 'Survey', icon: Gift, color: 'text-rose-400 bg-rose-500/20' },
        { id: 'stories', label: 'Stories', icon: BookOpen, color: 'text-violet-400 bg-violet-500/20' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      items: [
        { id: 'settings', label: 'Settings', icon: Cog, color: 'text-slate-400 bg-slate-500/20' },
        { 
          id: 'admin-settings', 
          label: 'Admin', 
          icon: Settings, 
          color: 'text-red-400 bg-red-500/20',
          badge: isMaintenanceMode ? '!' : undefined,
          badgeColor: 'bg-red-500'
        },
        { 
          id: 'users', 
          label: 'Users', 
          icon: UserCog, 
          color: 'text-blue-400 bg-blue-500/20',
          requiresSuperAdmin: true
        },
        { 
          id: 'sub-levels', 
          label: 'Teams', 
          icon: UsersRound, 
          color: 'text-purple-400 bg-purple-500/20',
          requiresPermission: 'manage_sub_levels'
        },
        { 
          id: 'ai-assistant', 
          label: 'AI', 
          icon: Sparkles, 
          color: 'text-teal-400 bg-gradient-to-br from-teal-500/30 to-purple-500/30',
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
      <div className="flex flex-col h-full">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 px-3 py-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-400" />
            </button>
            <h2 className="text-sm font-semibold text-white capitalize">
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
    <div className="flex flex-col h-full">
      {/* Compact Search Toggle */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 border-b border-slate-800">
        {showSearch ? (
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 text-sm"
              />
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">All Features</span>
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Search className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        )}
      </div>

      {/* Compact Menu Grid */}
      <div className="flex-1 overflow-auto p-3 space-y-4">
        {searchFilteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No features found</p>
          </div>
        ) : (
          searchFilteredCategories.map((category) => (
            <div key={category.id}>
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
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
                          ? 'bg-teal-600/20 border border-teal-500/30'
                          : 'bg-slate-800/50 active:bg-slate-700/80 border border-transparent'
                      }`}
                    >
                      {item.badge && (
                        <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[8px] font-bold text-white rounded-full flex items-center justify-center ${item.badgeColor || 'bg-blue-500'}`}>
                          {item.badge}
                        </span>
                      )}
                      <div className={`p-2 rounded-lg mb-1 ${item.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight ${
                        isActive ? 'text-teal-300' : 'text-slate-400'
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

