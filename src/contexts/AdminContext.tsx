'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminUser {
  username: string;
  role: string;
}

interface AdminContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isMaintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => void;
  maintenanceAccessCode: string;
  setMaintenanceAccessCode: (code: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const DEFAULT_MAINTENANCE_CODE = process.env.NEXT_PUBLIC_DEFAULT_MAINTENANCE_CODE || 'ADMIN123';

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceModeState] = useState(false);
  const [maintenanceAccessCode, setMaintenanceAccessCodeState] = useState(DEFAULT_MAINTENANCE_CODE);

  // Verify authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();

    // Load maintenance mode settings
    const maintenanceMode = localStorage.getItem('maintenanceMode');
    if (maintenanceMode === 'true') {
      setIsMaintenanceModeState(true);
    }

    const storedCode = localStorage.getItem('maintenanceAccessCode');
    if (storedCode) {
      setMaintenanceAccessCodeState(storedCode);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setUser({ username: data.user?.username || username, role: 'admin' });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const setMaintenanceMode = (enabled: boolean) => {
    setIsMaintenanceModeState(enabled);
    localStorage.setItem('maintenanceMode', enabled.toString());
  };

  const setMaintenanceAccessCode = (code: string) => {
    setMaintenanceAccessCodeState(code);
    localStorage.setItem('maintenanceAccessCode', code);
  };

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      user,
      isLoading,
      login,
      logout,
      isMaintenanceMode,
      setMaintenanceMode,
      maintenanceAccessCode,
      setMaintenanceAccessCode
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
