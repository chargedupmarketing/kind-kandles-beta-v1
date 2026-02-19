'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Truck,
  CheckCircle,
  Clock,
  RefreshCw,
  Mail,
  X,
  ExternalLink,
  Printer,
  ClipboardList,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  User,
  Download,
  Upload,
  Scale,
  MessageSquare
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';
import CSVImportModal from './CSVImportModal';
import InventoryAlertBadge, { InventoryAlert } from './InventoryAlertBadge';
import OrderNotesPanel, { OrderNote, OrderNotesBadge } from './OrderNotesPanel';
import BatchActionBar, { OrderCheckbox, SelectAllCheckbox } from './BatchActionBar';
import OrderFilters, { OrderFiltersState, QuickFilters, DEFAULT_FILTERS } from './OrderFilters';
import { formatWeight, getWeightSourceLabel } from '@/hooks/useOrderWeight';

interface OrderItem {
  id: string;
  product_id?: string;
  variant_id?: string;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: number;
  total: number;
  sku: string | null;
  weight?: number;
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
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'on_hold' | 'fulfilled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

interface WeightInfo {
  weightOz: number;
  source: string;
  hasUnknownWeights: boolean;
}

const priorityOrder = ['pending', 'paid', 'processing'];

export default function OrderFulfillment() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Selection state for batch operations
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Filter state
  const [filters, setFilters] = useState<OrderFiltersState>(DEFAULT_FILTERS);

  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fulfillment form state
  const [fulfillmentForm, setFulfillmentForm] = useState({
    tracking_number: '',
    tracking_url: '',
    carrier: 'usps',
    notes: ''
  });

  // Inventory alerts cache
  const [inventoryAlerts, setInventoryAlerts] = useState<Record<string, InventoryAlert[]>>({});
  
  // Order notes cache
  const [orderNotes, setOrderNotes] = useState<Record<string, OrderNote[]>>({});

  // Weight data cache
  const [orderWeights, setOrderWeights] = useState<Record<string, WeightInfo>>({});

  // Products list for filters
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/orders?status=pending,paid,processing,on_hold', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const sortedOrders = (data.orders || data || []).sort((a: Order, b: Order) => {
          const aPriority = priorityOrder.indexOf(a.status);
          const bPriority = priorityOrder.indexOf(b.status);
          if (aPriority !== -1 && bPriority !== -1 && aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setOrders(sortedOrders);
        
        // Fetch inventory alerts for all orders
        if (sortedOrders.length > 0) {
          fetchInventoryAlerts(sortedOrders.map((o: Order) => o.id));
          calculateWeights(sortedOrders);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setErrorMessage('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100');
      if (response.ok) {
        const data = await response.json();
        setProducts((data.products || data || []).map((p: any) => ({ id: p.id, title: p.title })));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInventoryAlerts = async (orderIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/orders/inventory-check?order_ids=${orderIds.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        const alertsMap: Record<string, InventoryAlert[]> = {};
        for (const [orderId, orderData] of Object.entries(data.orders || {})) {
          alertsMap[orderId] = (orderData as any).alerts || [];
        }
        setInventoryAlerts(alertsMap);
      }
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
    }
  };

  const calculateWeights = async (orderList: Order[]) => {
    // Calculate weights based on order items
    const weights: Record<string, WeightInfo> = {};
    const PACKAGING_WEIGHT_OZ = 4;
    const DEFAULT_ITEM_WEIGHT_OZ = 12;

    for (const order of orderList) {
      const items = Array.isArray(order.items) ? order.items : [];
      let totalWeight = PACKAGING_WEIGHT_OZ;
      let hasUnknown = false;

      for (const item of items) {
        if (item.weight) {
          totalWeight += item.weight * item.quantity;
        } else {
          totalWeight += DEFAULT_ITEM_WEIGHT_OZ * item.quantity;
          hasUnknown = true;
        }
      }

      weights[order.id] = {
        weightOz: totalWeight,
        source: hasUnknown ? 'estimated' : 'from product data',
        hasUnknownWeights: hasUnknown,
      };
    }

    setOrderWeights(weights);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleMarkProcessing = async (order: Order) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ status: 'processing' })
      });

      if (response.ok) {
        setSuccessMessage(`Order ${order.order_number} marked as processing`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchOrders();
      } else {
        setErrorMessage('Failed to update order');
      }
    } catch (error) {
      setErrorMessage('Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShipOrder = async (order: Order) => {
    if (!fulfillmentForm.tracking_number) {
      setErrorMessage('Please enter a tracking number');
      return;
    }

    setIsUpdating(true);
    try {
      let trackingUrl = fulfillmentForm.tracking_url;
      if (!trackingUrl && fulfillmentForm.tracking_number) {
        switch (fulfillmentForm.carrier) {
          case 'usps':
            trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${fulfillmentForm.tracking_number}`;
            break;
          case 'ups':
            trackingUrl = `https://www.ups.com/track?tracknum=${fulfillmentForm.tracking_number}`;
            break;
          case 'fedex':
            trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${fulfillmentForm.tracking_number}`;
            break;
          case 'dhl':
            trackingUrl = `https://www.dhl.com/en/express/tracking.html?AWB=${fulfillmentForm.tracking_number}`;
            break;
        }
      }

      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          status: 'shipped',
          tracking_number: fulfillmentForm.tracking_number,
          tracking_url: trackingUrl,
          notes: fulfillmentForm.notes || order.notes,
          send_notification: true
        })
      });

      if (response.ok) {
        setSuccessMessage(`Order ${order.order_number} shipped! Customer has been notified.`);
        setTimeout(() => setSuccessMessage(''), 5000);
        setSelectedOrder(null);
        setFulfillmentForm({ tracking_number: '', tracking_url: '', carrier: 'usps', notes: '' });
        fetchOrders();
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to ship order');
      }
    } catch (error) {
      setErrorMessage('Failed to ship order');
    } finally {
      setIsUpdating(false);
    }
  };

  // Batch operations
  const handleBatchExport = async (ids: string[], format: 'pirateship' | 'detailed') => {
    try {
      const response = await fetch('/api/admin/orders/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ orderIds: ids, format })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${format}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccessMessage(`Exported ${ids.length} orders`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to export orders');
      }
    } catch (error) {
      setErrorMessage('Failed to export orders');
    }
  };

  const handleBatchUpdateStatus = async (ids: string[], status: string) => {
    try {
      let successCount = 0;
      for (const id of ids) {
        const response = await fetch(`/api/orders/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token'
          },
          body: JSON.stringify({ status })
        });
        if (response.ok) successCount++;
      }

      setSuccessMessage(`Updated ${successCount} of ${ids.length} orders to ${status}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (error) {
      setErrorMessage('Failed to update orders');
    }
  };

  const handleImportComplete = (results: { updated: number; errors: string[] }) => {
    if (results.updated > 0) {
      setSuccessMessage(`Successfully updated ${results.updated} orders with tracking`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchOrders();
    }
    if (results.errors.length > 0) {
      setErrorMessage(`${results.errors.length} orders failed to update`);
    }
  };

  // Selection handlers
  const toggleOrderSelection = useCallback((orderId: string, selected: boolean) => {
    setSelectedOrderIds(prev => 
      selected 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  }, []);

  const toggleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  }, []);

  // Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          order.order_number.toLowerCase().includes(query) ||
          order.customer_name.toLowerCase().includes(query) ||
          order.customer_email.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(order.status)) {
        return false;
      }

      // Date range
      if (filters.dateFrom) {
        const orderDate = new Date(order.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (orderDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const orderDate = new Date(order.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) return false;
      }

      // Total range
      if (filters.minTotal && order.total < parseFloat(filters.minTotal)) {
        return false;
      }
      if (filters.maxTotal && order.total > parseFloat(filters.maxTotal)) {
        return false;
      }

      // Product filter
      if (filters.products.length > 0) {
        const orderProductIds = order.items.map(i => i.product_id).filter(Boolean);
        const hasProduct = filters.products.some(pid => orderProductIds.includes(pid));
        if (!hasProduct) return false;
      }

      // Has notes filter
      if (filters.hasNotes) {
        const notes = orderNotes[order.id] || [];
        if (notes.length === 0 && !order.notes) return false;
      }

      // Low inventory filter
      if (filters.lowInventory) {
        const alerts = inventoryAlerts[order.id] || [];
        const hasIssues = alerts.some(a => a.status !== 'ok');
        if (!hasIssues) return false;
      }

      return true;
    });
  }, [orders, filters, orderNotes, inventoryAlerts]);

  // Stats
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'paid').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50',
      paid: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
      processing: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
      on_hold: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50',
      shipped: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50',
      fulfilled: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.status.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.minTotal || filters.maxTotal) count++;
    if (filters.products.length > 0) count++;
    if (filters.hasNotes) count++;
    if (filters.lowInventory) count++;
    return count;
  }, [filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
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
          <button onClick={() => setErrorMessage('')} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-gray-700" />
            Order Fulfillment
          </h2>
          <p className="text-gray-600 mt-1">
            Process and ship pending orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Import Tracking
          </button>
          <button
            onClick={() => handleBatchExport(filteredOrders.map(o => o.id), 'pirateship')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export to Pirate Ship
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-sm text-amber-600">Awaiting Processing</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{processingCount}</p>
              <p className="text-sm text-purple-600">Being Prepared</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Truck className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{orders.length}</p>
              <p className="text-sm text-gray-600">Total to Fulfill</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <QuickFilters 
        currentStatus={filters.status}
        onFilterChange={(status) => setFilters({ ...filters, status })}
      />

      {/* Advanced Filters */}
      <OrderFilters
        filters={filters}
        onFiltersChange={setFilters}
        products={products}
        activeFilterCount={activeFilterCount}
      />

      {/* Select All */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between">
          <SelectAllCheckbox
            checked={selectedOrderIds.length === filteredOrders.length}
            indeterminate={selectedOrderIds.length > 0 && selectedOrderIds.length < filteredOrders.length}
            onChange={toggleSelectAll}
            label={`Select all ${filteredOrders.length} orders`}
          />
          <span className="text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">
            No orders waiting to be fulfilled. Great job!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders.includes(order.id);
            const isSelected = selectedOrderIds.includes(order.id);
            const alerts = inventoryAlerts[order.id] || [];
            const weight = orderWeights[order.id];
            const notes = orderNotes[order.id] || [];
            
            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-xl shadow border overflow-hidden transition-colors ${
                  isSelected ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200'
                }`}
              >
                {/* Order Header */}
                <div className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <OrderCheckbox
                        checked={isSelected}
                        onChange={(checked) => toggleOrderSelection(order.id, checked)}
                      />
                    </div>

                    {/* Main content - clickable */}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                            <span className="font-bold text-lg">{order.order_number}</span>
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadge(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(order.total)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                          </span>
                        </div>
                      </div>

                      {/* Order meta info */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {order.customer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {order.customer_email}
                        </span>
                        
                        {/* Weight display */}
                        {weight && (
                          <span 
                            className={`flex items-center gap-1 ${weight.hasUnknownWeights ? 'text-amber-600' : 'text-gray-600'}`}
                            title={weight.source}
                          >
                            <Scale className="h-4 w-4" />
                            {formatWeight(weight.weightOz)}
                            {weight.hasUnknownWeights && (
                              <span className="text-xs">(est.)</span>
                            )}
                          </span>
                        )}

                        {/* Inventory alerts badge */}
                        {alerts.length > 0 && (
                          <InventoryAlertBadge alerts={alerts} compact />
                        )}

                        {/* Notes badge */}
                        {(notes.length > 0 || order.notes) && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <MessageSquare className="h-4 w-4" />
                            {notes.length > 0 ? notes.length : 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Items List */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Order Items
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div 
                              key={item.id || index} 
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{item.title}</p>
                                {item.variant_title && (
                                  <p className="text-sm text-gray-500">{item.variant_title}</p>
                                )}
                                {item.sku && (
                                  <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">x{item.quantity}</p>
                                <p className="text-sm text-gray-500">{formatPrice(item.total)}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Inventory Alerts */}
                        {alerts.length > 0 && alerts.some(a => a.status !== 'ok') && (
                          <div className="mt-4">
                            <InventoryAlertBadge alerts={alerts} showDetails />
                          </div>
                        )}
                      </div>

                      {/* Shipping Address */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Ship To
                        </h4>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-gray-600">{order.shipping_address_line1}</p>
                          {order.shipping_address_line2 && (
                            <p className="text-gray-600">{order.shipping_address_line2}</p>
                          )}
                          <p className="text-gray-600">
                            {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                          </p>
                          <p className="text-gray-600">{order.shipping_country}</p>
                          {order.customer_phone && (
                            <p className="mt-2 flex items-center gap-1 text-gray-600">
                              <Phone className="h-4 w-4" />
                              {order.customer_phone}
                            </p>
                          )}
                        </div>

                        {/* Weight Info */}
                        {weight && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Estimated Weight</span>
                              <span className={`text-sm ${weight.hasUnknownWeights ? 'text-amber-600' : 'text-gray-900'}`}>
                                {formatWeight(weight.weightOz)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{weight.source}</p>
                          </div>
                        )}
                      </div>

                      {/* Notes Panel */}
                      <div>
                        <OrderNotesPanel
                          orderId={order.id}
                          onNotesChange={(newNotes) => {
                            setOrderNotes(prev => ({ ...prev, [order.id]: newNotes }));
                          }}
                        />

                        {/* Legacy order notes */}
                        {order.notes && (
                          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Order Notes:</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.print();
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                          >
                            <Printer className="h-4 w-4" />
                            Print
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {(order.status === 'pending' || order.status === 'paid') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkProcessing(order);
                              }}
                              disabled={isUpdating}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                              <Package className="h-4 w-4" />
                              Start Processing
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setFulfillmentForm({
                                tracking_number: order.tracking_number || '',
                                tracking_url: order.tracking_url || '',
                                carrier: 'usps',
                                notes: order.notes || ''
                              });
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                          >
                            <Truck className="h-4 w-4" />
                            Ship Order
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ship Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Ship Order {selectedOrder.order_number}</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Shipping Carrier */}
              <div>
                <label className="block text-sm font-medium mb-2">Shipping Carrier</label>
                <select
                  value={fulfillmentForm.carrier}
                  onChange={(e) => setFulfillmentForm({ ...fulfillmentForm, carrier: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900"
                >
                  <option value="usps">USPS</option>
                  <option value="ups">UPS</option>
                  <option value="fedex">FedEx</option>
                  <option value="dhl">DHL</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Tracking Number */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tracking Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fulfillmentForm.tracking_number}
                  onChange={(e) => setFulfillmentForm({ ...fulfillmentForm, tracking_number: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="Enter tracking number"
                />
              </div>

              {/* Custom Tracking URL */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Tracking URL <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="url"
                  value={fulfillmentForm.tracking_url}
                  onChange={(e) => setFulfillmentForm({ ...fulfillmentForm, tracking_url: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="Leave blank to auto-generate based on carrier"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={fulfillmentForm.notes}
                  onChange={(e) => setFulfillmentForm({ ...fulfillmentForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="Internal notes about this shipment..."
                />
              </div>

              {/* Email Notification Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700 dark:text-blue-300">Customer Notification</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      An email will be sent to {selectedOrder.customer_email} with tracking information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleShipOrder(selectedOrder)}
                disabled={isUpdating || !fulfillmentForm.tracking_number}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Shipping...
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    Ship & Notify Customer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedOrderIds.length}
        selectedIds={selectedOrderIds}
        onClearSelection={() => setSelectedOrderIds([])}
        onExport={handleBatchExport}
        onUpdateStatus={handleBatchUpdateStatus}
      />
    </div>
  );
}
