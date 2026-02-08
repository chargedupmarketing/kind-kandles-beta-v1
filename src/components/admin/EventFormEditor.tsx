'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Settings,
  Palette,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import EventFormPreview from './EventFormPreview';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox' | 'radio' | 'rating' | 'signature';
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  max?: number;
}

interface EventFormEditorProps {
  formId?: string;
  onSave: () => void;
  onCancel: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'tel', label: 'Phone Number', icon: '📱' },
  { value: 'textarea', label: 'Text Area', icon: '📄' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'radio', label: 'Radio Buttons', icon: '🔘' },
  { value: 'rating', label: 'Star Rating', icon: '⭐' },
  { value: 'signature', label: 'Signature', icon: '✍️' },
];

const FORM_TYPES = [
  { value: 'review', label: 'Review', icon: '⭐' },
  { value: 'waiver', label: 'Waiver', icon: '📋' },
  { value: 'feedback', label: 'Feedback', icon: '💬' },
  { value: 'registration', label: 'Registration', icon: '📝' },
  { value: 'custom', label: 'Custom', icon: '🎨' },
];

const PRESET_COLORS = [
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export default function EventFormEditor({ formId, onSave, onCancel }: EventFormEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  
  // Form data
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [formType, setFormType] = useState('custom');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [submitButtonText, setSubmitButtonText] = useState('Submit');
  const [successMessage, setSuccessMessage] = useState('Thank you for your submission!');
  const [primaryColor, setPrimaryColor] = useState('#ec4899');
  const [isActive, setIsActive] = useState(true);
  const [requireEventCode, setRequireEventCode] = useState(false);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'fields' | 'design' | 'settings'>('fields');

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId]);

  const fetchForm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/event-forms/${formId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch form');
      }

      const form = data.form;
      setTitle(form.title);
      setSlug(form.slug);
      setDescription(form.description || '');
      setFormType(form.form_type);
      setFormFields(form.form_fields || []);
      setHeaderText(form.header_text || '');
      setFooterText(form.footer_text || '');
      setSubmitButtonText(form.submit_button_text || 'Submit');
      setSuccessMessage(form.success_message || 'Thank you for your submission!');
      setPrimaryColor(form.primary_color || '#ec4899');
      setIsActive(form.is_active);
      setRequireEventCode(form.require_event_code);
      setAllowMultipleSubmissions(form.allow_multiple_submissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!formId) {
      setSlug(generateSlug(value));
    }
  };

  const addField = (type?: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: (type as any) || 'text',
      label: 'New Field',
      required: false,
      placeholder: '',
    };
    setFormFields([...formFields, newField]);
    setExpandedField(newField.id);
    setActiveTab('fields');
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], ...updates };
    setFormFields(updated);
  };

  const removeField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
    setExpandedField(null);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formFields.length - 1)
    ) {
      return;
    }

    const newFields = [...formFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFormFields(newFields);
  };

  const duplicateField = (index: number) => {
    const field = formFields[index];
    const newField = {
      ...field,
      id: `field_${Date.now()}`,
      label: `${field.label} (Copy)`,
    };
    const newFields = [...formFields];
    newFields.splice(index + 1, 0, newField);
    setFormFields(newFields);
    setExpandedField(newField.id);
  };

  const handleSave = async () => {
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Form title is required');
      return;
    }

    if (!slug.trim()) {
      setError('Form slug is required');
      return;
    }

    if (formFields.length === 0) {
      setError('Please add at least one field to the form');
      return;
    }

    setIsSaving(true);

    try {
      const formData = {
        title,
        slug,
        description,
        formType,
        formFields,
        headerText,
        footerText,
        submitButtonText,
        successMessage,
        primaryColor,
        isActive,
        requireEventCode,
        allowMultipleSubmissions,
      };

      const url = formId 
        ? `/api/admin/event-forms/${formId}`
        : '/api/admin/event-forms';
      
      const method = formId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save form');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {formId ? 'Edit Form' : 'Create New Form'}
          </h2>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Preview
              </>
            )}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Form
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} overflow-auto border-r border-gray-200 dark:border-gray-700`}>
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Form Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Event Review Form"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/forms/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    placeholder="event-review"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this form"
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Form Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {FORM_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setFormType(type.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        formType === type.value
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-xs font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('fields')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'fields'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Form Fields ({formFields.length})
              </button>
              <button
                onClick={() => setActiveTab('design')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'design'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Palette className="h-4 w-4 inline mr-1" />
                Design
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-1" />
                Settings
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'fields' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Form Fields
                  </h3>
                  <div className="relative group">
                    <button
                      onClick={() => addField()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Field
                    </button>
                    
                    {/* Quick Add Dropdown */}
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <div className="p-2 space-y-1">
                        {FIELD_TYPES.map(type => (
                          <button
                            key={type.value}
                            onClick={() => addField(type.value)}
                            className="w-full px-3 py-2 text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <span className="text-lg">{type.icon}</span>
                            <span className="text-sm">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {formFields.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No fields added yet. Click "Add Field" to get started.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {FIELD_TYPES.slice(0, 4).map(type => (
                        <button
                          key={type.value}
                          onClick={() => addField(type.value)}
                          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-pink-500 transition-colors text-sm"
                        >
                          {type.icon} {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all"
                      >
                        {/* Field Header */}
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900">
                          <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                          <span className="text-lg">
                            {FIELD_TYPES.find(t => t.value === field.type)?.icon}
                          </span>
                          <span className="flex-1 font-medium text-sm">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                          <button
                            onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {expandedField === field.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Field Details */}
                        {expandedField === field.id && (
                          <div className="p-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Field Label
                                </label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateField(index, { label: e.target.value })}
                                  className="w-full px-3 py-1.5 border rounded text-sm dark:bg-gray-900 dark:border-gray-700"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Field Type
                                </label>
                                <select
                                  value={field.type}
                                  onChange={(e) => updateField(index, { type: e.target.value as any })}
                                  className="w-full px-3 py-1.5 border rounded text-sm dark:bg-gray-900 dark:border-gray-700"
                                >
                                  {FIELD_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                      {type.icon} {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'textarea') && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Placeholder
                                </label>
                                <input
                                  type="text"
                                  value={field.placeholder || ''}
                                  onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                  className="w-full px-3 py-1.5 border rounded text-sm dark:bg-gray-900 dark:border-gray-700"
                                />
                              </div>
                            )}

                            {field.type === 'radio' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Options (comma-separated)
                                </label>
                                <input
                                  type="text"
                                  value={field.options?.join(', ') || ''}
                                  onChange={(e) => updateField(index, { options: e.target.value.split(',').map(o => o.trim()) })}
                                  placeholder="Option 1, Option 2, Option 3"
                                  className="w-full px-3 py-1.5 border rounded text-sm dark:bg-gray-900 dark:border-gray-700"
                                />
                              </div>
                            )}

                            {(field.type === 'checkbox' || field.type === 'signature') && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={field.description || ''}
                                  onChange={(e) => updateField(index, { description: e.target.value })}
                                  className="w-full px-3 py-1.5 border rounded text-sm dark:bg-gray-900 dark:border-gray-700"
                                />
                              </div>
                            )}

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                className="rounded text-pink-600"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Required field
                              </span>
                            </label>

                            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => moveField(index, 'up')}
                                disabled={index === 0}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 disabled:opacity-30"
                              >
                                ↑ Move Up
                              </button>
                              <button
                                onClick={() => moveField(index, 'down')}
                                disabled={index === formFields.length - 1}
                                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 disabled:opacity-30"
                              >
                                ↓ Move Down
                              </button>
                              <button
                                onClick={() => duplicateField(index)}
                                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={() => removeField(index)}
                                className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 ml-auto"
                              >
                                <Trash2 className="h-3 w-3 inline mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Color Theme
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Color
                    </label>
                    <div className="flex gap-2 mb-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setPrimaryColor(color)}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            primaryColor === color
                              ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full h-12 border rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Text Content
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Header Text
                    </label>
                    <textarea
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      placeholder="Text to display at the top of the form"
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Footer Text
                    </label>
                    <textarea
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="Text to display at the bottom of the form"
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Submit Button Text
                      </label>
                      <input
                        type="text"
                        value={submitButtonText}
                        onChange={(e) => setSubmitButtonText(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Success Message
                      </label>
                      <input
                        type="text"
                        value={successMessage}
                        onChange={(e) => setSuccessMessage(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Form Settings
                </h3>
                
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-1 rounded text-pink-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Form is active</div>
                    <div className="text-sm text-gray-500">Allow submissions to this form</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={requireEventCode}
                    onChange={(e) => setRequireEventCode(e.target.checked)}
                    className="mt-1 rounded text-pink-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Require event code</div>
                    <div className="text-sm text-gray-500">Users must enter a code to access the form</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={allowMultipleSubmissions}
                    onChange={(e) => setAllowMultipleSubmissions(e.target.checked)}
                    className="mt-1 rounded text-pink-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Allow multiple submissions</div>
                    <div className="text-sm text-gray-500">Same user can submit multiple times</div>
                  </div>
                </label>

                {slug && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-200 mb-2 font-medium">
                      Public Form URL:
                    </p>
                    <code className="text-xs text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-900 px-3 py-2 rounded block">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/forms/{slug}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 bg-gray-100 dark:bg-gray-900">
            <EventFormPreview
              title={title}
              description={description}
              headerText={headerText}
              footerText={footerText}
              formFields={formFields}
              submitButtonText={submitButtonText}
              primaryColor={primaryColor}
              requireEventCode={requireEventCode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
