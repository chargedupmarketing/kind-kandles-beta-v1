'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Loader,
  AlertCircle,
} from 'lucide-react';

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
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone Number' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'rating', label: 'Star Rating' },
  { value: 'signature', label: 'Signature' },
];

const FORM_TYPES = [
  { value: 'review', label: 'Review' },
  { value: 'waiver', label: 'Waiver' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'registration', label: 'Registration' },
  { value: 'custom', label: 'Custom' },
];

export default function EventFormEditor({ formId, onSave, onCancel }: EventFormEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
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

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
      placeholder: '',
    };
    setFormFields([...formFields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], ...updates };
    setFormFields(updated);
  };

  const removeField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {formId ? 'Edit Form' : 'Create New Form'}
        </h2>
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
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            
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
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700"
              >
                {FORM_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Form Fields</h3>
              <button
                onClick={addField}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
            </div>

            {formFields.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No fields added yet. Click "Add Field" to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {formFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Field Label"
                        className="flex-1 px-3 py-1.5 border rounded focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 text-sm"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as any })}
                        className="px-3 py-1.5 border rounded focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 text-sm"
                      >
                        {FIELD_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="rounded text-pink-600"
                        />
                        Required
                      </label>
                      <button
                        onClick={() => removeField(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'textarea') && (
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Placeholder text"
                        className="w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 text-sm"
                      />
                    )}

                    {field.type === 'radio' && (
                      <input
                        type="text"
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => updateField(index, { options: e.target.value.split(',').map(o => o.trim()) })}
                        placeholder="Options (comma-separated)"
                        className="w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 text-sm"
                      />
                    )}

                    {(field.type === 'checkbox' || field.type === 'signature') && (
                      <input
                        type="text"
                        value={field.description || ''}
                        onChange={(e) => updateField(index, { description: e.target.value })}
                        placeholder="Description or instructions"
                        className="w-full px-3 py-1.5 border rounded focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700 text-sm"
                      />
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-30"
                      >
                        ↑ Move Up
                      </button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === formFields.length - 1}
                        className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-30"
                      >
                        ↓ Move Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customization */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customization</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Header Text
              </label>
              <textarea
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="Text to display at the top of the form"
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700"
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
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full h-10 border rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Success Message
              </label>
              <input
                type="text"
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900 dark:border-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-pink-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Form is active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireEventCode}
                onChange={(e) => setRequireEventCode(e.target.checked)}
                className="rounded text-pink-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Require event code</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMultipleSubmissions}
                onChange={(e) => setAllowMultipleSubmissions(e.target.checked)}
                className="rounded text-pink-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Allow multiple submissions</span>
            </label>
          </div>

          {slug && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200 mb-2 font-medium">
                Form URL:
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 break-all">
                /forms/{slug}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
