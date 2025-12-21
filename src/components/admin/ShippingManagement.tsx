'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  MapPin,
  DollarSign,
  Settings,
  RefreshCw,
  Printer,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Box,
  Scale,
  Ruler,
  Clock,
  Tag,
  Building2,
  Save,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  tracking_number?: string;
  tracking_url?: string;
  shipping_label_url?: string;
  carrier?: string;
  created_at: string;
}

interface ShippingRate {
  id: string;
  carrier: string;
  carrierLogo?: string;
  service: string;
  price: number;
  estimatedDays: number;
  estimatedDelivery: string;
}

interface ShippingSettings {
  enabled: boolean;
  freeShippingThreshold: number;
  freeShippingEnabled: boolean;
  handlingFee: number;
  enabledCarriers: string[];
  defaultParcelSize: string;
  insuranceEnabled: boolean;
  signatureRequired: boolean;
  storeAddress: {
    name: string;
    company: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    email: string;
  };
  parcelPresets: Array<{
    name: string;
    length: number;
    width: number;
    height: number;
    weight: number;
  }>;
  labelFormat: string;
  testMode: boolean;
}

type Tab = 'orders' | 'labels' | 'settings';

export default function ShippingManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Parcel dimensions for rate calculation
  const [parcelDimensions, setParcelDimensions] = useState({
    length: 10,
    width: 8,
    height: 6,
    weight: 2,
  });

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'labels') {
      fetchOrders();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders?status=${statusFilter}`, {
        headers: { 'Authorization': 'Bearer admin-token' },
      });
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/shipping/settings', {
        headers: { 'Authorization': 'Bearer admin-token' },
      });
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load shipping settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async (order: Order) => {
    setLoadingRates(true);
    setRates([]);
    setSelectedRate(null);
    setError('');
    
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationAddress: order.shipping_address,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          parcelDimensions,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get rates');
      }

      setRates(data.rates || []);
    } catch (error: any) {
      console.error('Error fetching rates:', error);
      setError(error.message || 'Failed to get shipping rates');
    } finally {
      setLoadingRates(false);
    }
  };

  const createLabel = async () => {
    if (!selectedOrder || !selectedRate) return;
    
    setCreatingLabel(true);
    setError('');
    
    try {
      const response = await fetch('/api/shipping/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({
          rateId: selectedRate.id,
          orderId: selectedOrder.id,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create label');
      }

      setSuccess(`Label created! Tracking: ${data.label.trackingNumber}`);
      
      // Refresh orders
      fetchOrders();
      setSelectedOrder(null);
      setRates([]);
      setSelectedRate(null);
      
      // Open label in new tab
      if (data.label.labelUrl) {
        window.open(data.label.labelUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating label:', error);
      setError(error.message || 'Failed to create shipping label');
    } finally {
      setCreatingLabel(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSavingSettings(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/shipping/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Shipping settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const filteredOrders = orders.filter(order => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.order_number?.toLowerCase().includes(term) ||
        order.customer_name?.toLowerCase().includes(term) ||
        order.customer_email?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shipping Management</h2>
          <p className="text-slate-600">Create labels, track shipments, and manage shipping settings</p>
        </div>
        <button
          onClick={() => activeTab === 'settings' ? fetchSettings() : fetchOrders()}
          className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 'orders', label: 'Pending Orders', icon: Package },
            { id: 'labels', label: 'Create Labels', icon: Printer },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setTimeout(fetchOrders, 0);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="all">All Orders</option>
            </select>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-teal-600 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No orders found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">#{order.order_number}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{order.customer_name}</div>
                        <div className="text-xs text-slate-500">{order.customer_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {order.shipping_address?.city}, {order.shipping_address?.state}
                        </div>
                        <div className="text-xs text-slate-500">{order.shipping_address?.zip}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                        </div>
                        <div className="text-xs text-slate-500">${order.total?.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'shipped' 
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.tracking_number ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => copyToClipboard(order.tracking_number!)}
                              className="text-xs text-teal-600 hover:text-teal-700"
                            >
                              {order.tracking_number}
                            </button>
                            {order.tracking_url && (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center space-x-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded transition-colors"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Create Label</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Labels Tab - Quick Label Creation */}
      {activeTab === 'labels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Selection */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Order</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order # or customer..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredOrders.filter(o => !o.tracking_number).map((order) => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      fetchRates(order);
                    }}
                    className={`w-full p-3 text-left rounded-lg border transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">#{order.order_number}</span>
                      <span className="text-sm text-slate-500">${order.total?.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-slate-600">{order.customer_name}</div>
                    <div className="text-xs text-slate-500">
                      {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parcel Dimensions */}
            {selectedOrder && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-medium text-slate-900 mb-3">Parcel Dimensions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Length (in)</label>
                    <input
                      type="number"
                      value={parcelDimensions.length}
                      onChange={(e) => setParcelDimensions(p => ({ ...p, length: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Width (in)</label>
                    <input
                      type="number"
                      value={parcelDimensions.width}
                      onChange={(e) => setParcelDimensions(p => ({ ...p, width: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Height (in)</label>
                    <input
                      type="number"
                      value={parcelDimensions.height}
                      onChange={(e) => setParcelDimensions(p => ({ ...p, height: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Weight (lb)</label>
                    <input
                      type="number"
                      value={parcelDimensions.weight}
                      onChange={(e) => setParcelDimensions(p => ({ ...p, weight: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => selectedOrder && fetchRates(selectedOrder)}
                  className="mt-3 w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
                >
                  Recalculate Rates
                </button>
              </div>
            )}
          </div>

          {/* Shipping Rates */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Shipping Rates</h3>
            
            {!selectedOrder ? (
              <div className="text-center py-12 text-slate-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Select an order to view shipping rates</p>
              </div>
            ) : loadingRates ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-teal-600 animate-spin" />
              </div>
            ) : rates.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No rates available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rates.map((rate) => (
                  <button
                    key={rate.id}
                    onClick={() => setSelectedRate(rate)}
                    className={`w-full p-4 text-left rounded-lg border transition-colors ${
                      selectedRate?.id === rate.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">{rate.carrier}</div>
                        <div className="text-sm text-slate-600">{rate.service}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">${rate.price.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">
                          Est. {rate.estimatedDelivery}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {selectedRate && (
                  <button
                    onClick={createLabel}
                    disabled={creatingLabel}
                    className="w-full mt-4 px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {creatingLabel ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Creating Label...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="h-4 w-4" />
                        <span>Purchase Label - ${selectedRate.price.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">General Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">Enable Shipping</div>
                  <div className="text-sm text-slate-500">Allow shipping rate calculation</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings(s => s ? { ...s, enabled: e.target.checked } : s)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-900">Free Shipping</div>
                  <div className="text-sm text-slate-500">Enable free shipping threshold</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.freeShippingEnabled}
                    onChange={(e) => setSettings(s => s ? { ...s, freeShippingEnabled: e.target.checked } : s)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Free Shipping Threshold ($)
                </label>
                <input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings(s => s ? { ...s, freeShippingThreshold: parseFloat(e.target.value) || 0 } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Handling Fee ($)
                </label>
                <input
                  type="number"
                  value={settings.handlingFee}
                  onChange={(e) => setSettings(s => s ? { ...s, handlingFee: parseFloat(e.target.value) || 0 } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Store Address */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Store Address (Ship From)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={settings.storeAddress.name}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, name: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={settings.storeAddress.company}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, company: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={settings.storeAddress.street1}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, street1: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address 2</label>
                <input
                  type="text"
                  value={settings.storeAddress.street2}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, street2: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={settings.storeAddress.city}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, city: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={settings.storeAddress.state}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, state: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={settings.storeAddress.zip}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, zip: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={settings.storeAddress.country}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, country: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={settings.storeAddress.phone}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, phone: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.storeAddress.email}
                  onChange={(e) => setSettings(s => s ? { ...s, storeAddress: { ...s.storeAddress, email: e.target.value } } : s)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Enabled Carriers */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Enabled Carriers</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['usps', 'ups', 'fedex', 'dhl_express'].map((carrier) => (
                <label
                  key={carrier}
                  className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    settings.enabledCarriers.includes(carrier)
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={settings.enabledCarriers.includes(carrier)}
                    onChange={(e) => {
                      setSettings(s => {
                        if (!s) return s;
                        const carriers = e.target.checked
                          ? [...s.enabledCarriers, carrier]
                          : s.enabledCarriers.filter(c => c !== carrier);
                        return { ...s, enabledCarriers: carriers };
                      });
                    }}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                  />
                  <span className="font-medium text-slate-900">{carrier.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="flex items-center space-x-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg font-medium transition-colors"
            >
              {savingSettings ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && activeTab === 'orders' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Create Label - Order #{selectedOrder.order_number}
              </h3>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setRates([]);
                  setSelectedRate(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Ship To</h4>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="font-medium text-slate-900">{selectedOrder.shipping_address?.name}</div>
                  <div className="text-sm text-slate-600">
                    {selectedOrder.shipping_address?.street1}
                    {selectedOrder.shipping_address?.street2 && <>, {selectedOrder.shipping_address.street2}</>}
                  </div>
                  <div className="text-sm text-slate-600">
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} {selectedOrder.shipping_address?.zip}
                  </div>
                </div>
              </div>

              {/* Parcel Dimensions */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Package Dimensions</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Length</label>
                    <input
                      type="number"
                      value={parcelDimensions.length}
                      onChange={(e) => setParcelDimensions(p => ({ ...p, length: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Width</label>
                    <input
                      type="number"
                      value={parcelDimensions.width}
                      onChange={(e) => setParcelDimensions(p => ({ ...p, width: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Height</label>
                    <input
                      type="number"
                      value={parcelDimensions.height}
                      onChange={(e) => setParcelDimensions(p => ({ ...p, height: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Weight (lb)</label>
                    <input
                      type="number"
                      value={parcelDimensions.weight}
                      onChange={(e) => setParcelDimensions(p => ({ ...p, weight: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={() => fetchRates(selectedOrder)}
                  className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
                >
                  Get Rates
                </button>
              </div>

              {/* Rates */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Available Rates</h4>
                {loadingRates ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 text-teal-600 animate-spin" />
                  </div>
                ) : rates.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Click "Get Rates" to see shipping options
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rates.map((rate) => (
                      <button
                        key={rate.id}
                        onClick={() => setSelectedRate(rate)}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          selectedRate?.id === rate.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-slate-900">{rate.carrier}</span>
                            <span className="text-slate-500 mx-2">•</span>
                            <span className="text-slate-600">{rate.service}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">${rate.price.toFixed(2)}</div>
                            <div className="text-xs text-slate-500">{rate.estimatedDelivery}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setRates([]);
                  setSelectedRate(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createLabel}
                disabled={!selectedRate || creatingLabel}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {creatingLabel ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" />
                    <span>Create Label {selectedRate && `- $${selectedRate.price.toFixed(2)}`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
