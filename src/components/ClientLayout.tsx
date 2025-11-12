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
  const { isMaintenanceMode, maintenanceAccessCode } = useAdmin();
  const [hasMaintenanceAccess, setHasMaintenanceAccess] = useState(false);
  const pathname = usePathname();

  // Check if user has maintenance access stored
  useEffect(() => {
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
  }, []);

  // Allow admin pages even in maintenance mode
  const isAdminPage = pathname?.startsWith('/restricted');

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
    const maintenanceMessage = localStorage.getItem('maintenanceMessage') || 
      'We are currently performing scheduled maintenance to improve your experience. Please check back shortly!';
    const estimatedTime = localStorage.getItem('maintenanceEstimatedTime') || '2 hours';

    return (
      <MaintenancePage
        message={maintenanceMessage}
        estimatedTime={estimatedTime}
        onAccessCodeSubmit={handleAccessCodeSubmit}
      />
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
