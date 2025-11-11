'use client';

import { LucideIcon } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
  badgeColor?: string;
}

interface AdminSidebarProps {
  items: SidebarItem[];
  activeSection: string;
  onSectionChange: (section: any) => void;
}

export default function AdminSidebar({ items, activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-slate-800 shadow-sm border-r border-slate-200 dark:border-slate-700 min-h-[calc(100vh-80px)]">
      <nav className="p-4">
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <div>
                    <p className={`font-medium ${isActive ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-slate-100'}`}>
                      {item.label}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
                
                {item.badge && (
                  <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${
                    item.badgeColor || 'bg-blue-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
