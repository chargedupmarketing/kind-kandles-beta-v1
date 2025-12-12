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
  AlertCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp
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
  { value: 'percentage', label: 'Percentage', icon: Percent, description: 'e.g., 10% off' },
  { value: 'fixed', label: 'Fixed', icon: DollarSign, description: 'e.g., $5 off' },
  { value: 'free_shipping', label: 'Free Ship', icon: Truck, description: 'No shipping cost' }
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);
  const [expandedDiscountId, setExpandedDiscountId] = useState<string | null>(null);

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
    setMobileMenuOpen(null);
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
        setMobileMenuOpen(null);
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
        setMobileMenuOpen(null);
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
    if (!discount.active) return { status: 'inactive', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
    
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return { status: 'scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      return { status: 'expired', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
    }
    if (discount.max_uses && discount.uses >= discount.max_uses) {
      return { status: 'exhausted', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' };
    }
    return { status: 'active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm sm:text-base">{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Discount Codes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.total} codes • {stats.active} active • {stats.totalUses} uses
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-lg text-sm"
        >
          <Plus className="h-5 w-5" />
          <span>Create Discount</span>
        </button>
      </div>

      {/* Filters - Stack on mobile */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search discount codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
          className="px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Create/Edit Form Modal - Full screen on mobile */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-gray-900 w-full sm:rounded-xl shadow-2xl sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-teal-500 to-blue-500">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                {isCreating ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                {isCreating ? 'Create Discount' : 'Edit Discount'}
              </h3>
              <button onClick={handleCancel} className="p-2 hover:bg-white/20 rounded-lg text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Discount Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SUMMER20"
                    className="flex-1 px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 font-mono uppercase text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-lg"
                    title="Generate random code"
                  >
                    🎲
                  </button>
                </div>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Discount Type *</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {DISCOUNT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-center ${
                        formData.type === type.value
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 ${
                        formData.type === type.value ? 'text-teal-600' : 'text-gray-400'
                      }`} />
                      <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              {formData.type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">
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
                      className={`w-full py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base ${
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
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Minimum Purchase (Optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                    placeholder="No minimum"
                  />
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Usage Limit (Optional)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              {/* Date Range - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-2.5 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm sm:text-base">Active</p>
                  <p className="text-xs sm:text-sm text-gray-500">Can be used at checkout</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    formData.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    formData.active ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : isCreating ? 'Create Code' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discounts - Desktop Table / Mobile Cards */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
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
                        <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">{discount.code}</span>
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
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        {discount.type === 'percentage' && <Percent className="h-4 w-4 text-purple-500" />}
                        {discount.type === 'fixed' && <DollarSign className="h-4 w-4 text-green-500" />}
                        {discount.type === 'free_shipping' && <Truck className="h-4 w-4 text-blue-500" />}
                        <span className="capitalize">{discount.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-teal-600">
                        {discount.type === 'percentage' ? `${discount.value}%` :
                         discount.type === 'fixed' ? formatPrice(discount.value) :
                         'Free Shipping'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-white">{discount.uses}</span>
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
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {filteredDiscounts.map((discount) => {
            const { status, color } = getDiscountStatus(discount);
            const isExpanded = expandedDiscountId === discount.id;
            
            return (
              <div key={discount.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{discount.code}</span>
                      <button
                        onClick={() => copyCode(discount.code)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {copiedCode === discount.code ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-semibold text-teal-600 text-sm">
                        {discount.type === 'percentage' ? `${discount.value}%` :
                         discount.type === 'fixed' ? formatPrice(discount.value) :
                         'Free Shipping'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Mobile Actions Menu */}
                  <div className="relative ml-2">
                    <button
                      onClick={() => setMobileMenuOpen(mobileMenuOpen === discount.id ? null : discount.id)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    
                    {mobileMenuOpen === discount.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setMobileMenuOpen(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-20 py-1">
                          <button
                            onClick={() => handleToggleActive(discount)}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2"
                          >
                            {discount.active ? (
                              <>
                                <ToggleLeft className="h-4 w-4" /> Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4" /> Activate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(discount)}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2"
                          >
                            <Edit2 className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(discount)}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setExpandedDiscountId(isExpanded ? null : discount.id)}
                  className="w-full flex items-center justify-center gap-1 mt-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show details
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Type</span>
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        {discount.type === 'percentage' && <Percent className="h-4 w-4 text-purple-500" />}
                        {discount.type === 'fixed' && <DollarSign className="h-4 w-4 text-green-500" />}
                        {discount.type === 'free_shipping' && <Truck className="h-4 w-4 text-blue-500" />}
                        <span className="capitalize">{discount.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Usage</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {discount.uses}{discount.max_uses ? ` / ${discount.max_uses}` : ' (unlimited)'}
                      </span>
                    </div>
                    {discount.min_purchase && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Min. Purchase</span>
                        <span className="text-slate-700 dark:text-slate-300">{formatPrice(discount.min_purchase)}</span>
                      </div>
                    )}
                    {discount.ends_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Expires</span>
                        <span className="text-slate-700 dark:text-slate-300">{new Date(discount.ends_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredDiscounts.length === 0 && (
          <div className="text-center py-12 sm:py-16 px-4">
            <Tag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No discount codes</h3>
            <p className="text-sm text-gray-500 mb-4">Create your first discount code to offer savings</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-teal-700 active:bg-teal-800"
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
