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
  Gift
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import MenuManagement from './MenuManagement';
import MaintenanceMode from './MaintenanceMode';
import ContactSubmissions from './ContactSubmissions';
import StoryManagement from './StoryManagement';
import SurveyManagement from './SurveyManagement';

type AdminSection = 'menu' | 'maintenance' | 'contacts' | 'stories' | 'survey';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('contacts');
  const { logout, isMaintenanceMode, user } = useAdmin();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const sidebarItems = [
    {
      id: 'contacts' as AdminSection,
      label: 'Contact Forms',
      icon: MessageSquare,
      description: 'Form Submissions'
    },
    {
      id: 'survey' as AdminSection,
      label: 'Survey & Newsletter',
      icon: Gift,
      description: 'Survey Responses'
    },
    {
      id: 'stories' as AdminSection,
      label: 'Story Management',
      icon: BookOpen,
      description: 'User Stories'
    },
    {
      id: 'menu' as AdminSection,
      label: 'Menu Management',
      icon: Menu,
      description: 'Product Categories'
    },
    {
      id: 'maintenance' as AdminSection,
      label: 'Maintenance Mode',
      icon: Settings,
      description: 'Site Maintenance',
      badge: isMaintenanceMode ? 'ACTIVE' : undefined,
      badgeColor: isMaintenanceMode ? 'bg-red-500' : undefined
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
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
      default:
        return <ContactSubmissions />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Admin Panel
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Kind Kandles Boutique
                  </p>
                </div>
              </div>
              {isMaintenanceMode && (
                <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Maintenance Mode Active</span>
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
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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
          items={sidebarItems}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
