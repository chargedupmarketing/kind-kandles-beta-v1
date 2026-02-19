'use client';

import { useState, useEffect } from 'react';
import { LucideIcon, ChevronDown, ChevronRight, X, Wrench, LogOut, Settings } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  badgeColor?: string;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: SidebarItem[];
  defaultOpen?: boolean;
  superAdminOnly?: boolean;
}

interface AdminSidebarProps {
  groups: SidebarGroup[];
  standaloneItems: SidebarItem[];
  activeSection: string;
  onSectionChange: (section: any) => void;
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  onLogout: () => void;
}

export default function AdminSidebar({ groups, standaloneItems, activeSection, onSectionChange, isOpen, onClose, user, onLogout }: AdminSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    groups.filter(g => g.defaultOpen).map(g => g.id)
  );
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Close sidebar on navigation for mobile
  const handleSectionChange = (section: any) => {
    onSectionChange(section);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Keep sidebar behavior consistent on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isGroupActive = (group: SidebarGroup) => {
    return group.items.some(item => item.id === activeSection);
  };

  // Separate settings group from other groups
  const settingsGroup = groups.find(g => g.id === 'system');
  const otherGroups = groups.filter(g => g.id !== 'system');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-10
        w-72 lg:w-64 
        bg-white dark:bg-slate-800 
        shadow-xl lg:shadow-sm 
        border-r border-slate-200 dark:border-slate-700 
        h-full
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <span className="font-semibold text-slate-900 dark:text-white">Menu</span>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {/* Standalone Items (Dashboard) */}
            {standaloneItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 lg:py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className={`font-medium text-sm ${isActive ? 'text-teal-700 dark:text-teal-300' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${item.badgeColor || 'bg-blue-500'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

          {standaloneItems.length > 0 && groups.length > 0 && (
            <div className="my-3 border-t border-slate-200 dark:border-slate-700" />
          )}

          {/* Grouped Items (excluding Settings) */}
          {otherGroups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups.includes(group.id);
            const groupActive = isGroupActive(group);
            const isDeveloperTools = group.superAdminOnly;
            
            return (
              <div key={group.id} className="space-y-1">
                {/* Add separator before Developer Tools */}
                {isDeveloperTools && (
                  <div className="my-3 border-t border-slate-200 dark:border-slate-700" />
                )}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 lg:py-2.5 rounded-lg text-left transition-all ${
                    isDeveloperTools
                      ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30'
                      : ''
                  } ${
                    groupActive && !isExpanded
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDeveloperTools ? (
                      <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <GroupIcon className={`h-5 w-5 ${groupActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    )}
                    <span className={`font-medium text-sm ${isDeveloperTools ? 'text-amber-700 dark:text-amber-300' : groupActive ? 'text-teal-700 dark:text-teal-300' : ''}`}>
                      {group.label}
                    </span>
                    {isDeveloperTools && (
                      <span className="px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded">
                        DEV
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {/* Dropdown Items */}
                {isExpanded && (
                  <div className="ml-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSection === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSectionChange(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-lg text-left transition-all ${
                            isActive
                              ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`h-4 w-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className={`px-1.5 py-0.5 text-xs font-medium text-white rounded-full ${item.badgeColor || 'bg-blue-500'}`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout at Bottom */}
      <div className="mt-auto border-t border-slate-200 dark:border-slate-700">
        {/* User Info Box with Settings */}
        <div 
          className="m-3 mb-2 relative"
          onMouseLeave={() => setShowSettingsMenu(false)}
        >
          <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {user?.name || user?.email || 'Administrator'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.role?.replace('_', ' ') || 'Admin'}
              </p>
            </div>
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              onMouseEnter={() => setShowSettingsMenu(true)}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex-shrink-0"
              title="Settings"
            >
              <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Settings Popup Menu */}
          {showSettingsMenu && settingsGroup && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSettingsMenu(false)}
              />
              
              {/* Invisible bridge to prevent gap issues */}
              <div className="absolute left-full bottom-0 w-4 h-full z-50" />
              
              {/* Menu */}
              <div 
                className="absolute left-full bottom-0 ml-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-2"
              >
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {settingsGroup.label}
                  </p>
                </div>
                <div className="py-1">
                  {settingsGroup.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleSectionChange(item.id);
                          setShowSettingsMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                          isActive
                            ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 text-xs font-medium text-white rounded-full ${item.badgeColor || 'bg-blue-500'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Logout Button Box */}
        <div className="mx-3 mb-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-800/30 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
