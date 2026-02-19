'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Send, 
  Eye, 
  Smartphone, 
  Monitor,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Code,
  Type,
  Variable,
  Wand2,
  ChevronDown,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { cleanHTML } from '@/lib/htmlUtils';

interface EmailTemplate {
  id?: string;
  name: string;
  slug: string;
  category: 'transactional' | 'marketing' | 'custom';
  subject: string;
  html_content: string;
  variables: string[];
  description?: string;
  is_active: boolean;
}

interface EmailEditorProps {
  template: EmailTemplate | null;
  isCreating: boolean;
  onSave: (template: Partial<EmailTemplate>) => void;
  onClose: () => void;
}

const VARIABLE_PRESETS: Record<string, { label: string; variables: string[] }> = {
  order: {
    label: 'Order Variables',
    variables: ['customer_name', 'order_number', 'order_total', 'subtotal', 'shipping', 'tax', 'items_list', 'shipping_address'],
  },
  shipping: {
    label: 'Shipping Variables',
    variables: ['tracking_number', 'tracking_url', 'carrier_name', 'estimated_delivery'],
  },
  marketing: {
    label: 'Marketing Variables',
    variables: ['subscriber_name', 'discount_code', 'discount_percent', 'expiry_date', 'shop_url', 'unsubscribe_link'],
  },
  newsletter: {
    label: 'Newsletter Variables',
    variables: ['newsletter_title', 'newsletter_content', 'featured_products', 'offer_title', 'offer_description'],
  },
  cart: {
    label: 'Cart Variables',
    variables: ['cart_items', 'cart_total', 'cart_url'],
  },
  social: {
    label: 'Social Links',
    variables: ['facebook_url', 'instagram_url', 'tiktok_url'],
  },
};

const CATEGORY_OPTIONS = [
  { value: 'transactional', label: 'Transactional', description: 'Auto-sent emails' },
  { value: 'marketing', label: 'Marketing', description: 'Newsletters & promos' },
  { value: 'custom', label: 'Custom', description: 'Custom templates' },
];

export default function EmailEditor({ template, isCreating, onSave, onClose }: EmailEditorProps) {
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    name: '',
    slug: '',
    category: 'custom',
    subject: '',
    html_content: '',
    variables: [],
    description: '',
    is_active: true,
  });
  
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMode, setAiMode] = useState<'generate' | 'improve' | 'subjects'>('generate');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedVariables, setExpandedVariables] = useState<string[]>(['order']);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        slug: template.slug,
        category: template.category,
        subject: template.subject,
        html_content: template.html_content,
        variables: template.variables || [],
        description: template.description || '',
        is_active: template.is_active,
      });
    }
  }, [template]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: isCreating ? generateSlug(name) : formData.slug,
    });
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.html_content || '';
    const variableText = `{{${variable}}}`;
    
    const newText = text.substring(0, start) + variableText + text.substring(end);
    setFormData({ ...formData, html_content: newText });

    // Update variables list
    if (!formData.variables?.includes(variable)) {
      setFormData(prev => ({
        ...prev,
        html_content: newText,
        variables: [...(prev.variables || []), variable],
      }));
    }

    // Refocus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    setAiSuggestions([]);

    try {
      const response = await fetch('/api/admin/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: aiMode,
          prompt: aiPrompt,
          currentContent: formData.html_content,
          currentSubject: formData.subject,
          templateType: formData.category,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (aiMode === 'subjects') {
          setAiSuggestions(data.suggestions || []);
        } else {
          setFormData(prev => ({
            ...prev,
            html_content: data.content || prev.html_content,
            subject: data.subject || prev.subject,
          }));
          setSuccessMessage('AI content generated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to generate content');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setErrorMessage('Failed to connect to AI service');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsAiLoading(false);
    }
  };

  const applySubjectSuggestion = (subject: string) => {
    setFormData(prev => ({ ...prev, subject }));
    setAiSuggestions([]);
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      setErrorMessage('Please enter a test email address');
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
          subject: formData.subject,
          html_content: formData.html_content,
        }),
      });

      if (response.ok) {
        setSuccessMessage(`Test email sent to ${testEmail}`);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email error:', error);
      setErrorMessage('Failed to send test email');
    } finally {
      setIsSendingTest(false);
      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.html_content) {
      setErrorMessage('Please fill in all required fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  const toggleVariableGroup = (group: string) => {
    setExpandedVariables(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-500">
          <h3 className="text-xl font-bold text-white">
            {isCreating ? 'Create Email Template' : 'Edit Email Template'}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showAIPanel
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mx-4 mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mx-4 mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {errorMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-4 px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Code className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              
              {activeTab === 'preview' && (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  >
                    <Monitor className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  >
                    <Smartphone className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'edit' ? (
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Template Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g., Order Confirmation"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as EmailTemplate['category'] })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      >
                        {CATEGORY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} - {opt.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of when this email is sent"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Line *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g., Your order {{order_number}} has shipped!"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    {aiSuggestions.length > 0 && (
                      <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                          AI Subject Suggestions:
                        </p>
                        <div className="space-y-2">
                          {aiSuggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => applySubjectSuggestion(suggestion)}
                              className="w-full text-left p-2 bg-white dark:bg-gray-800 rounded border hover:border-purple-500 text-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HTML Content */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Content (HTML) *</label>
                    <textarea
                      ref={textareaRef}
                      value={formData.html_content}
                      onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                      placeholder="Enter your email HTML content..."
                      rows={20}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="is_active" className="font-medium">
                      Template is active
                    </label>
                  </div>
                </div>
              ) : (
                /* Preview */
                <div className="flex justify-center">
                  <div 
                    className={`bg-white border shadow-lg ${
                      previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-[600px]'
                    }`}
                  >
                    <div className="p-2 bg-gray-100 border-b text-xs text-gray-500">
                      Subject: {formData.subject || '(No subject)'}
                    </div>
                    <div 
                      className="p-4"
                      dangerouslySetInnerHTML={{ 
                        __html: cleanHTML(formData.html_content || '<p style="color: #999; text-align: center; padding: 40px;">No content yet</p>')
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Variables & AI */}
          <div className="w-80 border-l dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800">
            {showAIPanel ? (
              /* AI Panel */
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <h4 className="font-semibold">AI Writing Assistant</h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">What would you like to do?</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setAiMode('generate')}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          aiMode === 'generate'
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                            : 'bg-white dark:bg-gray-700 border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Generate Email</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Create a complete email from a description</p>
                      </button>
                      <button
                        onClick={() => setAiMode('improve')}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          aiMode === 'improve'
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                            : 'bg-white dark:bg-gray-700 border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Improve Content</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Enhance existing email content</p>
                      </button>
                      <button
                        onClick={() => setAiMode('subjects')}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          aiMode === 'subjects'
                            ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                            : 'bg-white dark:bg-gray-700 border'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Subject Lines</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Generate 5 subject line variations</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {aiMode === 'generate' && 'Describe the email you want:'}
                      {aiMode === 'improve' && 'How should it be improved?'}
                      {aiMode === 'subjects' && 'Describe the email topic:'}
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={
                        aiMode === 'generate' 
                          ? 'e.g., A warm welcome email for new subscribers with a 15% discount code'
                          : aiMode === 'improve'
                          ? 'e.g., Make it more engaging and add urgency'
                          : 'e.g., Abandoned cart reminder with 10% discount'
                      }
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 text-sm"
                    />
                  </div>

                  <button
                    onClick={handleAIGenerate}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Uses Anthropic Claude AI (configured in environment variables)
                  </p>
                </div>
              </div>
            ) : (
              /* Variables Panel */
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Variable className="h-5 w-5 text-pink-500" />
                  <h4 className="font-semibold">Insert Variables</h4>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Click a variable to insert it at cursor position
                </p>

                <div className="space-y-2">
                  {Object.entries(VARIABLE_PRESETS).map(([key, group]) => (
                    <div key={key} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleVariableGroup(key)}
                        className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <span className="text-sm font-medium">{group.label}</span>
                        {expandedVariables.includes(key) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedVariables.includes(key) && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-1">
                          {group.variables.map(variable => (
                            <button
                              key={variable}
                              onClick={() => insertVariable(variable)}
                              className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border dark:border-gray-600 rounded hover:border-pink-500 hover:text-pink-600 transition-colors"
                            >
                              {`{{${variable}}}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Used Variables */}
                {formData.variables && formData.variables.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-sm font-medium mb-2">Variables in use:</h5>
                    <div className="flex flex-wrap gap-1">
                      {formData.variables.map(v => (
                        <span key={v} className="px-2 py-1 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Test Email */}
            <div className="p-4 border-t dark:border-gray-700">
              <label className="block text-sm font-medium mb-2">Send Test Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSendingTest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-500">
            {isCreating ? 'Creating new template' : `Editing: ${template?.name}`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isCreating ? 'Create Template' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

