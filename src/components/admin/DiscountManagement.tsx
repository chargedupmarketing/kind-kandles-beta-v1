'use client';

import { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Percent,
  DollarSign,
  Truck,
  Calendar,
  Users,
  Check,
  X,
  Copy,
  ToggleLeft,
  ToggleRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  min_purchase: number | null;
  max_uses: number | null;
  uses: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Off', icon: Percent, description: 'e.g., 10% off' },
  { value: 'fixed', label: 'Fixed Amount', icon: DollarSign, description: 'e.g., $5 off' },
  { value: 'free_shipping', label: 'Free Shipping', icon: Truck, description: 'No shipping cost' }
];

export default function DiscountManagement() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    value: '',
    min_purchase: '',
    max_uses: '',
    starts_at: '',
    ends_at: '',
    active: true
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await fetch('/api/discounts', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });
      const data = await response.json();
      setDiscounts(data.discounts || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'MKK';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleCreate = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      min_purchase: '',
      max_uses: '',
      starts_at: '',
      ends_at: '',
      active: true
    });
    generateCode();
    setIsCreating(true);
    setIsEditing(false);
    setSelectedDiscount(null);
  };

  const handleEdit = (discount: DiscountCode) => {
    setSelectedDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      min_purchase: discount.min_purchase?.toString() || '',
      max_uses: discount.max_uses?.toString() || '',
      starts_at: discount.starts_at ? new Date(discount.starts_at).toISOString().slice(0, 16) : '',
      ends_at: discount.ends_at ? new Date(discount.ends_at).toISOString().slice(0, 16) : '',
      active: discount.active
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!formData.code || (!formData.value && formData.type !== 'free_shipping')) {
      alert('Code and value are required');
      return;
    }

    setIsSaving(true);
    try {
      const discountData = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.type === 'free_shipping' ? 0 : parseFloat(formData.value),
        min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        active: formData.active
      };

      const url = isCreating 
        ? '/api/discounts'
        : `/api/discounts/${selectedDiscount?.id}`;
      
      const method = isCreating ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(discountData)
      });

      if (response.ok) {
        setSuccessMessage(isCreating ? 'Discount code created!' : 'Discount code updated!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDiscounts();
        setIsEditing(false);
        setIsCreating(false);
        setSelectedDiscount(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save discount');
      }
    } catch (error) {
      console.error('Error saving discount:', error);
      alert('Failed to save discount');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (discount: DiscountCode) => {
    if (!confirm(`Delete discount code "${discount.code}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/discounts/${discount.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });

      if (response.ok) {
        setSuccessMessage('Discount code deleted!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchDiscounts();
      } else {
        alert('Failed to delete discount');
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Failed to delete discount');
    }
  };

  const handleToggleActive = async (discount: DiscountCode) => {
    try {
      const response = await fetch(`/api/discounts/${discount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ active: !discount.active })
      });

      if (response.ok) {
        fetchDiscounts();
      }
    } catch (error) {
      console.error('Error toggling discount:', error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedDiscount(null);
  };

  const getDiscountStatus = (discount: DiscountCode) => {
    if (!discount.active) return { status: 'inactive', color: 'bg-gray-100 text-gray-700' };
    
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return { status: 'scheduled', color: 'bg-blue-100 text-blue-700' };
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      return { status: 'expired', color: 'bg-red-100 text-red-700' };
    }
    if (discount.max_uses && discount.uses >= discount.max_uses) {
      return { status: 'exhausted', color: 'bg-orange-100 text-orange-700' };
    }
    return { status: 'active', color: 'bg-green-100 text-green-700' };
  };

  const filteredDiscounts = discounts.filter(d => {
    const matchesSearch = d.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && d.active) ||
      (filterActive === 'inactive' && !d.active);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: discounts.length,
    active: discounts.filter(d => d.active).length,
    totalUses: discounts.reduce((sum, d) => sum + d.uses, 0)
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Discount Codes</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {stats.total} codes • {stats.active} active • {stats.totalUses} total uses
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Create Discount
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search discount codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Create/Edit Form Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-500">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {isCreating ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                {isCreating ? 'Create Discount Code' : 'Edit Discount Code'}
              </h3>
              <button onClick={handleCancel} className="p-2 hover:bg-white/20 rounded-lg text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Discount Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SUMMER20"
                    className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 font-mono uppercase"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Generate random code"
                  >
                    🎲
                  </button>
                </div>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Discount Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {DISCOUNT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        formData.type === type.value
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className={`h-6 w-6 mx-auto mb-2 ${
                        formData.type === type.value ? 'text-pink-600' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              {formData.type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.type === 'percentage' ? 'Percentage Off *' : 'Amount Off *'}
                  </label>
                  <div className="relative">
                    {formData.type === 'percentage' ? (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    )}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.type === 'percentage' ? 100 : undefined}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className={`w-full py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 ${
                        formData.type === 'percentage' ? 'px-4 pr-10' : 'pl-10 pr-4'
                      }`}
                      placeholder={formData.type === 'percentage' ? '10' : '5.00'}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Minimum Purchase */}
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Purchase (Optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="No minimum"
                  />
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium mb-2">Usage Limit (Optional)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Active</p>
                  <p className="text-sm text-gray-500">Customers can use this code at checkout</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    formData.active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    formData.active ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : isCreating ? 'Create Code' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discounts Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Code</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Value</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Usage</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {filteredDiscounts.map((discount) => {
              const { status, color } = getDiscountStatus(discount);
              return (
                <tr key={discount.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">{discount.code}</span>
                      <button
                        onClick={() => copyCode(discount.code)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Copy code"
                      >
                        {copiedCode === discount.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {discount.min_purchase && (
                      <p className="text-xs text-gray-500 mt-1">
                        Min. purchase: {formatPrice(discount.min_purchase)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {discount.type === 'percentage' && <Percent className="h-4 w-4 text-purple-500" />}
                      {discount.type === 'fixed' && <DollarSign className="h-4 w-4 text-green-500" />}
                      {discount.type === 'free_shipping' && <Truck className="h-4 w-4 text-blue-500" />}
                      <span className="capitalize">{discount.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-pink-600">
                      {discount.type === 'percentage' ? `${discount.value}%` :
                       discount.type === 'fixed' ? formatPrice(discount.value) :
                       'Free Shipping'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{discount.uses}</span>
                    {discount.max_uses && (
                      <span className="text-gray-500"> / {discount.max_uses}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
                      {status}
                    </span>
                    {discount.ends_at && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(discount.ends_at).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleActive(discount)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        title={discount.active ? 'Deactivate' : 'Activate'}
                      >
                        {discount.active ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(discount)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(discount)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredDiscounts.length === 0 && (
          <div className="text-center py-16">
            <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No discount codes</h3>
            <p className="text-gray-500 mb-4">Create your first discount code to offer savings to customers</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700"
            >
              <Plus className="h-5 w-5" />
              Create Discount Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

