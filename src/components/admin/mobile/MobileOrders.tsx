'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Package,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Square,
  CheckSquare
} from 'lucide-react';
import { hapticLight, hapticSuccess, hapticMedium } from '@/lib/haptics';
import type { AdminSection } from './MobileAppShell';
import OrderDetailsModal from './OrderDetailsModal';

interface MobileOrdersProps {
  onNavigate: (section: AdminSection) => void;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  total: number;
  status: string;
  created_at: string;
  items_count?: number;
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

export default function MobileOrders({ onNavigate }: MobileOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      
      const response = await fetch(
        `/api/orders?page=${currentPage}&limit=20${statusParam}${searchParam}&sort=created_at&order=desc`,
        {
          headers: { 'Authorization': 'Bearer admin-token' }
        }
      );
      const data = await response.json();

      if (reset) {
        setOrders(data.orders || []);
        setPage(1);
      } else {
        setOrders(prev => [...prev, ...(data.orders || [])]);
      }
      
      setHasMore((data.orders || []).length === 20);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus, searchQuery, page]);

  useEffect(() => {
    setLoading(true);
    fetchOrders(true);
  }, [filterStatus, searchQuery]);

  const handleRefresh = async () => {
    hapticMedium();
    setRefreshing(true);
    await fetchOrders(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchOrders(false);
    }
  };

  const handleStatusChange = (status: FilterStatus) => {
    hapticLight();
    setFilterStatus(status);
  };

  const handleOrderExpand = (orderId: string) => {
    hapticLight();
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };


  const handleViewDetails = async (order: Order) => {
    hapticMedium();
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      const data = await response.json();
      if (response.ok) {
        // Transform flat address fields to nested object for modal
        const transformedOrder = {
          ...data.order,
          shipping_address: {
            name: data.order.customer_name,
            line1: data.order.shipping_address_line1 || data.order.shipping_line1,
            line2: data.order.shipping_address_line2 || data.order.shipping_line2,
            city: data.order.shipping_city,
            state: data.order.shipping_state,
            postal_code: data.order.shipping_postal_code,
            country: data.order.shipping_country || 'US'
          }
        };
        setDetailsOrder(transformedOrder);
      } else {
        console.error('Failed to fetch order details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleSelectOrder = (orderId: string) => {
    hapticLight();
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  const handleSelectAll = () => {
    hapticMedium();
    if (selectedOrderIds.size === orders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(orders.map(o => o.id)));
    }
  };

  const handleExportOrders = async () => {
    const ordersToExport = selectedOrderIds.size > 0 
      ? Array.from(selectedOrderIds)
      : orders.map(o => o.id);

    if (ordersToExport.length === 0) {
      alert('No orders to export. Try changing your filter or add some orders first.');
      setShowActions(false);
      return;
    }

    hapticMedium();
    setIsExporting(true);
    setShowActions(false);
    
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
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pirateship-orders-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        hapticSuccess();
        alert(`Successfully exported ${ordersToExport.length} order(s) to CSV!`);
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

    hapticMedium();
    setIsImporting(true);
    setShowActions(false);

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
        fetchOrders(true); // Refresh orders list
        hapticSuccess();
        
        if (data.errors && data.errors.length > 0) {
          alert(`Imported ${data.updated} tracking numbers with ${data.errors.length} errors.`);
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
      event.target.value = '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { bg: 'bg-amber-500', text: 'text-white', icon: Clock, label: 'P' };
      case 'processing':
        return { bg: 'bg-blue-500', text: 'text-white', icon: Package, label: 'W' };
      case 'shipped':
        return { bg: 'bg-purple-500', text: 'text-white', icon: Truck, label: 'S' };
      case 'delivered':
        return { bg: 'bg-green-500', text: 'text-white', icon: CheckCircle, label: 'D' };
      case 'cancelled':
        return { bg: 'bg-red-500', text: 'text-white', icon: XCircle, label: 'X' };
      default:
        return { bg: 'bg-gray-500', text: 'text-white', icon: Package, label: '?' };
    }
  };

  const statusFilters: { id: FilterStatus; label: string; count?: number }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Working' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Done' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Compact Header */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm">
        {/* Selection Bar */}
        {selectedOrderIds.size > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-teal-50 border-b border-teal-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="p-1 hover:bg-teal-100 rounded transition-colors"
              >
                {selectedOrderIds.size === orders.length ? (
                  <CheckSquare className="h-5 w-5 text-teal-600" />
                ) : (
                  <Square className="h-5 w-5 text-teal-600" />
                )}
              </button>
              <span className="text-sm font-medium text-teal-900">
                {selectedOrderIds.size} selected
              </span>
            </div>
            <button
              onClick={() => setSelectedOrderIds(new Set())}
              className="text-xs text-teal-700 hover:text-teal-900 font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex items-center px-3 py-2 space-x-1 overflow-x-auto scrollbar-hide">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleStatusChange(filter.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterStatus === filter.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
          
          {/* Actions Menu Button */}
          <button
            onClick={() => {
              hapticLight();
              setShowActions(!showActions);
            }}
            className="ml-auto p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-full transition-colors ${
              showSearch ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Collapsible Search */}
        {showSearch && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* Actions Dropdown */}
        {showActions && (
          <div className="px-3 pb-2">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🚢</span>
                <span className="text-xs font-medium text-purple-900">Pirate Ship</span>
              </div>
              <button
                onClick={handleExportOrders}
                disabled={isExporting || orders.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm font-medium"
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
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer">
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
        )}
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-auto">
        {loading && orders.length === 0 ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg p-3 animate-pulse shadow-sm">
                <div className="flex justify-between mb-1.5">
                  <div className="h-3.5 w-28 bg-gray-200 rounded" />
                  <div className="h-3.5 w-14 bg-gray-200 rounded" />
                </div>
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No orders found</h3>
            <p className="text-xs text-gray-500 text-center">
              {searchQuery || filterStatus !== 'all'
                ? 'Try different filters'
                : 'Orders appear here'}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {refreshing && (
              <div className="flex items-center justify-center py-1">
                <RefreshCw className="h-4 w-4 text-teal-600 animate-spin" />
              </div>
            )}

            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const isExpanded = expandedOrder === order.id;
              const isSelected = selectedOrderIds.has(order.id);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-lg overflow-hidden shadow-sm border ${isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-100'}`}
                >
                  {/* Compact Order Row */}
                  <div className="flex items-center px-3 py-2.5">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleSelectOrder(order.id)}
                      className="flex items-center justify-center w-5 h-5 mr-2 text-gray-600 hover:text-teal-600 transition-colors flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-teal-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>

                    {/* Order Content */}
                    <button
                      onClick={() => handleOrderExpand(order.id)}
                      className="flex-1 text-left flex items-center min-w-0"
                    >
                      {/* Status Badge */}
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text} mr-2.5 flex-shrink-0`}>
                        {statusConfig.label}
                      </span>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate pr-2">
                            {order.customer_name || 'Unknown'}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(order.total || 0)}
                          </span>
                        </div>
                        <div className="flex items-center text-[10px] text-gray-500 mt-0.5">
                          <span>#{order.order_number?.slice(-6)}</span>
                          <span className="mx-1">•</span>
                          <span>{formatTimeAgo(order.created_at)}</span>
                          {order.items_count && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{order.items_count} items</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expand Indicator */}
                      <ChevronDown className={`h-4 w-4 text-gray-400 ml-2 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-100">
                      {/* Contact Info */}
                      <div className="pt-2 space-y-1.5">
                        {order.customer_email && (
                          <a
                            href={`mailto:${order.customer_email}`}
                            className="flex items-center space-x-2 text-xs text-gray-600 hover:text-teal-600"
                          >
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{order.customer_email}</span>
                          </a>
                        )}
                        {order.customer_phone && (
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="flex items-center space-x-2 text-xs text-gray-600 hover:text-teal-600"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{order.customer_phone}</span>
                          </a>
                        )}
                        {order.shipping_address && (
                          <div className="flex items-start space-x-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">
                              {[
                                order.shipping_address.city,
                                order.shipping_address.state
                              ].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(order);
                          }}
                          disabled={loadingDetails}
                          className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-xs font-medium disabled:opacity-50"
                        >
                          <span>{loadingDetails ? 'Loading...' : 'View Details'}</span>
                          {!loadingDetails && <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-2.5 text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {detailsOrder && (
        <OrderDetailsModal
          order={detailsOrder}
          onClose={() => setDetailsOrder(null)}
          onUpdate={() => {
            fetchOrders(true);
            setDetailsOrder(null);
          }}
        />
      )}
    </div>
  );
}
