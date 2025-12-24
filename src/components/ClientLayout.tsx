'use client';

import { ReactNode, useState, useEffect } from 'react';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleBanner from "@/components/SimpleBanner";
import MaintenancePage from "@/components/MaintenancePage";
import SurveyPopup from "@/components/SurveyPopup";
import { useBanner } from "@/contexts/BannerContext";
import { useAdmin } from "@/contexts/AdminContext";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { isSimpleBannerVisible, setSimpleBannerVisible } = useBanner();
  const { isMaintenanceMode, maintenanceAccessCode, maintenanceMessage, maintenanceEstimatedTime } = useAdmin();
  const [hasMaintenanceAccess, setHasMaintenanceAccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Ensure component is mounted before accessing localStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if user has maintenance access stored
  useEffect(() => {
    if (!isMounted) return;
    
    // Check for maintenance access cookie (server-side set)
    const checkMaintenanceAccess = () => {
      // The cookie is HTTP-only, so we'll check by making a request
      // or rely on the server-side middleware to handle this
      // For now, we'll keep the localStorage fallback for existing users
      const storedAccess = localStorage.getItem('maintenanceAccess');
      if (storedAccess === 'granted') {
        setHasMaintenanceAccess(true);
      }
    };
    
    checkMaintenanceAccess();
  }, [isMounted]);

  // Allow admin pages even in maintenance mode
  const isAdminPage = pathname?.startsWith('/restricted');
  const isAdminDashboard = pathname === '/restricted/admin';

  // Handle access code submission
  const handleAccessCodeSubmit = (code: string): boolean => {
    if (code === maintenanceAccessCode) {
      setHasMaintenanceAccess(true);
      localStorage.setItem('maintenanceAccess', 'granted');
      return true;
    }
    return false;
  };

  // Show maintenance page if maintenance mode is active and user doesn't have access
  if (isMaintenanceMode && !hasMaintenanceAccess && !isAdminPage) {
    return (
      <MaintenancePage
        message={maintenanceMessage}
        estimatedTime={maintenanceEstimatedTime}
        onAccessCodeSubmit={handleAccessCodeSubmit}
      />
    );
  }

  // For all restricted/admin pages, render without header/footer/banner
  if (isAdminPage) {
    return (
      <div className="relative">
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      <SimpleBanner onVisibilityChange={setSimpleBannerVisible} />
      <Header />
      <main className={`min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 ${isSimpleBannerVisible ? 'pt-8' : 'pt-0'}`}>
        {children}
      </main>
      <Footer />
      {/* Survey Popup - Only shows on first visit */}
      {!isAdminPage && <SurveyPopup />}
    </div>
  );
}
