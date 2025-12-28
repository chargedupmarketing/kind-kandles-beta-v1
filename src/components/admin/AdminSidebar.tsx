'use client';

import { useState, useEffect } from 'react';
import { LucideIcon, ChevronDown, ChevronRight, X } from 'lucide-react';

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
}

interface AdminSidebarProps {
  groups: SidebarGroup[];
  standaloneItems: SidebarItem[];
  activeSection: string;
  onSectionChange: (section: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ groups, standaloneItems, activeSection, onSectionChange, isOpen, onClose }: AdminSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    groups.filter(g => g.defaultOpen).map(g => g.id)
  );

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
        min-h-[calc(100vh-80px)] lg:min-h-[calc(100vh-80px)]
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

          {/* Grouped Items */}
          {groups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups.includes(group.id);
            const groupActive = isGroupActive(group);
            
            return (
              <div key={group.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 lg:py-2.5 rounded-lg text-left transition-all ${
                    groupActive && !isExpanded
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon className={`h-5 w-5 ${groupActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span className={`font-medium text-sm ${groupActive ? 'text-teal-700 dark:text-teal-300' : ''}`}>
                      {group.label}
                    </span>
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

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Kind Kandles Admin v1.0
        </div>
      </div>
    </aside>
    </>
  );
}
