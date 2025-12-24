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

// Maintenance settings interface
interface MaintenanceSettings {
  enabled: boolean;
  access_code: string;
  message: string;
  estimated_time: string;
}

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
  setMaintenanceMode: (enabled: boolean) => Promise<void>;
  maintenanceAccessCode: string;
  setMaintenanceAccessCode: (code: string) => Promise<void>;
  maintenanceMessage: string;
  setMaintenanceMessage: (message: string) => Promise<void>;
  maintenanceEstimatedTime: string;
  setMaintenanceEstimatedTime: (time: string) => Promise<void>;
  refreshMaintenanceSettings: () => Promise<void>;
  isMaintenanceLoading: boolean;
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
const DEFAULT_MAINTENANCE_MESSAGE = 'We are currently performing scheduled maintenance to improve your experience. Please check back shortly!';
const DEFAULT_MAINTENANCE_TIME = '2 hours';

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceModeState] = useState(false);
  const [maintenanceAccessCode, setMaintenanceAccessCodeState] = useState(DEFAULT_MAINTENANCE_CODE);
  const [maintenanceMessage, setMaintenanceMessageState] = useState(DEFAULT_MAINTENANCE_MESSAGE);
  const [maintenanceEstimatedTime, setMaintenanceEstimatedTimeState] = useState(DEFAULT_MAINTENANCE_TIME);

  // Fetch maintenance settings from API
  const fetchMaintenanceSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/maintenance', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      if (response.ok) {
        const data = await response.json();
        const settings: MaintenanceSettings = data.settings;
        setIsMaintenanceModeState(settings.enabled);
        setMaintenanceAccessCodeState(settings.access_code);
        setMaintenanceMessageState(settings.message);
        setMaintenanceEstimatedTimeState(settings.estimated_time);
      }
    } catch (error) {
      console.error('Error fetching maintenance settings:', error);
      // Fall back to localStorage if API fails
      const localEnabled = localStorage.getItem('maintenanceMode');
      if (localEnabled === 'true') {
        setIsMaintenanceModeState(true);
      }
      const localCode = localStorage.getItem('maintenanceAccessCode');
      if (localCode) {
        setMaintenanceAccessCodeState(localCode);
      }
    } finally {
      setIsMaintenanceLoading(false);
    }
  }, []);

  // Update maintenance settings via API
  const updateMaintenanceSettings = useCallback(async (updates: Partial<MaintenanceSettings>) => {
    try {
      const currentSettings: MaintenanceSettings = {
        enabled: isMaintenanceMode,
        access_code: maintenanceAccessCode,
        message: maintenanceMessage,
        estimated_time: maintenanceEstimatedTime,
      };
      
      const newSettings = { ...currentSettings, ...updates };
      
      console.log('Updating maintenance settings:', newSettings);
      
      const response = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Maintenance settings updated successfully:', data);
        const settings: MaintenanceSettings = data.settings;
        setIsMaintenanceModeState(settings.enabled);
        setMaintenanceAccessCodeState(settings.access_code);
        setMaintenanceMessageState(settings.message);
        setMaintenanceEstimatedTimeState(settings.estimated_time);
        
        // Also update localStorage as cache/fallback
        localStorage.setItem('maintenanceMode', settings.enabled.toString());
        localStorage.setItem('maintenanceAccessCode', settings.access_code);
        localStorage.setItem('maintenanceMessage', settings.message);
        localStorage.setItem('maintenanceEstimatedTime', settings.estimated_time);
        
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to update maintenance settings:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('Error updating maintenance settings:', error);
      return false;
    }
  }, [isMaintenanceMode, maintenanceAccessCode, maintenanceMessage, maintenanceEstimatedTime]);

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
    
    // Fetch maintenance settings from database
    fetchMaintenanceSettings();
  }, [fetchMaintenanceSettings]);

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

  const setMaintenanceMode = async (enabled: boolean) => {
    const success = await updateMaintenanceSettings({ enabled });
    if (!success) {
      throw new Error('Failed to update maintenance mode in database');
    }
  };

  const setMaintenanceAccessCode = async (code: string) => {
    const success = await updateMaintenanceSettings({ access_code: code });
    if (!success) {
      throw new Error('Failed to update access code in database');
    }
  };

  const setMaintenanceMessage = async (message: string) => {
    const success = await updateMaintenanceSettings({ message });
    if (!success) {
      throw new Error('Failed to update maintenance message in database');
    }
  };

  const setMaintenanceEstimatedTime = async (time: string) => {
    const success = await updateMaintenanceSettings({ estimated_time: time });
    if (!success) {
      throw new Error('Failed to update estimated time in database');
    }
  };

  const refreshMaintenanceSettings = async () => {
    setIsMaintenanceLoading(true);
    await fetchMaintenanceSettings();
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
      maintenanceMessage,
      setMaintenanceMessage,
      maintenanceEstimatedTime,
      setMaintenanceEstimatedTime,
      refreshMaintenanceSettings,
      isMaintenanceLoading,
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
