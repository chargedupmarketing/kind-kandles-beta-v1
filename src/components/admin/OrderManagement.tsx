'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  X,
  ExternalLink
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

interface OrderItem {
  id: string;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700'
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  paid: CheckCircle,
  processing: RefreshCw,
  shipped: Truck,
  delivered: Package,
  cancelled: XCircle,
  refunded: RefreshCw
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: '',
    tracking_number: '',
    tracking_url: '',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setUpdateForm({
      status: order.status,
      tracking_number: order.tracking_number || '',
      tracking_url: order.tracking_url || '',
      notes: order.notes || ''
    });
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(updateForm)
      });

      if (response.ok) {
        fetchOrders();
        setSelectedOrder(null);
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendShippingEmail = async () => {
    if (!selectedOrder) return;
    
    try {
      const response = await fetch('/api/orders/send-shipping-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ orderId: selectedOrder.id })
      });

      if (response.ok) {
        alert('Shipping notification sent!');
      } else {
        alert('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length
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
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold">{orderStats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{orderStats.pending}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4">
          <p className="text-sm text-purple-600">Processing</p>
          <p className="text-2xl font-bold text-purple-700">{orderStats.processing}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg shadow p-4">
          <p className="text-sm text-indigo-600">Shipped</p>
          <p className="text-2xl font-bold text-indigo-700">{orderStats.shipped}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-sm text-green-600">Delivered</p>
          <p className="text-2xl font-bold text-green-700">{orderStats.delivered}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-bold">{selectedOrder.order_number}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Customer</h4>
                  <p>{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Shipping Address</h4>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.shipping_address_line1}<br />
                    {selectedOrder.shipping_address_line2 && <>{selectedOrder.shipping_address_line2}<br /></>}
                    {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.title}
                        {item.variant_title && ` - ${item.variant_title}`}
                        <span className="text-gray-500"> x{item.quantity}</span>
                      </span>
                      <span className="font-medium">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{selectedOrder.shipping_cost === 0 ? 'FREE' : formatPrice(selectedOrder.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatPrice(selectedOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-pink-600">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Form */}
              <div className="space-y-4">
                <h4 className="font-medium">Update Order</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={updateForm.tracking_number}
                      onChange={(e) => setUpdateForm({ ...updateForm, tracking_number: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tracking URL</label>
                    <input
                      type="url"
                      value={updateForm.tracking_url}
                      onChange={(e) => setUpdateForm({ ...updateForm, tracking_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Internal Notes</label>
                  <textarea
                    value={updateForm.notes}
                    onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 p-4 border-t">
              <button
                onClick={handleSendShippingEmail}
                disabled={!updateForm.tracking_number}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                Send Shipping Email
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status] || Clock;
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.items.length} items</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      <StatusIcon className="h-3 w-3" />
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

