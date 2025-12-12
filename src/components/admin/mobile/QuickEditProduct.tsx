'use client';

import { useState } from 'react';
import { X, Save, Loader2, Plus, Minus, DollarSign, Package } from 'lucide-react';
import { hapticSuccess, hapticError, hapticLight } from '@/lib/haptics';

interface Product {
  id: string;
  title: string;
  price: number;
  compare_at_price?: number;
  inventory_quantity: number;
  status: 'active' | 'draft' | 'archived';
  images: { url: string }[];
}

interface QuickEditProductProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickEditProduct({ product, onClose, onSuccess }: QuickEditProductProps) {
  const [price, setPrice] = useState(product.price.toString());
  const [compareAtPrice, setCompareAtPrice] = useState(product.compare_at_price?.toString() || '');
  const [quantity, setQuantity] = useState(product.inventory_quantity);
  const [status, setStatus] = useState(product.status);
  const [loading, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleQuantityChange = (delta: number) => {
    hapticLight();
    setQuantity(prev => Math.max(0, prev + delta));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(price),
          compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
          inventory_quantity: quantity,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      hapticSuccess();
      onSuccess();
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update product. Please try again.');
      hapticError();
    } finally {
      setSaving(false);
    }
  };

  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div 
        className="bg-slate-800 w-full max-h-[85vh] rounded-t-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                }}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate max-w-[200px]">
                {product.title}
              </h2>
              <p className="text-xs text-slate-400">Quick Edit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 overflow-auto max-h-[60vh]">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Compare at Price */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Compare at Price (optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Original price"
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500"
              />
            </div>
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Stock Quantity
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity === 0}
                className="p-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Minus className="h-5 w-5 text-white" />
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-2xl font-bold focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => handleQuantityChange(1)}
                className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5 text-white" />
              </button>
            </div>
            {quantity === 0 && (
              <p className="text-xs text-red-400 mt-2">Product will show as out of stock</p>
            )}
            {quantity > 0 && quantity <= 5 && (
              <p className="text-xs text-amber-400 mt-2">Low stock warning will be shown</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['active', 'draft', 'archived'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    hapticLight();
                    setStatus(s);
                  }}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
                    status === s
                      ? s === 'active'
                        ? 'bg-green-600 text-white'
                        : s === 'draft'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

