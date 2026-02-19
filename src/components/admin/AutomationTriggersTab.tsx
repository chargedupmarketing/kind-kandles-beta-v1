'use client';

import { useState } from 'react';
import { 
  Clock,
  Save,
  ShoppingCart,
  Package,
  CheckCircle,
  Star,
  Users,
  Gift,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

interface TriggerConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  enabled: boolean;
  settings: {
    delay_minutes?: number;
    conditions?: string[];
  };
}

const DEFAULT_TRIGGERS: TriggerConfig[] = [];

export default function AutomationTriggersTab() {
  const [triggers, setTriggers] = useState<TriggerConfig[]>(DEFAULT_TRIGGERS);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleTrigger = (triggerId: string) => {
    setTriggers(prev => prev.map(t => 
      t.id === triggerId ? { ...t, enabled: !t.enabled } : t
    ));
  };

  const updateDelay = (triggerId: string, minutes: number) => {
    setTriggers(prev => prev.map(t => 
      t.id === triggerId ? { ...t, settings: { ...t.settings, delay_minutes: minutes } } : t
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('Trigger settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving triggers:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDelay = (minutes: number) => {
    if (minutes === 0) return 'Immediate';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''}`;
    return `${Math.floor(minutes / 1440)} day${Math.floor(minutes / 1440) > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400">
          Configure when automated emails are triggered and their timing
        </p>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Triggers Grid */}
      {triggers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No triggers configured yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Triggers will appear here once you create workflows. Each workflow can have custom timing and conditions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {triggers.map((trigger) => {
          const Icon = trigger.icon;
          
          return (
            <div
              key={trigger.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
                trigger.enabled
                  ? 'border-purple-200 dark:border-purple-800'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg bg-${trigger.color}-100 dark:bg-${trigger.color}-900/30`}>
                      <Icon className={`h-6 w-6 text-${trigger.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {trigger.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {trigger.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTrigger(trigger.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      trigger.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {trigger.enabled ? (
                      <>
                        <ToggleRight className="h-5 w-5" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-5 w-5" />
                        Disabled
                      </>
                    )}
                  </button>
                </div>

                {trigger.enabled && trigger.settings.delay_minutes !== undefined && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Clock className="h-4 w-4" />
                        Delay Before Sending
                      </label>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {formatDelay(trigger.settings.delay_minutes)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10080"
                      step="60"
                      value={trigger.settings.delay_minutes}
                      onChange={(e) => updateDelay(trigger.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>Immediate</span>
                      <span>1 hour</span>
                      <span>1 day</span>
                      <span>7 days</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" />
          About Triggers & Timing
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>• <strong>Immediate:</strong> Email sent as soon as the event occurs</li>
          <li>• <strong>Delayed:</strong> Wait period before sending (useful for abandoned carts, reviews)</li>
          <li>• <strong>Disabled Triggers:</strong> Won't send any emails even if the event occurs</li>
          <li>• <strong>Best Practice:</strong> Space out emails to avoid overwhelming customers</li>
          <li>• Changes take effect immediately for new events</li>
        </ul>
      </div>

      {/* Statistics - Only show if there are triggers */}
      {triggers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Active Triggers</h4>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {triggers.filter(t => t.enabled).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              out of {triggers.length} total
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Immediate Triggers</h4>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {triggers.filter(t => t.enabled && t.settings.delay_minutes === 0).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              sent instantly
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Delayed Triggers</h4>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {triggers.filter(t => t.enabled && (t.settings.delay_minutes || 0) > 0).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              with wait periods
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
