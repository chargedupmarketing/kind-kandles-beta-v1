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
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  HelpCircle,
  Square,
  CheckSquare
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';
import ShippingWorkflowGuide from './ShippingWorkflowGuide';

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
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  processing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{updated: number; errors?: string[]} | null>(null);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

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

  const handleToggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      // Deselect all
      setSelectedOrderIds(new Set());
    } else {
      // Select all filtered orders
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleExportOrders = async () => {
    // Determine which orders to export
    const ordersToExport = selectedOrderIds.size > 0 
      ? Array.from(selectedOrderIds)
      : filteredOrders.map(o => o.id);

    if (ordersToExport.length === 0) {
      alert('No orders to export. Try changing your filter or add some orders first.');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/orders/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ orderIds: ordersToExport })
      });

      if (response.ok) {
        // Download the CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pirateship-orders-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert(`Successfully exported ${ordersToExport.length} order(s) to CSV!`);
        // Clear selection after export
        setSelectedOrderIds(new Set());
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to export orders');
      }
    } catch (error) {
      console.error('Error exporting orders:', error);
      alert('Failed to export orders. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportTracking = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/orders/import-tracking', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token'
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        fetchOrders(); // Refresh orders list
        
        // Show success message
        if (data.errors && data.errors.length > 0) {
          alert(`Imported ${data.updated} tracking numbers with ${data.errors.length} errors. Check console for details.`);
          console.log('Import errors:', data.errors);
        } else {
          alert(`Successfully imported ${data.updated} tracking numbers!`);
        }
      } else {
        alert(data.error || 'Failed to import tracking numbers');
      }
    } catch (error) {
      console.error('Error importing tracking:', error);
      alert('Failed to import tracking numbers');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats - Scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible">
        <div className="flex-shrink-0 w-28 sm:w-auto bg-white dark:bg-slate-800 rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{orderStats.total}</p>
        </div>
        <div className="flex-shrink-0 w-28 sm:w-auto bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-300">{orderStats.pending}</p>
        </div>
        <div className="flex-shrink-0 w-28 sm:w-auto bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">Processing</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{orderStats.processing}</p>
        </div>
        <div className="flex-shrink-0 w-28 sm:w-auto bg-indigo-50 dark:bg-indigo-900/20 rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">Shipped</p>
          <p className="text-xl sm:text-2xl font-bold text-indigo-700 dark:text-indigo-300">{orderStats.shipped}</p>
        </div>
        <div className="flex-shrink-0 w-28 sm:w-auto bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">Delivered</p>
          <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{orderStats.delivered}</p>
        </div>
      </div>

      {/* Filters and Actions - Stack on mobile */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
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

        {/* Pirate Ship Export/Import Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                🚢 Pirate Ship Integration
              </p>
              <button
                onClick={() => setShowWorkflowGuide(true)}
                className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full transition-colors"
                title="View workflow guide"
              >
                <HelpCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </button>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              {selectedOrderIds.size > 0 ? (
                <span className="font-semibold">{selectedOrderIds.size} order(s) selected • </span>
              ) : null}
              Export orders to CSV, create labels in Pirate Ship, then import tracking numbers
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportOrders}
              disabled={isExporting || filteredOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>
                    {selectedOrderIds.size > 0 
                      ? `Export ${selectedOrderIds.size}` 
                      : 'Export All'}
                  </span>
                </>
              )}
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer">
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Import Tracking</span>
                </>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleImportTracking}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Order Detail Modal - Full screen on mobile */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-slate-800 w-full sm:rounded-lg shadow-xl sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl">
            {/* Sticky header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedOrder.order_number}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Customer Info - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2 text-sm">Customer</h4>
                  <p className="text-slate-900 dark:text-white">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.customer_phone}</p>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2 text-sm">Shipping Address</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedOrder.shipping_address_line1}<br />
                    {selectedOrder.shipping_address_line2 && <>{selectedOrder.shipping_address_line2}<br /></>}
                    {selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-2 text-sm">Items</h4>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 sm:p-4 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-2 text-sm">
                      <span className="text-slate-900 dark:text-white min-w-0 flex-1">
                        {item.title}
                        {item.variant_title && ` - ${item.variant_title}`}
                        <span className="text-gray-500 dark:text-gray-400"> x{item.quantity}</span>
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white flex-shrink-0">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                      <span className="text-slate-900 dark:text-white">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Discount</span>
                        <span>-{formatPrice(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                      <span className="text-slate-900 dark:text-white">{selectedOrder.shipping_cost === 0 ? 'FREE' : formatPrice(selectedOrder.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Tax</span>
                      <span className="text-slate-900 dark:text-white">{formatPrice(selectedOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base sm:text-lg pt-2 border-t border-slate-200 dark:border-slate-600">
                      <span className="text-slate-900 dark:text-white">Total</span>
                      <span className="text-teal-600 dark:text-teal-400">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Update Form */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 dark:text-white text-sm">Update Order</h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                  <select
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tracking Number</label>
                    <input
                      type="text"
                      value={updateForm.tracking_number}
                      onChange={(e) => setUpdateForm({ ...updateForm, tracking_number: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tracking URL</label>
                    <input
                      type="url"
                      value={updateForm.tracking_url}
                      onChange={(e) => setUpdateForm({ ...updateForm, tracking_url: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Internal Notes</label>
                  <textarea
                    value={updateForm.notes}
                    onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 flex flex-col sm:flex-row sm:justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleSendShippingEmail}
                disabled={!updateForm.tracking_number}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 order-2 sm:order-1"
              >
                <Mail className="h-4 w-4" />
                <span className="sm:inline">Send Shipping Email</span>
              </button>
              <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateOrder}
                  disabled={isUpdating}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders - Desktop Table / Mobile Cards */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {/* Desktop Table - Hidden on mobile */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    title={selectedOrderIds.size === filteredOrders.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0 ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Tax</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status] || Clock;
                const isSelected = selectedOrderIds.has(order.id);
                return (
                  <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 ${isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleSelectOrder(order.id)}
                        className="flex items-center justify-center w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{order.order_number}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.items.length} items</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{order.customer_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        <StatusIcon className="h-3 w-3" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 dark:text-white">{formatPrice(order.subtotal)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 dark:text-white">{formatPrice(order.tax || 0)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{formatPrice(order.total)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 rounded hover:bg-gray-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
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
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {filteredOrders.map((order) => {
            const StatusIcon = statusIcons[order.status] || Clock;
            const isExpanded = expandedOrderId === order.id;
            const isSelected = selectedOrderIds.has(order.id);
            
            return (
              <div key={order.id} className={`p-4 ${isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}>
                {/* Main card content */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleSelectOrder(order.id)}
                    className="flex items-center justify-center w-5 h-5 mt-0.5 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex-shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex items-start justify-between flex-1 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          {order.order_number}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {order.customer_name}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-semibold text-slate-900 dark:text-white">{formatPrice(order.total)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expandable details */}
                <button
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
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
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Customer</p>
                      <p className="text-sm text-slate-900 dark:text-white">{order.customer_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{order.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">Items ({order.items.length})</p>
                      {order.items.slice(0, 3).map((item) => (
                        <p key={item.id} className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {item.quantity}x {item.title}
                        </p>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          +{order.items.length - 3} more items
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 active:bg-teal-800 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      View & Edit Order
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 px-4">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No orders found</p>
          </div>
        )}
      </div>

      {/* Shipping Workflow Guide Modal */}
      {showWorkflowGuide && (
        <ShippingWorkflowGuide onClose={() => setShowWorkflowGuide(false)} />
      )}
    </div>
  );
}
