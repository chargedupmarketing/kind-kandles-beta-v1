'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Role hierarchy: super_admin > admin > user
type MainLevel = 'user' | 'admin' | 'super_admin';

interface AdminUser {
  id?: string;
  email: string;
  name?: string;
  role: MainLevel;
  subLevels: string[];
}

// Permission types
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

// Permission matrix
const PERMISSION_MATRIX: Record<Permission, { minRole: MainLevel; subLevels?: string[] }> = {
  view_dashboard: { minRole: 'user' },
  manage_products: { minRole: 'admin' },
  manage_orders: { minRole: 'admin' },
  manage_customers: { minRole: 'admin' },
  manage_discounts: { minRole: 'admin' },
  website_settings: { minRole: 'admin' },
  view_admin_users: { minRole: 'super_admin' },
  manage_admin_users: { minRole: 'super_admin' },
  database_management: { minRole: 'super_admin' },
  manage_sub_levels: { minRole: 'super_admin', subLevels: ['developer'] },
};

// Role hierarchy for comparison
const ROLE_HIERARCHY: Record<MainLevel, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
};

interface AdminContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    requires2FA?: boolean;
    userId?: string;
    email?: string;
    error?: string 
  }>;
  verify2FA: (userId: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isMaintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean) => void;
  maintenanceAccessCode: string;
  setMaintenanceAccessCode: (code: string) => void;
  // Permission helpers
  hasPermission: (permission: Permission) => boolean;
  hasRole: (minRole: MainLevel) => boolean;
  hasSubLevel: (subLevel: string) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
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
          setUser({
            id: data.user?.userId,
            email: data.user?.email || data.user?.username,
            name: data.user?.name,
            role: (data.user?.role as MainLevel) || 'admin',
            subLevels: data.user?.subLevels || []
          });
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

  // Login - Step 1: Validate credentials
  const login = async (email: string, password: string): Promise<{ 
    success: boolean; 
    requires2FA?: boolean;
    userId?: string;
    email?: string;
    error?: string 
  }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires2FA) {
          // 2FA required - return info for 2FA step
          return { 
            success: true, 
            requires2FA: true,
            userId: data.userId,
            email: data.email
          };
        } else {
          // Direct login (no 2FA)
          setIsAuthenticated(true);
          setUser({
            id: data.user?.id,
            email: data.user?.email,
            name: data.user?.name,
            role: (data.user?.role as MainLevel) || 'admin',
            subLevels: data.user?.subLevels || []
          });
          return { success: true };
        }
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Login - Step 2: Verify 2FA code
  const verify2FA = async (userId: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, code }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setUser({
          id: data.user?.id,
          email: data.user?.email,
          name: data.user?.name,
          role: (data.user?.role as MainLevel) || 'admin',
          subLevels: data.user?.subLevels || []
        });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Verification failed' };
      }
    } catch (error) {
      console.error('2FA verification error:', error);
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

  // Permission helpers
  const hasRole = useCallback((minRole: MainLevel): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
  }, [user]);

  const hasSubLevel = useCallback((subLevel: string): boolean => {
    if (!user) return false;
    return user.subLevels.includes(subLevel);
  }, [user]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    
    // Super admins have all permissions
    if (user.role === 'super_admin') return true;
    
    const permConfig = PERMISSION_MATRIX[permission];
    
    // Check role requirement
    if (ROLE_HIERARCHY[user.role] < ROLE_HIERARCHY[permConfig.minRole]) {
      // Check if user has a qualifying sub-level
      if (permConfig.subLevels) {
        return permConfig.subLevels.some(sl => user.subLevels.includes(sl));
      }
      return false;
    }
    
    return true;
  }, [user]);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = hasRole('admin');
  const isDeveloper = hasSubLevel('developer');

  return (
    <AdminContext.Provider value={{
      isAuthenticated,
      user,
      isLoading,
      login,
      verify2FA,
      logout,
      isMaintenanceMode,
      setMaintenanceMode,
      maintenanceAccessCode,
      setMaintenanceAccessCode,
      hasPermission,
      hasRole,
      hasSubLevel,
      isSuperAdmin,
      isAdmin,
      isDeveloper
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

// Export types for use in other components
export type { Permission, MainLevel, AdminUser };
