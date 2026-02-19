'use client';

import { X, Package, Mail, Phone, MapPin, Calendar, DollarSign, Truck, Copy, CheckCircle, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

interface OrderDetailsModalProps {
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    shipping_address?: {
      name?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
    billing_address?: {
      name?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
    items?: Array<{
      id: string;
      title: string;
      quantity: number;
      price: number;
      variant_title?: string;
    }>;
    subtotal?: number;
    shipping_cost?: number;
    tax?: number;
    discount?: number;
    total: number;
    status: string;
    payment_method?: string;
    tracking_number?: string;
    tracking_url?: string;
    carrier?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
  };
  onClose: () => void;
  onUpdate?: () => void;
}

export default function OrderDetailsModal({ order, onClose, onUpdate }: OrderDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    status: order.status,
    tracking_number: order.tracking_number || '',
    tracking_url: order.tracking_url || '',
    notes: order.notes || ''
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      hapticSuccess();
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        hapticSuccess();
        setIsEditing(false);
        if (onUpdate) onUpdate();
        setTimeout(() => onClose(), 500);
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => {
              hapticLight();
              onClose();
            }}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    hapticLight();
                    setIsEditing(false);
                    setEditForm({
                      status: order.status,
                      tracking_number: order.tracking_number || '',
                      tracking_url: order.tracking_url || '',
                      notes: order.notes || ''
                    });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  hapticLight();
                  setIsEditing(true);
                }}
                className="px-4 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Edit Order
              </button>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
          <p className="text-xs text-gray-500">#{order.order_number}</p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto p-5 pb-12 space-y-8"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          minHeight: 0
        }}
      >
          {/* Status & Date */}
          <div className="bg-gray-50 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Created</span>
              <span className="text-xs text-gray-900">{formatDate(order.created_at)}</span>
            </div>
            {order.payment_method && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Payment</span>
                <span className="text-xs text-gray-900 capitalize">{order.payment_method}</span>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Customer</h3>
            <div className="bg-gray-50 rounded-lg p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900">{order.customer_name}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center justify-between">
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="flex items-center space-x-2 text-sm text-teal-600 hover:text-teal-700"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{order.customer_email}</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard(order.customer_email!, 'email')}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'email' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              )}
              {order.customer_phone && (
                <div className="flex items-center justify-between">
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="flex items-center space-x-2 text-sm text-teal-600 hover:text-teal-700"
                  >
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{order.customer_phone}</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard(order.customer_phone!, 'phone')}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'phone' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Shipping Address</h3>
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-900 space-y-0.5">
                    {order.shipping_address.name && <div>{order.shipping_address.name}</div>}
                    {order.shipping_address.line1 && <div>{order.shipping_address.line1}</div>}
                    {order.shipping_address.line2 && <div>{order.shipping_address.line2}</div>}
                    <div>
                      {[
                        order.shipping_address.city,
                        order.shipping_address.state,
                        order.shipping_address.postal_code
                      ].filter(Boolean).join(', ')}
                    </div>
                    {order.shipping_address.country && <div>{order.shipping_address.country}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Info */}
          {order.tracking_number && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Tracking</h3>
              <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                {order.carrier && (
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 capitalize">{order.carrier}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 font-mono">{order.tracking_number}</span>
                  <button
                    onClick={() => copyToClipboard(order.tracking_number!, 'tracking')}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {copiedField === 'tracking' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Track Package
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Items ({order.items.length})</h3>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      {item.variant_title && item.variant_title !== 'Default Title' && (
                        <p className="text-xs text-gray-500">{item.variant_title}</p>
                      )}
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 ml-2">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="bg-gray-50 rounded-lg p-5 space-y-4">
              {order.subtotal !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
              )}
              {order.shipping_cost !== undefined && order.shipping_cost > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              {order.tax !== undefined && order.tax > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.discount !== undefined && order.discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Update Order Section */}
          {isEditing && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Update Order</h3>
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={editForm.tracking_number}
                    onChange={(e) => setEditForm({ ...editForm, tracking_number: e.target.value })}
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                  />
                </div>

                {/* Tracking URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking URL
                  </label>
                  <input
                    type="url"
                    value={editForm.tracking_url}
                    onChange={(e) => setEditForm({ ...editForm, tracking_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                  />
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Add internal notes..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Display Notes when not editing */}
          {!isEditing && order.notes && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Order Notes</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5">
                <p className="text-sm text-blue-900 dark:text-blue-100">{order.notes}</p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

