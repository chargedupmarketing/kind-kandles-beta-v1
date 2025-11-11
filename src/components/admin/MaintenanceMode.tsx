'use client';

import { useState } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  Settings, 
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export default function MaintenanceMode() {
  const { 
    isMaintenanceMode, 
    setMaintenanceMode, 
    maintenanceAccessCode, 
    setMaintenanceAccessCode 
  } = useAdmin();
  
  const [newAccessCode, setNewAccessCode] = useState(maintenanceAccessCode);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    localStorage.getItem('maintenanceMessage') || 
    'We are currently performing scheduled maintenance to improve your experience. Please check back shortly!'
  );
  const [estimatedTime, setEstimatedTime] = useState(
    localStorage.getItem('maintenanceEstimatedTime') || '2 hours'
  );

  const handleToggleMaintenanceMode = () => {
    const newMode = !isMaintenanceMode;
    setMaintenanceMode(newMode);
    
    if (newMode) {
      // Save current settings when enabling maintenance mode
      localStorage.setItem('maintenanceMessage', maintenanceMessage);
      localStorage.setItem('maintenanceEstimatedTime', estimatedTime);
    }
  };

  const handleUpdateAccessCode = () => {
    if (newAccessCode.trim().length >= 6) {
      setMaintenanceAccessCode(newAccessCode.trim());
      alert('Access code updated successfully!');
    } else {
      alert('Access code must be at least 6 characters long.');
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

  const handleSaveSettings = () => {
    localStorage.setItem('maintenanceMessage', maintenanceMessage);
    localStorage.setItem('maintenanceEstimatedTime', estimatedTime);
    alert('Maintenance settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Maintenance Mode</h2>
        <p className="text-slate-600 dark:text-slate-400">Control site accessibility and maintenance settings</p>
      </div>

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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Minimum 6 characters. This code allows bypass of maintenance mode.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Access Code Usage</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Visitors can enter this code on the maintenance page to bypass the restriction and access the full website.
                </p>
              </div>
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
              placeholder="Enter the message visitors will see during maintenance"
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
              placeholder="e.g., 2 hours, 30 minutes, etc."
            />
          </div>

          <button
            onClick={handleSaveSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Maintenance Page Preview</h3>
        
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 border-2 border-dashed border-slate-300 dark:border-slate-600">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Settings className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Site Under Maintenance
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {maintenanceMessage}
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
              <Clock className="h-4 w-4" />
              <span>Estimated time: {estimatedTime}</span>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Have an access code? Enter it to continue to the site.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
