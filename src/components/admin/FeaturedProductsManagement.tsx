'use client';

import { useState, useEffect } from 'react';
import { 
  Star, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Search,
  Package,
  Palette,
  Type
} from 'lucide-react';

interface FeaturedCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  collectionHandle: string;
  enabled: boolean;
  order: number;
}

interface FeaturedSectionSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  tagline: string;
  show_emojis: boolean;
  categories: FeaturedCategory[];
  products_per_category: number;
  show_sale_badge: boolean;
  show_stock_alert: boolean;
  stock_alert_threshold: number;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  price: number;
  images: { url: string }[];
  collection_id: string | null;
}

interface Collection {
  id: string;
  title: string;
  handle: string;
}

const DEFAULT_SETTINGS: FeaturedSectionSettings = {
  enabled: true,
  title: 'Featured Products',
  subtitle: 'Our most beloved handmade treasures, crafted with love and flying off the shelves',
  tagline: 'Each piece tells a story of kindness',
  show_emojis: true,
  categories: [
    {
      id: 'candles',
      name: 'Candles',
      icon: '🕯️',
      color: 'from-amber-500 to-orange-500',
      collectionHandle: 'candles',
      enabled: true,
      order: 0
    },
    {
      id: 'skincare',
      name: 'Skincare',
      icon: '✨',
      color: 'from-teal-500 to-cyan-500',
      collectionHandle: 'skincare',
      enabled: true,
      order: 1
    },
    {
      id: 'body-oils',
      name: 'Body Oils',
      icon: '🌿',
      color: 'from-green-500 to-emerald-500',
      collectionHandle: 'body-oils',
      enabled: true,
      order: 2
    }
  ],
  products_per_category: 3,
  show_sale_badge: true,
  show_stock_alert: true,
  stock_alert_threshold: 5
};

const GRADIENT_OPTIONS = [
  { value: 'from-amber-500 to-orange-500', label: 'Amber/Orange', preview: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { value: 'from-teal-500 to-cyan-500', label: 'Teal/Cyan', preview: 'bg-gradient-to-r from-teal-500 to-cyan-500' },
  { value: 'from-green-500 to-emerald-500', label: 'Green/Emerald', preview: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  { value: 'from-pink-500 to-rose-500', label: 'Pink/Rose', preview: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  { value: 'from-purple-500 to-indigo-500', label: 'Purple/Indigo', preview: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
  { value: 'from-blue-500 to-cyan-500', label: 'Blue/Cyan', preview: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  { value: 'from-red-500 to-orange-500', label: 'Red/Orange', preview: 'bg-gradient-to-r from-red-500 to-orange-500' },
  { value: 'from-yellow-500 to-amber-500', label: 'Yellow/Amber', preview: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
];

const EMOJI_OPTIONS = ['🕯️', '✨', '🌿', '🌸', '💜', '🧴', '🛁', '🌺', '🍯', '🌙', '⭐', '💫', '🎁', '💝', '🌟'];

export default function FeaturedProductsManagement() {
  const [settings, setSettings] = useState<FeaturedSectionSettings>(DEFAULT_SETTINGS);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<FeaturedCategory>>({
    name: '',
    icon: '🌟',
    color: 'from-teal-500 to-cyan-500',
    collectionHandle: '',
    enabled: true
  });

  useEffect(() => {
    fetchSettings();
    fetchCollections();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/featured_products');
      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.value });
        }
      }
    } catch (error) {
      console.error('Error fetching featured products settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/settings/featured_products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ value: settings })
      });

      if (response.ok) {
        setSuccessMessage('Featured Products settings saved!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCategory = (categoryId: string, updates: Partial<FeaturedCategory>) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      )
    }));
  };

  const removeCategory = (categoryId: string) => {
    if (settings.categories.length <= 1) {
      setErrorMessage('You must have at least one category');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== categoryId)
    }));
  };

  const addCategory = () => {
    if (!newCategory.name || !newCategory.collectionHandle) {
      setErrorMessage('Please fill in all required fields');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const id = newCategory.name.toLowerCase().replace(/\s+/g, '-');
    const newCat: FeaturedCategory = {
      id,
      name: newCategory.name!,
      icon: newCategory.icon || '🌟',
      color: newCategory.color || 'from-teal-500 to-cyan-500',
      collectionHandle: newCategory.collectionHandle!,
      enabled: true,
      order: settings.categories.length
    };

    setSettings(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));

    setNewCategory({
      name: '',
      icon: '🌟',
      color: 'from-teal-500 to-cyan-500',
      collectionHandle: '',
      enabled: true
    });
    setShowAddCategory(false);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...settings.categories];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newCategories.length) return;
    
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    newCategories.forEach((cat, i) => cat.order = i);
    
    setSettings(prev => ({ ...prev, categories: newCategories }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Star className="h-7 w-7 text-amber-500" />
            Featured Products Section
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Customize the featured products carousel on the homepage
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Section Enable/Disable */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Section Visibility</h3>
              <p className="text-sm text-gray-500">Show or hide the entire featured products section</p>
            </div>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              settings.enabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {settings.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {settings.enabled ? 'Visible' : 'Hidden'}
          </button>
        </div>
      </div>

      {/* Section Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Type className="h-5 w-5 text-blue-600" />
          Section Content
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Section Title</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Featured Products"
            />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showEmojis"
                checked={settings.show_emojis}
                onChange={(e) => setSettings(prev => ({ ...prev, show_emojis: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <label htmlFor="showEmojis" className="text-sm font-medium">
                Show emojis around title (🌟)
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subtitle</label>
          <input
            type="text"
            value={settings.subtitle}
            onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Our most beloved handmade treasures..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tagline (cursive text)</label>
          <input
            type="text"
            value={settings.tagline}
            onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
            placeholder="Each piece tells a story of kindness"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Category Tabs
          </h3>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Manage the category tabs that appear in the featured products section. Drag to reorder.
        </p>

        {/* Category List */}
        <div className="space-y-3">
          {settings.categories.sort((a, b) => a.order - b.order).map((category, index) => (
            <div
              key={category.id}
              className={`border rounded-lg p-4 transition-all ${
                category.enabled 
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60'
              }`}
            >
              {editingCategory === category.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Icon</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={category.icon}
                          onChange={(e) => updateCategory(category.id, { icon: e.target.value })}
                          className="w-16 px-3 py-2 border rounded-lg text-sm text-center text-xl dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="flex flex-wrap gap-1">
                          {EMOJI_OPTIONS.slice(0, 5).map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => updateCategory(category.id, { icon: emoji })}
                              className="w-8 h-8 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Collection</label>
                      <select
                        value={category.collectionHandle}
                        onChange={(e) => updateCategory(category.id, { collectionHandle: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="">Select collection...</option>
                        {collections.map(col => (
                          <option key={col.id} value={col.handle}>{col.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2">Button Color</label>
                    <div className="flex flex-wrap gap-2">
                      {GRADIENT_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateCategory(category.id, { color: option.value })}
                          className={`w-20 h-8 rounded-lg ${option.preview} ${
                            category.color === option.value ? 'ring-2 ring-offset-2 ring-pink-500' : ''
                          }`}
                          title={option.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveCategory(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveCategory(index, 'down')}
                        disabled={index === settings.categories.length - 1}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-2xl text-white shadow-lg`}>
                      {category.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{category.name}</h4>
                      <p className="text-sm text-gray-500">Collection: {category.collectionHandle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCategory(category.id, { enabled: !category.enabled })}
                      className={`p-2 rounded-lg transition-colors ${
                        category.enabled 
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={category.enabled ? 'Hide category' : 'Show category'}
                    >
                      {category.enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => setEditingCategory(category.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => removeCategory(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove category"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Add New Category</h3>
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category Name *</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., Room Sprays"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Icon</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-16 px-3 py-3 border rounded-lg text-center text-2xl dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex flex-wrap gap-1 flex-1">
                      {EMOJI_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setNewCategory(prev => ({ ...prev, icon: emoji }))}
                          className={`w-9 h-9 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
                            newCategory.icon === emoji ? 'bg-pink-100 dark:bg-pink-900' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Collection *</label>
                  <select
                    value={newCategory.collectionHandle}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, collectionHandle: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Select a collection...</option>
                    {collections.map(col => (
                      <option key={col.id} value={col.handle}>{col.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Button Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {GRADIENT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setNewCategory(prev => ({ ...prev, color: option.value }))}
                        className={`h-10 rounded-lg ${option.preview} ${
                          newCategory.color === option.value ? 'ring-2 ring-offset-2 ring-pink-500' : ''
                        }`}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={addCategory}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-600" />
          Display Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Products Per Category</label>
            <select
              value={settings.products_per_category}
              onChange={(e) => setSettings(prev => ({ ...prev, products_per_category: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={2}>2 Products</option>
              <option value={3}>3 Products</option>
              <option value={4}>4 Products</option>
              <option value={6}>6 Products</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Low Stock Alert Threshold</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.stock_alert_threshold}
              onChange={(e) => setSettings(prev => ({ ...prev, stock_alert_threshold: parseInt(e.target.value) || 5 }))}
              className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Show "Only X left!" when stock is at or below this</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium">Show Sale Badge</p>
              <p className="text-sm text-gray-500">Display "Sale" badge on discounted products</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, show_sale_badge: !prev.show_sale_badge }))}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.show_sale_badge ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.show_sale_badge ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium">Show Stock Alerts</p>
              <p className="text-sm text-gray-500">Display "Only X left!" for low stock items</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, show_stock_alert: !prev.show_stock_alert }))}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.show_stock_alert ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                settings.show_stock_alert ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Preview</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="serif-font text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {settings.show_emojis ? '🌟 ' : ''}{settings.title}{settings.show_emojis ? ' 🌟' : ''}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{settings.subtitle}</p>
            <p className="script-font text-amber-600 text-sm mt-1">✨ {settings.tagline} ✨</p>
          </div>
          
          <div className="flex justify-center gap-3 flex-wrap">
            {settings.categories.filter(c => c.enabled).map(category => (
              <div
                key={category.id}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${category.color} text-white text-sm font-semibold shadow-lg`}
              >
                {category.icon} {category.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


