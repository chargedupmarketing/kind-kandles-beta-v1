'use client';

import { useState, lazy, Suspense } from 'react';
import { 
  Workflow,
  Mail,
  Zap,
  Clock,
  RefreshCw
} from 'lucide-react';

const EmailTemplatesTab = lazy(() => import('./EmailTemplatesTab'));
const WorkflowBuilderTab = lazy(() => import('./WorkflowBuilderTab'));
const AutomationTriggersTab = lazy(() => import('./AutomationTriggersTab'));

type TabKey = 'templates' | 'workflows' | 'triggers';

export default function AutomationsManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>('templates');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Workflow className="h-7 w-7 text-purple-600" />
              Automations & Workflows
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage email templates, build automated workflows, and configure triggers
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'templates'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Mail className="h-4 w-4" />
            Email Templates
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'workflows'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Zap className="h-4 w-4" />
            Workflow Builder
          </button>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'triggers'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            Triggers & Rules
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }>
        {activeTab === 'templates' && <EmailTemplatesTab />}
        {activeTab === 'workflows' && <WorkflowBuilderTab />}
        {activeTab === 'triggers' && <AutomationTriggersTab />}
      </Suspense>
    </div>
  );
}
