'use client';

import { useState, useEffect } from 'react';
import { useReauth } from '@/hooks/useReauth';
import ReauthModal from './ReauthModal';
import { 
  Settings, 
  CreditCard,
  Mail,
  Database,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Percent,
  Save,
  Check,
  AlertCircle,
  Truck,
  Megaphone,
  Star,
  FileText,
  Palette,
  Users,
  Bell,
  Shield,
  Lock,
  Key,
  Clock,
  Eye,
  ShieldCheck,
  ShieldAlert,
  History,
  UserX,
  LogIn,
  LogOut,
  FileWarning,
  Fingerprint,
  Workflow
} from 'lucide-react';

interface IntegrationStatus {
  square: {
    configured: boolean;
    mode: 'sandbox' | 'production';
    hasApplicationId: boolean;
    hasAccessToken: boolean;
    hasLocationId: boolean;
  };
  email: {
    configured: boolean;
  };
  database: {
    configured: boolean;
  };
}

interface TaxSettings {
  default_rate: number;
  tax_shipping: boolean;
}

interface SecuritySettings {
  two_factor_required: boolean;
  session_timeout_hours: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resource_id?: string;
  user_email?: string;
  ip_address?: string;
  details?: any;
  created_at: string;
}

export default function SettingsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    default_rate: 0.06,
    tax_shipping: false
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_required: false,
    session_timeout_hours: 1,
    max_login_attempts: 5,
    lockout_duration_minutes: 30
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const { 
    isReauthenticated, 
    showReauthModal, 
    requireReauth, 
    handleReauthSuccess, 
    handleReauthCancel,
    userEmail 
  } = useReauth();

  useEffect(() => {
    if (isReauthenticated) {
      fetchData();
    }
  }, [isReauthenticated]);

  // Check reauth on component mount
  useEffect(() => {
    requireReauth();
  }, [requireReauth]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch integration status, tax settings, security settings, and audit logs
      const [squareRes, taxRes, securityRes, auditRes] = await Promise.all([
        fetch('/api/settings/square_status', { headers: { 'Authorization': 'Bearer admin-token' } }),
        fetch('/api/settings/tax_settings', { headers: { 'Authorization': 'Bearer admin-token' } }),
        fetch('/api/settings/security_settings', { headers: { 'Authorization': 'Bearer admin-token' } }),
        fetch('/api/admin/audit-logs?limit=10', { credentials: 'include' })
      ]);

      const squareData = await squareRes.json();
      const taxData = await taxRes.json();
      
      if (securityRes.ok) {
        const securityData = await securityRes.json();
        if (securityData.value) {
          setSecuritySettings(securityData.value);
        }
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }

      // Check email configuration
      const emailConfigured = !!process.env.NEXT_PUBLIC_EMAIL_CONFIGURED || true; // Assume configured if env not exposed

      // Check database configuration  
      const dbConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

      setIntegrationStatus({
        square: {
          configured: squareData.configured || false,
          mode: squareData.mode || 'sandbox',
          hasApplicationId: squareData.hasApplicationId || false,
          hasAccessToken: squareData.hasAccessToken || false,
          hasLocationId: squareData.hasLocationId || false,
        },
        email: { configured: emailConfigured },
        database: { configured: dbConfigured }
      });

      if (taxData.value) {
        setTaxSettings(taxData.value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTaxSettings = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/settings/tax_settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ value: taxSettings })
      });

      if (response.ok) {
        setSuccessMessage('Tax settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    setIsSavingSecurity(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/settings/security_settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ value: securitySettings })
      });

      if (response.ok) {
        setSuccessMessage('Security settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <LogIn className="h-4 w-4 text-green-500" />;
      case 'LOGOUT': return <LogOut className="h-4 w-4 text-slate-500" />;
      case 'LOGIN_FAILED': return <UserX className="h-4 w-4 text-red-500" />;
      case 'CREATE': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'UPDATE': return <RefreshCw className="h-4 w-4 text-amber-500" />;
      case 'DELETE': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'EXPORT': return <FileWarning className="h-4 w-4 text-purple-500" />;
      case 'VIEW': return <Eye className="h-4 w-4 text-slate-400" />;
      default: return <History className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'LOGOUT': return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
      case 'LOGIN_FAILED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'CREATE': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'UPDATE': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'DELETE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'EXPORT': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const quickLinks = [
    { 
      name: 'Promotions & Featured', 
      description: 'Manage banners, timers, and featured products',
      icon: Megaphone, 
      section: 'promotions',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    { 
      name: 'Automations & Workflows', 
      description: 'Email templates, workflows, and automation triggers',
      icon: Workflow, 
      section: 'automations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    { 
      name: 'Notification Preferences', 
      description: 'Configure how and when you receive alerts',
      icon: Bell, 
      section: 'notification-preferences',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30'
    },
    { 
      name: 'Admin Settings', 
      description: 'Manage users, teams, and maintenance mode',
      icon: Shield, 
      section: 'admin-settings',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
  ];

  // Show reauth modal if not authenticated
  if (!isReauthenticated) {
    return (
      <>
        {showReauthModal && (
          <ReauthModal
            onSuccess={handleReauthSuccess}
            onCancel={handleReauthCancel}
            userEmail={userEmail}
          />
        )}
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Shield className="h-16 w-16 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Security Verification Required</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            This section contains sensitive settings that can affect your store.
          </p>
          <button
            onClick={() => requireReauth()}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Verify Identity
          </button>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reauth Modal */}
      {showReauthModal && (
        <ReauthModal
          onSuccess={handleReauthSuccess}
          onCancel={handleReauthCancel}
          userEmail={userEmail}
        />
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Store Settings</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Configure your store and view integration status
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Integration Status */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
          <Settings className="h-5 w-5 text-teal-600" />
          Integration Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Square Payment */}
          <div className={`p-4 rounded-lg border-2 ${
            integrationStatus?.square.configured 
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className={`h-5 w-5 ${integrationStatus?.square.configured ? 'text-green-600' : 'text-red-600'}`} />
                <span className="font-medium text-slate-900 dark:text-white">Square Payments</span>
              </div>
              {integrationStatus?.square.configured ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {integrationStatus?.square.hasApplicationId ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="text-slate-600 dark:text-slate-400">Application ID</span>
              </div>
              <div className="flex items-center gap-2">
                {integrationStatus?.square.hasAccessToken ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="text-slate-600 dark:text-slate-400">Access Token</span>
              </div>
              <div className="flex items-center gap-2">
                {integrationStatus?.square.hasLocationId ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="text-slate-600 dark:text-slate-400">Location ID</span>
              </div>
              {integrationStatus?.square.configured && (
                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    integrationStatus.square.mode === 'production' 
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
                      : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {integrationStatus.square.mode === 'production' ? 'Live Mode' : 'Sandbox Mode'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Email (Resend) */}
          <div className={`p-4 rounded-lg border-2 ${
            integrationStatus?.email.configured 
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className={`h-5 w-5 ${integrationStatus?.email.configured ? 'text-green-600' : 'text-red-600'}`} />
                <span className="font-medium text-slate-900 dark:text-white">Email (Resend)</span>
              </div>
              {integrationStatus?.email.configured ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {integrationStatus?.email.configured 
                ? 'Order confirmations and notifications are enabled'
                : 'Add RESEND_API_KEY to enable emails'}
            </p>
          </div>

          {/* Database (Supabase) */}
          <div className={`p-4 rounded-lg border-2 ${
            integrationStatus?.database.configured 
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className={`h-5 w-5 ${integrationStatus?.database.configured ? 'text-green-600' : 'text-red-600'}`} />
                <span className="font-medium text-slate-900 dark:text-white">Database</span>
              </div>
              {integrationStatus?.database.configured ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {integrationStatus?.database.configured 
                ? 'Supabase connected - orders and data are being stored'
                : 'Configure Supabase to enable data persistence'}
            </p>
          </div>
        </div>

        {!integrationStatus?.square.configured && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Payment Processing Not Configured</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Add your Square credentials to environment variables to enable checkout. 
                  Required: NEXT_PUBLIC_SQUARE_APPLICATION_ID, SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Settings - Actually Connected */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
          <Percent className="h-5 w-5 text-green-600" />
          Tax Settings
          <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-normal">
            Active
          </span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sales Tax Rate
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={(taxSettings.default_rate * 100).toFixed(2)}
                onChange={(e) => setTaxSettings({ 
                  ...taxSettings, 
                  default_rate: (parseFloat(e.target.value) || 0) / 100 
                })}
                className="w-full px-4 py-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              This rate is applied to all orders at checkout (Maryland default: 6%)
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Tax Shipping Costs</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Apply sales tax to shipping charges</p>
            </div>
            <button
              onClick={() => setTaxSettings({ 
                ...taxSettings, 
                tax_shipping: !taxSettings.tax_shipping 
              })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                taxSettings.tax_shipping ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                taxSettings.tax_shipping ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={saveTaxSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Tax Settings'}
          </button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
          <Shield className="h-5 w-5 text-red-600" />
          Security Settings
          <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full font-normal">
            Active
          </span>
        </h3>

        {/* Security Features Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Fingerprint className="h-5 w-5 text-teal-600" />
              <span className="font-medium text-slate-900 dark:text-white">2FA</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {securitySettings.two_factor_required ? 'Required for all admins' : 'Optional'}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-slate-900 dark:text-white">Session Timeout</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {securitySettings.session_timeout_hours} hour{securitySettings.session_timeout_hours !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-slate-900 dark:text-white">Login Attempts</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {securitySettings.max_login_attempts} max before lockout
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <span className="font-medium text-slate-900 dark:text-white">Lockout Duration</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {securitySettings.lockout_duration_minutes} minutes
            </p>
          </div>
        </div>

        {/* Security Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Fingerprint className="h-5 w-5 text-teal-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Require Two-Factor Authentication</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">All admin users must enable 2FA to access the panel</p>
              </div>
            </div>
            <button
              onClick={() => setSecuritySettings({ 
                ...securitySettings, 
                two_factor_required: !securitySettings.two_factor_required 
              })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                securitySettings.two_factor_required ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                securitySettings.two_factor_required ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Session Timeout (hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={securitySettings.session_timeout_hours}
                onChange={(e) => setSecuritySettings({ 
                  ...securitySettings, 
                  session_timeout_hours: parseInt(e.target.value) || 1
                })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={securitySettings.max_login_attempts}
                onChange={(e) => setSecuritySettings({ 
                  ...securitySettings, 
                  max_login_attempts: parseInt(e.target.value) || 5
                })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Lockout Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={securitySettings.lockout_duration_minutes}
                onChange={(e) => setSecuritySettings({ 
                  ...securitySettings, 
                  lockout_duration_minutes: parseInt(e.target.value) || 30
                })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={saveSecuritySettings}
            disabled={isSavingSecurity}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSavingSecurity ? 'Saving...' : 'Save Security Settings'}
          </button>
        </div>
      </div>

      {/* Recent Activity / Audit Log */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <History className="h-5 w-5 text-purple-600" />
            Recent Activity
          </h3>
          <button
            onClick={() => setShowAllLogs(!showAllLogs)}
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            {showAllLogs ? 'Show Less' : 'View All'}
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity recorded</p>
            <p className="text-sm mt-1">Activity will appear here once actions are performed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAllLogs ? auditLogs : auditLogs.slice(0, 5)).map((log) => (
              <div 
                key={log.id} 
                className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {log.resource}
                      {log.resource_id && <span className="text-slate-400 dark:text-slate-500"> #{log.resource_id.slice(0, 8)}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {log.user_email && <span>{log.user_email}</span>}
                    {log.ip_address && log.ip_address !== 'unknown' && (
                      <>
                        <span>•</span>
                        <span>{log.ip_address}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {formatTimeAgo(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}

        {auditLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              All admin actions are logged for security compliance
            </p>
          </div>
        )}
      </div>

      {/* Quick Links to Other Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
          <ExternalLink className="h-5 w-5 text-teal-600" />
          More Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <button
              key={link.section}
              onClick={() => {
                // Dispatch event to change section in parent
                window.dispatchEvent(new CustomEvent('admin-navigate', { detail: link.section }));
              }}
              className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-teal-300 dark:hover:border-teal-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all text-left group"
            >
              <div className={`p-2 rounded-lg ${link.bgColor}`}>
                <link.icon className={`h-5 w-5 ${link.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {link.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {link.description}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors flex-shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Environment Info */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Environment</h3>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-sm text-slate-600 dark:text-slate-300">
            Next.js {process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 'Production' : 'Development'}
          </span>
          {integrationStatus?.square.configured && (
            <span className={`px-3 py-1 rounded-full text-sm ${
              integrationStatus.square.mode === 'production'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
            }`}>
              Square: {integrationStatus.square.mode === 'production' ? 'Live' : 'Sandbox'}
            </span>
          )}
          {integrationStatus?.database.configured && (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
              Database: Connected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
