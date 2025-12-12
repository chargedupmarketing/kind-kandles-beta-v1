'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Eye,
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
  DollarSign,
  Tag
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';
import ShippingRateModal from './ShippingRateModal';
import ShippingLabel from './ShippingLabel';

interface OrderItem {
  id: string;
  title: string;
  variant_title: string | null;
  quantity: number;
  price: number;
  total: number;
  sku: string | null;
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

const priorityOrder = ['pending', 'paid', 'processing'];

export default function OrderFulfillment() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fulfillment form state
  const [fulfillmentForm, setFulfillmentForm] = useState({
    tracking_number: '',
    tracking_url: '',
    carrier: 'usps',
    notes: ''
  });

  // Shipping rate modal state
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateModalOrder, setRateModalOrder] = useState<Order | null>(null);
  const [selectedRate, setSelectedRate] = useState<{
    id: string;
    carrier: string;
    service: string;
    price: number;
    estimated_days: number;
  } | null>(null);
  const [shipmentId, setShipmentId] = useState<string>('');
  const [isPurchasingLabel, setIsPurchasingLabel] = useState(false);
  const [purchasedLabel, setPurchasedLabel] = useState<{
    labelUrl: string;
    trackingNumber: string;
    trackingUrl: string;
    carrier: string;
    service: string;
  } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/orders?status=pending,paid,processing', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Sort by priority: pending first, then paid, then processing
        const sortedOrders = (data.orders || []).sort((a: Order, b: Order) => {
          const aPriority = priorityOrder.indexOf(a.status);
          const bPriority = priorityOrder.indexOf(b.status);
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          // Then sort by date (oldest first)
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setErrorMessage('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
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
        body: JSON.stringify({
          status: 'processing'
        })
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
      // Generate tracking URL based on carrier
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

  // Open rate shopping modal
  const handleGetRates = (order: Order) => {
    setRateModalOrder(order);
    setShowRateModal(true);
    setSelectedRate(null);
    setPurchasedLabel(null);
  };

  // Handle rate selection
  const handleSelectRate = (rate: {
    id: string;
    carrier: string;
    service: string;
    price: number;
    estimated_days: number;
  }, shipmentIdValue: string) => {
    setSelectedRate(rate);
    setShipmentId(shipmentIdValue);
    setShowRateModal(false);
  };

  // Purchase shipping label
  const handlePurchaseLabel = async () => {
    if (!selectedRate || !rateModalOrder) return;

    setIsPurchasingLabel(true);
    try {
      const response = await fetch('/api/shipping/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate_id: selectedRate.id,
          order_id: rateModalOrder.id,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate_amount: selectedRate.price,
          estimated_days: selectedRate.estimated_days,
          to_address: {
            name: rateModalOrder.customer_name,
            street1: rateModalOrder.shipping_address_line1,
            street2: rateModalOrder.shipping_address_line2,
            city: rateModalOrder.shipping_city,
            state: rateModalOrder.shipping_state,
            zip: rateModalOrder.shipping_postal_code,
            country: rateModalOrder.shipping_country,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase label');
      }

      setPurchasedLabel({
        labelUrl: data.label_url,
        trackingNumber: data.tracking_number,
        trackingUrl: data.tracking_url,
        carrier: selectedRate.carrier,
        service: selectedRate.service,
      });

      setSuccessMessage(`Label purchased! Tracking: ${data.tracking_number}`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchOrders();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to purchase label');
    } finally {
      setIsPurchasingLabel(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.customer_email.toLowerCase().includes(query)
    );
  });

  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'paid').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      paid: 'bg-blue-100 text-blue-700 border-blue-200',
      processing: 'bg-purple-100 text-purple-700 border-purple-200'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-teal-600" />
            Order Fulfillment
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Process and ship pending orders
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingCount}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Awaiting Processing</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{processingCount}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Being Prepared</p>
            </div>
          </div>
        </div>
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/40 rounded-lg">
              <Truck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{orders.length}</p>
              <p className="text-sm text-teal-600 dark:text-teal-400">Total to Fulfill</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order number, customer name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No orders waiting to be fulfilled. Great job! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders.includes(order.id);
            
            return (
              <div 
                key={order.id} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Order Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
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
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-teal-600">
                        {formatPrice(order.total)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {order.customer_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {order.customer_email}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Items List */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Order Items
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
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
                      </div>

                      {/* Shipping Address */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Ship To
                        </h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-gray-600 dark:text-gray-400">{order.shipping_address_line1}</p>
                          {order.shipping_address_line2 && (
                            <p className="text-gray-600 dark:text-gray-400">{order.shipping_address_line2}</p>
                          )}
                          <p className="text-gray-600 dark:text-gray-400">
                            {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">{order.shipping_country}</p>
                          {order.customer_phone && (
                            <p className="mt-2 flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4" />
                              {order.customer_phone}
                            </p>
                          )}
                        </div>

                        {order.notes && (
                          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Order Notes:</p>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.print();
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
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
                              handleGetRates(order);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <DollarSign className="h-4 w-4" />
                            Get Shipping Rates
                          </button>
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
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Ship Order {selectedOrder.order_number}</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
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
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
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
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
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
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Internal notes about this shipment..."
                />
              </div>

              {/* Email Notification Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
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

            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleShipOrder(selectedOrder)}
                disabled={isUpdating || !fulfillmentForm.tracking_number}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
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

      {/* Shipping Rate Modal */}
      {rateModalOrder && (
        <ShippingRateModal
          isOpen={showRateModal}
          onClose={() => {
            setShowRateModal(false);
            setRateModalOrder(null);
          }}
          onSelectRate={handleSelectRate}
          toAddress={{
            name: rateModalOrder.customer_name,
            street1: rateModalOrder.shipping_address_line1,
            street2: rateModalOrder.shipping_address_line2 || undefined,
            city: rateModalOrder.shipping_city,
            state: rateModalOrder.shipping_state,
            zip: rateModalOrder.shipping_postal_code,
            country: rateModalOrder.shipping_country,
          }}
          orderNumber={rateModalOrder.order_number}
        />
      )}

      {/* Selected Rate & Purchase Label Modal */}
      {selectedRate && rateModalOrder && !purchasedLabel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold">Purchase Shipping Label</h3>
              <p className="text-gray-500 text-sm mt-1">Order {rateModalOrder.order_number}</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium uppercase">{selectedRate.carrier}</span>
                  <span className="text-2xl font-bold text-teal-600">${selectedRate.price.toFixed(2)}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{selectedRate.service}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Estimated delivery: {selectedRate.estimated_days} business day{selectedRate.estimated_days !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRate(null);
                    setShowRateModal(true);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Change Rate
                </button>
                <button
                  onClick={handlePurchaseLabel}
                  disabled={isPurchasingLabel}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPurchasingLabel ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Purchasing...
                    </>
                  ) : (
                    <>
                      <Tag className="h-4 w-4" />
                      Buy Label
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-4 border-t dark:border-gray-700">
              <button
                onClick={() => {
                  setSelectedRate(null);
                  setRateModalOrder(null);
                }}
                className="w-full text-center text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchased Label Display */}
      {purchasedLabel && rateModalOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <ShippingLabel
              labelUrl={purchasedLabel.labelUrl}
              trackingNumber={purchasedLabel.trackingNumber}
              trackingUrl={purchasedLabel.trackingUrl}
              carrier={purchasedLabel.carrier}
              service={purchasedLabel.service}
              orderNumber={rateModalOrder.order_number}
              onClose={() => {
                setPurchasedLabel(null);
                setSelectedRate(null);
                setRateModalOrder(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

