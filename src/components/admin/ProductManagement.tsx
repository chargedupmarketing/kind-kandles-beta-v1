'use client';

import { useState, useEffect } from 'react';
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
  EyeOff
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

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
  variants: any[];
  images: any[];
  collection: any;
}

interface Collection {
  id: string;
  title: string;
  handle: string;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    compare_at_price: '',
    collection_id: '',
    status: 'draft' as 'active' | 'draft' | 'archived',
    featured: false,
    tags: '',
    vendor: 'My Kind Kandles',
    product_type: '',
    weight: '',
    weight_unit: 'oz',
    inventory_quantity: '0'
  });

  useEffect(() => {
    fetchProducts();
    fetchCollections();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100');
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

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      compare_at_price: '',
      collection_id: '',
      status: 'draft',
      featured: false,
      tags: '',
      vendor: 'My Kind Kandles',
      product_type: '',
      weight: '',
      weight_unit: 'oz',
      inventory_quantity: '0'
    });
    setIsCreating(true);
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price?.toString() || '',
      collection_id: product.collection_id || '',
      status: product.status,
      featured: product.featured,
      tags: product.tags?.join(', ') || '',
      vendor: product.vendor || 'My Kind Kandles',
      product_type: product.product_type || '',
      weight: product.weight?.toString() || '',
      weight_unit: product.weight_unit || 'oz',
      inventory_quantity: product.variants?.[0]?.inventory_quantity?.toString() || '0'
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const productData = {
        title: formData.title,
        description: formData.description || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        collection_id: formData.collection_id || null,
        status: formData.status,
        featured: formData.featured,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
        vendor: formData.vendor || null,
        product_type: formData.product_type || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        weight_unit: formData.weight_unit,
        inventory_quantity: parseInt(formData.inventory_quantity) || 0
      };

      const url = isCreating 
        ? '/api/products'
        : `/api/products/${selectedProduct?.handle}`;
      
      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token' // Simplified auth for demo
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
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
    if (!confirm(`Are you sure you want to delete "${product.title}"?`)) return;

    try {
      const response = await fetch(`/api/products/${product.handle}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });

      if (response.ok) {
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-gray-600">{products.length} products</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {/* Product Form Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">
                {isCreating ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Compare at Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.compare_at_price}
                      onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Collection & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Collection</label>
                  <select
                    value={formData.collection_id}
                    onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select collection</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Inventory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Inventory Quantity</label>
                  <input
                    type="number"
                    value={formData.inventory_quantity}
                    onChange={(e) => setFormData({ ...formData, inventory_quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Product Type</label>
                  <input
                    type="text"
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    placeholder="e.g., Candle, Body Butter"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight Unit</label>
                  <select
                    value={formData.weight_unit}
                    onChange={(e) => setFormData({ ...formData, weight_unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., candle, lavender, relaxing"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Featured */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured product (show on homepage)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.title || !formData.price}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Inventory</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Price</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.images?.[0]?.url ? (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={product.images[0].url}
                          alt={product.title}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-gray-500">{product.product_type || 'No type'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-700'
                      : product.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {product.status === 'active' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${
                    (product.variants?.[0]?.inventory_quantity || 0) < 5
                      ? 'text-red-600 font-medium'
                      : 'text-gray-600'
                  }`}>
                    {product.variants?.[0]?.inventory_quantity || 0} in stock
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{formatPrice(product.price)}</p>
                    {product.compare_at_price && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatPrice(product.compare_at_price)}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded"
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
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}

