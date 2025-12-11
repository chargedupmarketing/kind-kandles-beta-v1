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
  Bell
} from 'lucide-react';
import EmailEditor from './EmailEditor';

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

export default function EmailManagement() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchTemplates();
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
        <RefreshCw className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Mail className="h-7 w-7 text-pink-600" />
            Email Templates
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage email templates for order notifications, newsletters, and marketing campaigns
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-pink-600 text-white'
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterCategory === key
                    ? `bg-${info.color}-600 text-white`
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
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
            if (categoryTemplates.length === 0) return null;
            const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
            const CategoryIcon = info.icon;

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-${info.color}-100 dark:bg-${info.color}-900/30`}>
                    <CategoryIcon className={`h-5 w-5 text-${info.color}-600 dark:text-${info.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{info.label}</h3>
                    <p className="text-sm text-gray-500">{info.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="text-center py-16">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first template'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
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
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${info.color}-100 dark:bg-${info.color}-900/30`}>
              <TemplateIcon className={`h-5 w-5 text-${info.color}-600 dark:text-${info.color}-400`} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${info.color}-100 text-${info.color}-700 dark:bg-${info.color}-900/30 dark:text-${info.color}-300`}>
                {info.label}
              </span>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="h-5 w-5 text-gray-400" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1">
                  <button
                    onClick={() => { onEdit(template); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" /> Edit Template
                  </button>
                  <button
                    onClick={() => { onDuplicate(template); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" /> Duplicate
                  </button>
                  <button
                    onClick={() => { onToggleActive(template); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {template.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {template.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <hr className="my-1 dark:border-gray-700" />
                  <button
                    onClick={() => { onDelete(template); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
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
            className="text-sm text-pink-600 hover:text-pink-700 font-medium"
          >
            Edit →
          </button>
        </div>
      </div>
    </div>
  );
}

