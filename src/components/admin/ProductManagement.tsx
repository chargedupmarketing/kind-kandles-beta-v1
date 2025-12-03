'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Package,
  DollarSign,
  Tag,
  Save,
  X,
  Upload,
  Eye,
  EyeOff,
  ImagePlus,
  GripVertical,
  Copy,
  ExternalLink,
  AlertCircle,
  Check,
  Flame,
  Sparkles,
  Clock,
  Weight,
  Layers
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

interface ProductVariant {
  id?: string;
  title: string;
  sku: string;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  weight: number | null;
  weight_unit: string;
  option1_name: string | null;
  option1_value: string | null;
  option2_name: string | null;
  option2_value: string | null;
  available_for_sale: boolean;
}

interface ProductImage {
  id?: string;
  url: string;
  alt_text: string;
  position: number;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  collection_id: string | null;
  tags: string[] | null;
  vendor: string | null;
  product_type: string | null;
  weight: number | null;
  weight_unit: string;
  created_at: string;
  variants: ProductVariant[];
  images: ProductImage[];
  collection?: { title: string };
}

interface Collection {
  id: string;
  title: string;
  handle: string;
}

// Product type presets for candle business
const PRODUCT_TYPE_PRESETS = [
  { value: 'candle', label: '🕯️ Candle', tags: ['candle', 'handmade'] },
  { value: 'body-butter', label: '✨ Body Butter', tags: ['skincare', 'body-butter', 'handmade'] },
  { value: 'body-oil', label: '🌿 Body Oil', tags: ['skincare', 'body-oil', 'natural'] },
  { value: 'room-spray', label: '🌸 Room Spray', tags: ['room-spray', 'fragrance'] },
  { value: 'bar-soap', label: '🧼 Bar Soap', tags: ['skincare', 'soap', 'handmade'] },
  { value: 'lotion', label: '🧴 Lotion', tags: ['skincare', 'lotion', 'handmade'] },
  { value: 'body-scrub', label: '✨ Body Scrub', tags: ['skincare', 'body-scrub', 'exfoliating'] },
  { value: 'other', label: '📦 Other', tags: [] },
];

// Scent profiles for candles
const SCENT_PROFILES = [
  { value: 'fresh', label: '🌊 Fresh', color: 'bg-blue-100 text-blue-700' },
  { value: 'floral', label: '🌸 Floral', color: 'bg-pink-100 text-pink-700' },
  { value: 'woodsy', label: '🌲 Woodsy', color: 'bg-green-100 text-green-700' },
  { value: 'sweet', label: '🍯 Sweet', color: 'bg-amber-100 text-amber-700' },
  { value: 'citrus', label: '🍋 Citrus', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'herbal', label: '🌿 Herbal', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'earthy', label: '🍂 Earthy', color: 'bg-orange-100 text-orange-700' },
];

// Burn time options for candles
const BURN_TIME_OPTIONS = [
  '20 hours', '30 hours', '40 hours', '45 hours', '50 hours', '60 hours', '70+ hours'
];

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCollection, setFilterCollection] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'images' | 'seo'>('basic');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    compare_at_price: '',
    collection_id: '',
    status: 'draft' as 'active' | 'draft' | 'archived',
    featured: false,
    tags: [] as string[],
    vendor: 'My Kind Kandles',
    product_type: '',
    weight: '',
    weight_unit: 'oz',
    // Variant data
    sku: '',
    inventory_quantity: '0',
    variant_title: 'Default Title',
    // Candle-specific
    scent_profile: '',
    burn_time: '',
    // Images
    images: [] as { url: string; alt_text: string }[],
    image_url: '', // For adding new image
  });

  useEffect(() => {
    fetchProducts();
    fetchCollections();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100&include_all=true');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const generateHandle = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      compare_at_price: '',
      collection_id: '',
      status: 'draft',
      featured: false,
      tags: [],
      vendor: 'My Kind Kandles',
      product_type: '',
      weight: '',
      weight_unit: 'oz',
      sku: '',
      inventory_quantity: '0',
      variant_title: 'Default Title',
      scent_profile: '',
      burn_time: '',
      images: [],
      image_url: '',
    });
    setActiveTab('basic');
    setIsCreating(true);
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    
    // Extract scent profile and burn time from tags
    const scentTag = product.tags?.find(t => SCENT_PROFILES.some(s => s.value === t.toLowerCase()));
    const burnTimeTag = product.tags?.find(t => t.toLowerCase().includes('hour'));
    
    setFormData({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      collection_id: product.collection_id || '',
      status: product.status,
      featured: product.featured,
      tags: product.tags?.filter(t => 
        !SCENT_PROFILES.some(s => s.value === t.toLowerCase()) && 
        !t.toLowerCase().includes('hour')
      ) || [],
      vendor: product.vendor || 'My Kind Kandles',
      product_type: product.product_type || '',
      weight: product.weight?.toString() || '',
      weight_unit: product.weight_unit || 'oz',
      sku: product.variants?.[0]?.sku || '',
      inventory_quantity: product.variants?.[0]?.inventory_quantity?.toString() || '0',
      variant_title: product.variants?.[0]?.title || 'Default Title',
      scent_profile: scentTag?.toLowerCase() || '',
      burn_time: burnTimeTag || '',
      images: product.images?.map(img => ({ url: img.url, alt_text: img.alt_text || '' })) || [],
      image_url: '',
    });
    setActiveTab('basic');
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleProductTypeSelect = (preset: typeof PRODUCT_TYPE_PRESETS[0]) => {
    const newTags = [...new Set([...formData.tags, ...preset.tags])];
    setFormData({ 
      ...formData, 
      product_type: preset.label.replace(/[^\w\s-]/g, '').trim(),
      tags: newTags
    });
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag.toLowerCase())) {
      setFormData({ ...formData, tags: [...formData.tags, tag.toLowerCase()] });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addImage = () => {
    if (formData.image_url) {
      setFormData({
        ...formData,
        images: [...formData.images, { url: formData.image_url, alt_text: formData.title }],
        image_url: ''
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.price) {
      alert('Title and price are required');
      return;
    }

    setIsSaving(true);
    try {
      // Combine all tags including scent profile and burn time
      const allTags = [...formData.tags];
      if (formData.scent_profile) allTags.push(formData.scent_profile);
      if (formData.burn_time) allTags.push(formData.burn_time);

      const productData = {
        title: formData.title,
        handle: generateHandle(formData.title),
        description: formData.description || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        collection_id: formData.collection_id || null,
        status: formData.status,
        featured: formData.featured,
        tags: allTags.length > 0 ? allTags : null,
        vendor: formData.vendor || null,
        product_type: formData.product_type || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        weight_unit: formData.weight_unit,
        // Variant data
        variant: {
          title: formData.variant_title || 'Default Title',
          sku: formData.sku || null,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          inventory_quantity: parseInt(formData.inventory_quantity) || 0,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          weight_unit: formData.weight_unit,
        },
        // Images
        images: formData.images,
      };

      const url = isCreating 
        ? '/api/products'
        : `/api/products/${selectedProduct?.handle}`;
      
      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        setSuccessMessage(isCreating ? 'Product created successfully!' : 'Product updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
        setIsEditing(false);
        setIsCreating(false);
        setSelectedProduct(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/products/${product.handle}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });

      if (response.ok) {
        setSuccessMessage('Product deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleDuplicate = (product: Product) => {
    setFormData({
      title: `${product.title} (Copy)`,
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      collection_id: product.collection_id || '',
      status: 'draft',
      featured: false,
      tags: product.tags || [],
      vendor: product.vendor || 'My Kind Kandles',
      product_type: product.product_type || '',
      weight: product.weight?.toString() || '',
      weight_unit: product.weight_unit || 'oz',
      sku: '',
      inventory_quantity: '0',
      variant_title: 'Default Title',
      scent_profile: '',
      burn_time: '',
      images: product.images?.map(img => ({ url: img.url, alt_text: img.alt_text || '' })) || [],
      image_url: '',
    });
    setActiveTab('basic');
    setIsCreating(true);
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedProduct(null);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants?.[0]?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesCollection = filterCollection === 'all' || p.collection_id === filterCollection;
    return matchesSearch && matchesStatus && matchesCollection;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <Check className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {products.length} total • {products.filter(p => p.status === 'active').length} active
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filterCollection}
          onChange={(e) => setFilterCollection(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Product Form Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-500">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {isCreating ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                {isCreating ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button onClick={handleCancel} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {[
                { id: 'basic', label: 'Basic Info', icon: Package },
                { id: 'variants', label: 'Inventory & Pricing', icon: Layers },
                { id: 'images', label: 'Images', icon: ImagePlus },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-pink-600 border-b-2 border-pink-600 bg-white dark:bg-gray-900'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Calm Down Girl - Eucalyptus & Spearmint Candle"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 text-lg"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Handle: {generateHandle(formData.title) || 'product-handle'}
                    </p>
                  </div>

                  {/* Product Type Quick Select */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Product Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCT_TYPE_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handleProductTypeSelect(preset)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            formData.product_type?.toLowerCase().includes(preset.value)
                              ? 'bg-pink-600 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Describe your product in detail. Include scent notes, ingredients, benefits..."
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>

                  {/* Collection & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Collection
                      </label>
                      <select
                        value={formData.collection_id}
                        onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="">Select collection</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="draft">🔒 Draft (Hidden)</option>
                        <option value="active">✅ Active (Visible)</option>
                        <option value="archived">📦 Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Candle-specific: Scent Profile */}
                  {formData.product_type?.toLowerCase().includes('candle') && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <Sparkles className="inline h-4 w-4 mr-1" />
                        Scent Profile
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SCENT_PROFILES.map((scent) => (
                          <button
                            key={scent.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, scent_profile: scent.value })}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              formData.scent_profile === scent.value
                                ? `${scent.color} ring-2 ring-offset-2 ring-pink-500`
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {scent.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Candle-specific: Burn Time */}
                  {formData.product_type?.toLowerCase().includes('candle') && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Burn Time
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {BURN_TIME_OPTIONS.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setFormData({ ...formData, burn_time: time })}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              formData.burn_time === time
                                ? 'bg-amber-500 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            🕯️ {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <Tag className="inline h-4 w-4 mr-1" />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-pink-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a tag and press Enter"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Suggested: handmade, natural, vegan, soy-wax, limited-edition
                    </p>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-5 h-5 rounded text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="featured" className="flex items-center gap-2 cursor-pointer">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Featured Product</span>
                      <span className="text-sm text-gray-500">(Show on homepage)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Inventory & Pricing Tab */}
              {activeTab === 'variants' && (
                <div className="space-y-6">
                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Price *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 text-lg font-semibold"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Compare at Price <span className="text-gray-400">(Original)</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.compare_at_price}
                          onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                          placeholder="Leave empty if not on sale"
                          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                        />
                      </div>
                      {formData.compare_at_price && parseFloat(formData.compare_at_price) > parseFloat(formData.price) && (
                        <p className="mt-1 text-sm text-green-600 font-medium">
                          💰 {Math.round((1 - parseFloat(formData.price) / parseFloat(formData.compare_at_price)) * 100)}% off
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SKU & Inventory */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        SKU (Stock Keeping Unit)
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        placeholder="e.g., CDG-EUC-8OZ"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Inventory Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.inventory_quantity}
                        onChange={(e) => setFormData({ ...formData, inventory_quantity: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 text-lg font-semibold"
                      />
                      {parseInt(formData.inventory_quantity) < 5 && parseInt(formData.inventory_quantity) > 0 && (
                        <p className="mt-1 text-sm text-orange-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Low stock warning
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <Weight className="inline h-4 w-4 mr-1" />
                        Weight
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="e.g., 8"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Weight Unit
                      </label>
                      <select
                        value={formData.weight_unit}
                        onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="oz">Ounces (oz)</option>
                        <option value="lb">Pounds (lb)</option>
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                      </select>
                    </div>
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Vendor
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>
              )}

              {/* Images Tab */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Add Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={addImage}
                        disabled={!formData.image_url}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Tip: Upload images to a service like Imgur, Cloudinary, or use Supabase Storage
                    </p>
                  </div>

                  {/* Image Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.alt_text || formData.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {formData.images.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg text-gray-400">
                        <ImagePlus className="h-12 w-12 mb-2" />
                        <p>No images added yet</p>
                        <p className="text-sm">Add image URLs above</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="text-sm text-gray-500">
                {isCreating ? 'Creating new product' : `Editing: ${selectedProduct?.title}`}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.title || !formData.price}
                  className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isCreating ? 'Create Product' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Inventory</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Price</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.images?.[0]?.url ? (
                      <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={product.images[0].url}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.title}</p>
                      <p className="text-sm text-gray-500">
                        {product.product_type || 'No type'} • SKU: {product.variants?.[0]?.sku || 'N/A'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : product.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {product.status === 'active' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {product.status}
                  </span>
                  {product.featured && (
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Flame className="h-3 w-3" />
                      Featured
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${
                    (product.variants?.[0]?.inventory_quantity || 0) === 0
                      ? 'text-red-600'
                      : (product.variants?.[0]?.inventory_quantity || 0) < 5
                      ? 'text-orange-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {product.variants?.[0]?.inventory_quantity || 0} in stock
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(product.price)}</p>
                    {product.compare_at_price && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatPrice(product.compare_at_price)}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <a
                      href={`/products/${product.handle}`}
                      target="_blank"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="View"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                    </a>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterStatus !== 'all' || filterCollection !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first product'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterCollection === 'all' && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Your First Product
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
