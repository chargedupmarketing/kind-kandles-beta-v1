'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Package,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  Loader,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronRight,
  Save,
  DollarSign,
  Tag,
  Weight,
  Layers,
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

interface ProductInquiry {
  id: string;
  ai_product_name: string | null;
  ai_scent_name: string | null;
  ai_product_type: string | null;
  ai_colors: string[] | null;
  ai_container_type: string | null;
  ai_size: string | null;
  image_url: string;
  image_alt_text: string | null;
  suggested_title: string | null;
  suggested_price: number | null;
  suggested_description: string | null;
  suggested_product_type: string | null;
  suggested_tags: string[] | null;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  product_id: string | null;
}

interface Collection {
  id: string;
  title: string;
  handle: string;
}

const PRODUCT_TYPE_PRESETS = [
  'Candle',
  'Body Butter',
  'Body Oil',
  'Hair Oil',
  'Room Spray',
  'Bar Soap',
  'Lotion',
  'Body Scrub',
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
};

export default function ProductInquiryJobs() {
  const [inquiries, setInquiries] = useState<ProductInquiry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<ProductInquiry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form data for converting inquiry to product
  const [formData, setFormData] = useState({
    title: '',
    productType: 'Candle',
    price: '',
    compareAtPrice: '',
    description: '',
    tags: [] as string[],
    weight: '8',
    weightUnit: 'oz',
    inventoryQuantity: '0',
    sku: '',
    featured: false,
    collectionId: '',
  });

  useEffect(() => {
    fetchInquiries();
    fetchCollections();
  }, [filterStatus, filterPriority]);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);

      const response = await fetch(`/api/admin/product-inquiries?${params}`);
      const data = await response.json();
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
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

  const handleEdit = (inquiry: ProductInquiry) => {
    setSelectedInquiry(inquiry);
    setFormData({
      title: inquiry.suggested_title || inquiry.ai_product_name || '',
      productType: inquiry.suggested_product_type || inquiry.ai_product_type || 'Candle',
      price: inquiry.suggested_price?.toString() || '',
      compareAtPrice: '',
      description: inquiry.suggested_description || (inquiry.ai_scent_name ? `Scent: ${inquiry.ai_scent_name}` : ''),
      tags: inquiry.suggested_tags || [],
      weight: '8',
      weightUnit: 'oz',
      inventoryQuantity: '0',
      sku: '',
      featured: false,
      collectionId: '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSelectedInquiry(null);
    setIsEditing(false);
  };

  const handleConvertToProduct = async () => {
    if (!selectedInquiry) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/product-inquiries/${selectedInquiry.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert inquiry');
      }

      setSuccessMessage('Product created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      handleCancel();
      fetchInquiries();
    } catch (error) {
      console.error('Error converting inquiry:', error);
      alert(error instanceof Error ? error.message : 'Failed to convert inquiry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;

    try {
      const response = await fetch(`/api/admin/product-inquiries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete inquiry');
      }

      fetchInquiries();
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      alert('Failed to delete inquiry');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/product-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      fetchInquiries();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.suggested_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.ai_product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.ai_scent_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Product Inquiry Jobs</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {inquiries.length} total • {inquiries.filter(i => i.status === 'pending').length} pending
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search inquiries..."
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
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Inquiry List or Editor */}
      {isEditing && selectedInquiry ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-500">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Complete Product Information
            </h3>
            <button onClick={handleCancel} className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* AI Detected Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">AI Detected Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedInquiry.ai_product_name && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Product Name:</span>
                    <p className="text-blue-900 dark:text-blue-100">{selectedInquiry.ai_product_name}</p>
                  </div>
                )}
                {selectedInquiry.ai_scent_name && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Scent:</span>
                    <p className="text-blue-900 dark:text-blue-100">{selectedInquiry.ai_scent_name}</p>
                  </div>
                )}
                {selectedInquiry.ai_product_type && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Type:</span>
                    <p className="text-blue-900 dark:text-blue-100">{selectedInquiry.ai_product_type}</p>
                  </div>
                )}
                {selectedInquiry.ai_container_type && (
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Container:</span>
                    <p className="text-blue-900 dark:text-blue-100">{selectedInquiry.ai_container_type}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Image
              </label>
              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={selectedInquiry.image_url}
                  alt={selectedInquiry.image_alt_text || 'Product'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="e.g., Lavender Dreams 8oz Candle"
                />
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Type *
                </label>
                <select
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  {PRODUCT_TYPE_PRESETS.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="25.00"
                  />
                </div>
              </div>

              {/* Compare At Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compare At Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="30.00"
                  />
                </div>
              </div>

              {/* Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection
                </label>
                <select
                  value={formData.collectionId}
                  onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="">No Collection</option>
                  {collections.map(collection => (
                    <option key={collection.id} value={collection.id}>{collection.title}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Product description..."
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="8"
                  />
                  <select
                    value={formData.weightUnit}
                    onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              {/* Inventory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Inventory
                </label>
                <input
                  type="number"
                  value={formData.inventoryQuantity}
                  onChange={(e) => setFormData({ ...formData, inventoryQuantity: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="0"
                />
              </div>

              {/* SKU */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Will be auto-generated if left empty"
                />
              </div>

              {/* Featured */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Feature this product
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToProduct}
                disabled={isSaving || !formData.title || !formData.price}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Creating Product...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Inquiry List */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No product inquiries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={inquiry.image_url}
                            alt={inquiry.image_alt_text || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {inquiry.suggested_title || inquiry.ai_product_name || 'Untitled'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {inquiry.suggested_product_type || inquiry.ai_product_type}
                          </p>
                          {inquiry.suggested_price && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {formatPrice(inquiry.suggested_price)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inquiry.status]}`}>
                          {inquiry.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[inquiry.priority]}`}>
                          {inquiry.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(inquiry)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Complete & Create Product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inquiry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
