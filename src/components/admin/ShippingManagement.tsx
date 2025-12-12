'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Printer,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from 'lucide-react';

interface Shipment {
  id: string;
  order_id: string;
  carrier: string;
  service: string;
  tracking_number: string;
  tracking_url: string;
  label_url: string;
  status: string;
  rate_amount: number;
  estimated_delivery: string;
  ship_date: string;
  delivered_date: string | null;
  tracking_history: Array<{
    status: string;
    status_details: string;
    status_date: string;
    location?: {
      city: string;
      state: string;
    };
  }>;
  created_at: string;
  orders?: {
    order_number: string;
    customer_name: string;
    customer_email: string;
  };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof Package }> = {
  label_created: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Package },
  pre_transit: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock },
  transit: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: Truck },
  out_for_delivery: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: MapPin },
  delivered: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
  failure: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertCircle },
  returned: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: Package },
};

const CARRIER_COLORS: Record<string, string> = {
  usps: 'bg-blue-500',
  ups: 'bg-amber-500',
  fedex: 'bg-purple-500',
  dhl_express: 'bg-yellow-500',
};

export default function ShippingManagement() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [carrierFilter, setCarrierFilter] = useState<string>('');
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, [statusFilter, carrierFilter]);

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (carrierFilter) params.append('carrier', carrierFilter);

      const response = await fetch(`/api/shipping/labels?${params.toString()}`);
      const data = await response.json();
      setShipments(data.shipments || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTracking = async (shipmentId: string) => {
    try {
      const response = await fetch(`/api/shipping/track?shipment_id=${shipmentId}`);
      if (response.ok) {
        fetchShipments();
      }
    } catch (error) {
      console.error('Error refreshing tracking:', error);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.tracking_number?.toLowerCase().includes(query) ||
      s.orders?.order_number?.toLowerCase().includes(query) ||
      s.orders?.customer_name?.toLowerCase().includes(query)
    );
  });

  // Stats
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s) => s.status === 'transit').length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
    pending: shipments.filter((s) => s.status === 'label_created' || s.status === 'pre_transit').length,
  };

  const getStatusInfo = (status: string) => {
    return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.label_created;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Truck className="h-7 w-7 text-teal-600" />
            Shipping Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track shipments and manage shipping labels
          </p>
        </div>
        <button
          onClick={fetchShipments}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Shipments</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inTransit}</p>
              <p className="text-sm text-gray-500">In Transit</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.delivered}</p>
              <p className="text-sm text-gray-500">Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tracking #, order #, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg"
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>

          {/* Filters (Desktop) */}
          <div className={`flex gap-3 ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="label_created">Label Created</option>
              <option value="pre_transit">Pre-Transit</option>
              <option value="transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="">All Carriers</option>
              <option value="usps">USPS</option>
              <option value="ups">UPS</option>
              <option value="fedex">FedEx</option>
              <option value="dhl_express">DHL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {filteredShipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No shipments found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {filteredShipments.map((shipment) => {
              const statusInfo = getStatusInfo(shipment.status);
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedShipment === shipment.id;

              return (
                <div key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  {/* Main Row */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Carrier Badge */}
                        <div
                          className={`w-2 h-12 rounded-full ${
                            CARRIER_COLORS[shipment.carrier.toLowerCase()] || 'bg-gray-400'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {shipment.orders?.order_number || 'Unknown Order'}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
                            >
                              <StatusIcon className="h-3 w-3 inline mr-1" />
                              {shipment.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {shipment.carrier.toUpperCase()} • {shipment.service}
                          </p>
                          <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            {shipment.tracking_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-gray-500">
                            {shipment.estimated_delivery && (
                              <>
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Est. {new Date(shipment.estimated_delivery).toLocaleDateString()}
                              </>
                            )}
                          </p>
                          <p className="text-sm text-gray-400">
                            ${shipment.rate_amount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tracking History */}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            Tracking History
                          </h4>
                          {shipment.tracking_history && shipment.tracking_history.length > 0 ? (
                            <div className="space-y-2">
                              {shipment.tracking_history.slice(0, 5).map((event, idx) => (
                                <div key={idx} className="flex gap-3">
                                  <div className="w-2 h-2 mt-2 rounded-full bg-teal-500" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {event.status_details}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(event.status_date).toLocaleString()}
                                      {event.location && ` • ${event.location.city}, ${event.location.state}`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No tracking events yet</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            Actions
                          </h4>
                          <div className="space-y-2">
                            <a
                              href={shipment.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-500" />
                              Track on {shipment.carrier.toUpperCase()}
                            </a>
                            <a
                              href={shipment.label_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm"
                            >
                              <Printer className="h-4 w-4 text-gray-500" />
                              Print Label
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                refreshTracking(shipment.id);
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-sm w-full"
                            >
                              <RefreshCw className="h-4 w-4 text-gray-500" />
                              Refresh Tracking
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
      </div>
    </div>
  );
}

