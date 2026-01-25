'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import type { Event, EventType, LocationType, PricingModel, PriceTier } from '@/lib/types';

interface EventEditorProps {
  eventId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function EventEditor({ eventId, onSave, onCancel }: EventEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    event_type: 'workshop' as EventType,
    location_type: 'both' as LocationType,
    fixed_location_address: '',
    duration_minutes: 120,
    min_participants: 1,
    max_participants: 20,
    pricing_model: 'per_person' as PricingModel,
    base_price: 35,
    price_tiers: [] as PriceTier[],
    deposit_required: false,
    deposit_amount: 0,
    image_url: '',
    includes: [''] as string[],
    requirements: [''] as string[],
    is_active: true,
    featured: false,
  });

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/events/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch event');
      
      const data = await response.json();
      setFormData({
        ...data.event,
        includes: data.event.includes || [''],
        requirements: data.event.requirements || [''],
        price_tiers: data.event.price_tiers || [],
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      alert('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));

    // Auto-generate slug from title
    if (name === 'title' && !eventId) {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleArrayChange = (field: 'includes' | 'requirements', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const addArrayItem = (field: 'includes' | 'requirements') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: 'includes' | 'requirements', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug) {
      alert('Title and slug are required');
      return;
    }

    setSaving(true);

    try {
      // Clean up empty array items
      const cleanedData = {
        ...formData,
        includes: formData.includes.filter(item => item.trim()),
        requirements: formData.requirements.filter(item => item.trim()),
        base_price: formData.pricing_model === 'custom_quote' ? null : formData.base_price,
        price_tiers: formData.pricing_model === 'tiered' ? formData.price_tiers : null,
      };

      const url = eventId ? `/api/admin/events/${eventId}` : '/api/admin/events';
      const method = eventId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save event');
      }

      alert(eventId ? 'Event updated successfully' : 'Event created successfully');
      if (onSave) onSave();
    } catch (error: any) {
      console.error('Error saving event:', error);
      alert(error.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {eventId ? 'Edit Event' : 'Create New Event'}
        </h2>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Event'}
          </button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL: /events/{formData.slug}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type *
            </label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="workshop">Workshop</option>
              <option value="class">Class</option>
              <option value="community">Community Event</option>
              <option value="private">Private Event</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (minutes) *
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleInputChange}
              min="15"
              step="15"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Short Description
            </label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleInputChange}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Location Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Location Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location Type *
            </label>
            <select
              name="location_type"
              value={formData.location_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="mobile">Mobile (We come to you)</option>
              <option value="fixed">Fixed Location</option>
              <option value="both">Both Options</option>
            </select>
          </div>

          {(formData.location_type === 'fixed' || formData.location_type === 'both') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fixed Location Address
              </label>
              <input
                type="text"
                name="fixed_location_address"
                value={formData.fixed_location_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Capacity */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Capacity
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Participants *
            </label>
            <input
              type="number"
              name="min_participants"
              value={formData.min_participants}
              onChange={handleInputChange}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Participants *
            </label>
            <input
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleInputChange}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pricing
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pricing Model *
            </label>
            <select
              name="pricing_model"
              value={formData.pricing_model}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="per_person">Per Person</option>
              <option value="flat_rate">Flat Rate</option>
              <option value="tiered">Tiered Pricing</option>
              <option value="custom_quote">Custom Quote</option>
            </select>
          </div>

          {(formData.pricing_model === 'per_person' || formData.pricing_model === 'flat_rate') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base Price *
              </label>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="deposit_required"
              checked={formData.deposit_required}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Require Deposit
            </span>
          </label>

          {formData.deposit_required && (
            <input
              type="number"
              name="deposit_amount"
              value={formData.deposit_amount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="Deposit amount"
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          )}
        </div>
      </div>

      {/* What's Included */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          What's Included
        </h3>

        {formData.includes.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleArrayChange('includes', index, e.target.value)}
              placeholder="e.g., All supplies included"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {formData.includes.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem('includes', index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => addArrayItem('includes')}
          className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Requirements */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Requirements / Notes
        </h3>

        {formData.requirements.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
              placeholder="e.g., Minimum age 18+"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {formData.requirements.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem('requirements', index)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => addArrayItem('requirements')}
          className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Requirement
        </button>
      </div>

      {/* Settings */}
      <div className="card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Settings
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Active (visible to customers)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Featured Event
            </span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : eventId ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}
