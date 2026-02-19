'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy,
  Eye,
  EyeOff,
  Send,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  ShoppingCart,
  Megaphone,
  FileText,
  Package,
  Truck,
  Star,
  Gift,
  Bell,
  X,
  TestTube,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import EmailEditor from './EmailEditor';
import { useAdmin } from '@/contexts/AdminContext';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: 'transactional' | 'marketing' | 'custom';
  subject: string;
  html_content: string;
  variables: string[];
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORY_INFO = {
  transactional: {
    label: 'Transactional',
    description: 'Auto-sent based on customer actions',
    color: 'blue',
    icon: ShoppingCart,
  },
  marketing: {
    label: 'Marketing',
    description: 'Newsletters and promotions',
    color: 'purple',
    icon: Megaphone,
  },
  custom: {
    label: 'Custom',
    description: 'User-created templates',
    color: 'green',
    icon: FileText,
  },
};

const TEMPLATE_ICONS: Record<string, typeof Mail> = {
  'order-confirmation': Package,
  'shipping-notification': Truck,
  'delivery-confirmation': CheckCircle,
  'review-request': Star,
  'welcome-email': Gift,
  'weekly-newsletter': Mail,
  'promotional-email': Megaphone,
  'abandoned-cart': ShoppingCart,
};

export default function EmailTemplatesTab() {
  const { isSuperAdmin, isDeveloper } = useAdmin();
  const canTestEmails = isSuperAdmin || isDeveloper;
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Test email panel state
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testTemplateId, setTestTemplateId] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  useEffect(() => {
    fetchTemplates();
    // Load saved default test email
    const savedEmail = localStorage.getItem('admin_test_email');
    if (savedEmail) {
      setTestEmail(savedEmail);
    }
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setErrorMessage('Failed to load email templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    const duplicated = {
      ...template,
      name: `${template.name} (Copy)`,
      slug: `${template.slug}-copy-${Date.now()}`,
      category: 'custom' as const,
    };
    setSelectedTemplate(duplicated as EmailTemplate);
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('Template deleted successfully');
        fetchTemplates();
      } else {
        setErrorMessage('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setErrorMessage('Failed to delete template');
    }

    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 3000);
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !template.is_active }),
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const handleSave = async (templateData: Partial<EmailTemplate>) => {
    try {
      const url = isCreating 
        ? '/api/admin/email-templates'
        : `/api/admin/email-templates/${selectedTemplate?.id}`;
      
      const method = isCreating ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        setSuccessMessage(isCreating ? 'Template created successfully' : 'Template updated successfully');
        setIsEditorOpen(false);
        fetchTemplates();
      } else {
        setErrorMessage('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setErrorMessage('Failed to save template');
    }

    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 3000);
  };

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmail || !testTemplateId) {
      setErrorMessage('Please select a template and enter a recipient email');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      setErrorMessage('Please enter a valid email address');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const selectedTestTemplate = templates.find(t => t.id === testTemplateId);
    if (!selectedTestTemplate) {
      setErrorMessage('Template not found');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsSendingTest(true);

    try {
      const response = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: selectedTestTemplate.subject,
          html_content: selectedTestTemplate.html_content,
          variables: {},
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Test email sent to ${testEmail}`);
        // Save as default if checkbox is checked
        if (saveAsDefault) {
          localStorage.setItem('admin_test_email', testEmail);
        }
      } else {
        setErrorMessage(data.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setErrorMessage('Failed to send test email');
    } finally {
      setIsSendingTest(false);
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
    }
  };

  // Clear saved default email
  const handleClearDefaultEmail = () => {
    localStorage.removeItem('admin_test_email');
    setTestEmail('');
    setSuccessMessage('Default test email cleared');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group templates by category
  const groupedTemplates = {
    transactional: filteredTemplates.filter(t => t.category === 'transactional'),
    marketing: filteredTemplates.filter(t => t.category === 'marketing'),
    custom: filteredTemplates.filter(t => t.category === 'custom'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm sm:text-base">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-red-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm sm:text-base">{errorMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <div className="flex items-center gap-2">
          {canTestEmails && (
            <button
              onClick={() => setShowTestPanel(!showTestPanel)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base ${
                showTestPanel 
                  ? 'bg-amber-600 text-white hover:bg-amber-700' 
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700'
              }`}
            >
              <TestTube className="h-5 w-5" />
              <span className="hidden sm:inline">Test Emails</span>
            </button>
          )}
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-lg text-sm sm:text-base"
          >
            <Plus className="h-5 w-5" />
            <span className="sm:inline">Create Template</span>
          </button>
        </div>
      </div>

      {/* Test Email Panel - Super Admin & Developer Only */}
      {canTestEmails && showTestPanel && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800/50">
                <TestTube className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Test Email Center
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                    Super Admin / Developer
                  </span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send test emails to verify template rendering
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTestPanel(false)}
              className="p-1.5 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Template
              </label>
              <select
                value={testTemplateId}
                onChange={(e) => setTestTemplateId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 text-sm"
              >
                <option value="">Choose a template...</option>
                <optgroup label="Transactional">
                  {templates.filter(t => t.category === 'transactional').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Marketing">
                  {templates.filter(t => t.category === 'marketing').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Custom">
                  {templates.filter(t => t.category === 'custom').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Recipient Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recipient Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveDefault"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="saveDefault" className="text-xs text-gray-600 dark:text-gray-400">
                  Save as default test email
                </label>
                {localStorage.getItem('admin_test_email') && (
                  <button
                    onClick={handleClearDefaultEmail}
                    className="text-xs text-red-600 hover:text-red-700 ml-auto"
                  >
                    Clear saved
                  </button>
                )}
              </div>
            </div>

            {/* Send Button */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 invisible">
                Action
              </label>
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTest || !testEmail || !testTemplateId}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Subject will be prefixed with [TEST]
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-4 p-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <strong>How it works:</strong> Test emails use sample data for template variables (e.g., customer_name becomes &quot;Test Customer&quot;, order_number becomes &quot;KK-TEST-12345&quot;). This helps you verify the email layout and styling before sending to real customers.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        {/* Search and Filter Toggle */}
        <div className="flex gap-2 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
        
        {/* Category Filters - Always visible on desktop, toggleable on mobile */}
        <div className={`flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
          <button
            onClick={() => setFilterCategory('all')}
            className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              filterCategory === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All ({templates.length})
          </button>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => {
            const count = templates.filter(t => t.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
                  filterCategory === key
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Categories */}
      {filterCategory === 'all' ? (
        // Show grouped view
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
            if (categoryTemplates.length === 0) return null;
            const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
            const CategoryIcon = info.icon;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{info.label}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">{info.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {categoryTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show flat view for filtered category
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 sm:py-16 px-4">
          <Mail className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No templates found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first template'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Template
            </button>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <EmailEditor
          template={selectedTemplate}
          isCreating={isCreating}
          onSave={handleSave}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
}: {
  template: EmailTemplate;
  onEdit: (t: EmailTemplate) => void;
  onDuplicate: (t: EmailTemplate) => void;
  onDelete: (t: EmailTemplate) => void;
  onToggleActive: (t: EmailTemplate) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const info = CATEGORY_INFO[template.category];
  const TemplateIcon = TEMPLATE_ICONS[template.slug] || Mail;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0">
              <TemplateIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">{template.name}</h4>
              <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {info.label}
              </span>
            </div>
          </div>
          <div className="relative flex-shrink-0 ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 sm:p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="h-5 w-5 text-gray-400" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 w-44 sm:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1">
                  <button
                    onClick={() => { onEdit(template); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 sm:py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                  >
                    <Edit2 className="h-4 w-4" /> Edit Template
                  </button>
                  <button
                    onClick={() => { onDuplicate(template); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 sm:py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                  >
                    <Copy className="h-4 w-4" /> Duplicate
                  </button>
                  <button
                    onClick={() => { onToggleActive(template); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 sm:py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"
                  >
                    {template.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {template.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <hr className="my-1 dark:border-gray-700" />
                  <button
                    onClick={() => { onDelete(template); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 sm:py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-1">
          {template.description || template.subject}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {template.is_active ? (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <EyeOff className="h-3 w-3" /> Inactive
              </span>
            )}
          </div>
          <button
            onClick={() => onEdit(template)}
            className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium py-1 px-2 -mr-2"
          >
            Edit →
          </button>
        </div>
      </div>
    </div>
  );
}
