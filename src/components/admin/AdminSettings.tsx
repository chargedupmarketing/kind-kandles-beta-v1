'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  Settings, 
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileDown,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  BookOpen,
  Star
} from 'lucide-react';

interface DatabaseStats {
  products: number;
  orders: number;
  customers: number;
  contacts: number;
  stories: number;
  surveys: number;
}

export default function AdminSettings() {
  const { 
    isMaintenanceMode, 
    setMaintenanceMode, 
    maintenanceAccessCode, 
    setMaintenanceAccessCode,
    isSuperAdmin 
  } = useAdmin();
  
  const [activeTab, setActiveTab] = useState<'maintenance' | 'database'>('maintenance');
  const [newAccessCode, setNewAccessCode] = useState(maintenanceAccessCode);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('2 hours');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    products: 0,
    orders: 0,
    customers: 0,
    contacts: 0,
    stories: 0,
    surveys: 0
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Load maintenance settings from localStorage
    const savedMessage = localStorage.getItem('maintenanceMessage');
    const savedTime = localStorage.getItem('maintenanceEstimatedTime');
    if (savedMessage) setMaintenanceMessage(savedMessage);
    if (savedTime) setEstimatedTime(savedTime);
    
    // Fetch database stats
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/admin/database/stats');
      if (response.ok) {
        const data = await response.json();
        setDbStats(data);
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
    }
  };

  const handleToggleMaintenanceMode = () => {
    const newMode = !isMaintenanceMode;
    setMaintenanceMode(newMode);
    
    if (newMode) {
      localStorage.setItem('maintenanceMessage', maintenanceMessage);
      localStorage.setItem('maintenanceEstimatedTime', estimatedTime);
    }
  };

  const handleUpdateAccessCode = () => {
    if (newAccessCode.trim().length >= 6) {
      setMaintenanceAccessCode(newAccessCode.trim());
      setSuccessMessage('Access code updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage('Access code must be at least 6 characters long.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAccessCode(result);
  };

  const handleSaveMaintenanceSettings = () => {
    localStorage.setItem('maintenanceMessage', maintenanceMessage);
    localStorage.setItem('maintenanceEstimatedTime', estimatedTime);
    setSuccessMessage('Maintenance settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const exportData = async (dataType: string) => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/admin/database/export?type=${dataType}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccessMessage(`${dataType} data exported successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Failed to export data. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const deleteData = async (dataType: string) => {
    if (deleteConfirmation !== `DELETE ${dataType.toUpperCase()}`) {
      setErrorMessage(`Please type "DELETE ${dataType.toUpperCase()}" to confirm`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/database/wipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: dataType })
      });

      if (response.ok) {
        setSuccessMessage(`${dataType} data deleted successfully!`);
        setDeleteTarget(null);
        setDeleteConfirmation('');
        fetchDatabaseStats();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage('Failed to delete data. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const dataCategories = [
    { 
      id: 'products', 
      name: 'Products', 
      icon: Package, 
      count: dbStats.products,
      description: 'All product listings, variants, and images',
      color: 'pink'
    },
    { 
      id: 'orders', 
      name: 'Orders', 
      icon: ShoppingCart, 
      count: dbStats.orders,
      description: 'Order history and transaction records',
      color: 'blue'
    },
    { 
      id: 'customers', 
      name: 'Customers', 
      icon: Users, 
      count: dbStats.customers,
      description: 'Customer accounts and contact information',
      color: 'green'
    },
    { 
      id: 'contacts', 
      name: 'Contact Submissions', 
      icon: MessageSquare, 
      count: dbStats.contacts,
      description: 'Contact form submissions',
      color: 'purple'
    },
    { 
      id: 'stories', 
      name: 'Customer Stories', 
      icon: BookOpen, 
      count: dbStats.stories,
      description: 'Customer submitted stories',
      color: 'amber'
    },
    { 
      id: 'surveys', 
      name: 'Survey Responses', 
      icon: Star, 
      count: dbStats.surveys,
      description: 'Survey and newsletter signups',
      color: 'teal'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Settings</h2>
        <p className="text-slate-600 dark:text-slate-400">System configuration and database management</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'maintenance'
              ? 'text-pink-600 border-pink-600'
              : 'text-gray-600 border-transparent hover:text-gray-900 dark:text-gray-400'
          }`}
        >
          <Shield className="h-4 w-4" />
          Maintenance Mode
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'database'
                ? 'text-pink-600 border-pink-600'
                : 'text-gray-600 border-transparent hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Database className="h-4 w-4" />
            Database Management
          </button>
        )}
      </div>

      {/* Maintenance Mode Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Current Status */}
          <div className={`rounded-lg p-6 border-2 ${
            isMaintenanceMode 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center space-x-3">
              {isMaintenanceMode ? (
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              ) : (
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              )}
              <div>
                <h3 className={`text-xl font-semibold ${
                  isMaintenanceMode 
                    ? 'text-red-800 dark:text-red-300' 
                    : 'text-green-800 dark:text-green-300'
                }`}>
                  {isMaintenanceMode ? 'Maintenance Mode ACTIVE' : 'Site is LIVE'}
                </h3>
                <p className={`${
                  isMaintenanceMode 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {isMaintenanceMode 
                    ? 'Visitors will see the maintenance page' 
                    : 'All visitors can access the website normally'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Maintenance Mode */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Maintenance Mode Control</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Enable Maintenance Mode</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  When enabled, only users with the access code can view the site
                </p>
              </div>
              
              <button
                onClick={handleToggleMaintenanceMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isMaintenanceMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isMaintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Access Code Management */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Access Code Management</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Access Code
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <input
                      type={showAccessCode ? 'text' : 'password'}
                      value={newAccessCode}
                      onChange={(e) => setNewAccessCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 pr-10"
                      placeholder="Enter access code"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessCode(!showAccessCode)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showAccessCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    onClick={generateRandomCode}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Generate</span>
                  </button>
                  <button
                    onClick={handleUpdateAccessCode}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Update</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Message Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Maintenance Page Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Maintenance Message
                </label>
                <textarea
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="We are currently performing scheduled maintenance..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Estimated Time
                </label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="e.g., 2 hours"
                />
              </div>

              <button
                onClick={handleSaveMaintenanceSettings}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Management Tab - Super Admin Only */}
      {activeTab === 'database' && isSuperAdmin && (
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-300">Danger Zone</h3>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  The actions below are <strong>irreversible</strong>. Always export your data before deleting. 
                  Deleted data cannot be recovered.
                </p>
              </div>
            </div>
          </div>

          {/* Database Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {dataCategories.map((cat) => (
              <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className={`p-2 rounded-lg bg-${cat.color}-100 dark:bg-${cat.color}-900/30 w-fit mb-2`}>
                  <cat.icon className={`h-5 w-5 text-${cat.color}-600 dark:text-${cat.color}-400`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{cat.count}</p>
                <p className="text-sm text-slate-500">{cat.name}</p>
              </div>
            ))}
          </div>

          {/* Data Management Cards */}
          <div className="space-y-4">
            {dataCategories.map((cat) => (
              <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-${cat.color}-100 dark:bg-${cat.color}-900/30`}>
                      <cat.icon className={`h-6 w-6 text-${cat.color}-600 dark:text-${cat.color}-400`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{cat.name}</h3>
                      <p className="text-sm text-slate-500">{cat.description}</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                        {cat.count} records
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => exportData(cat.id)}
                      disabled={isExporting || cat.count === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => setDeleteTarget(deleteTarget === cat.id ? null : cat.id)}
                      disabled={cat.count === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Wipe Data
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteTarget === cat.id && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      <strong>Warning:</strong> This will permanently delete all {cat.name.toLowerCase()}. 
                      Type <code className="bg-red-100 dark:bg-red-800 px-1 rounded">DELETE {cat.id.toUpperCase()}</code> to confirm.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={`Type "DELETE ${cat.id.toUpperCase()}" to confirm`}
                        className="flex-1 px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        onClick={() => deleteData(cat.id)}
                        disabled={isDeleting || deleteConfirmation !== `DELETE ${cat.id.toUpperCase()}`}
                        className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isDeleting ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(null);
                          setDeleteConfirmation('');
                        }}
                        className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Export All Data */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <FileDown className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Export All Data</h3>
                  <p className="text-sm text-slate-500">Download a complete backup of all database tables</p>
                </div>
              </div>
              <button
                onClick={() => exportData('all')}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                <Download className="h-5 w-5" />
                Export Full Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

