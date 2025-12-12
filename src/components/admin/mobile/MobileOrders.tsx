'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Package,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { hapticLight, hapticSuccess, hapticMedium } from '@/lib/haptics';
import type { AdminSection } from './MobileAppShell';
import QuickShipModal from './QuickShipModal';

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
  const [quickShipOrder, setQuickShipOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  const handleQuickShip = (order: Order) => {
    hapticMedium();
    setQuickShipOrder(order);
  };

  const handleShipSuccess = () => {
    hapticSuccess();
    setQuickShipOrder(null);
    fetchOrders(true);
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock };
      case 'processing':
        return { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Package };
      case 'shipped':
        return { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Truck };
      case 'delivered':
        return { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle };
      case 'cancelled':
        return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle };
      default:
        return { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Package };
    }
  };

  const statusFilters: { id: FilterStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filter Header */}
      <div className="sticky top-0 bg-slate-900 z-10 p-4 space-y-3 border-b border-slate-800">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleStatusChange(filter.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === filter.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-auto">
        {loading && orders.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse">
                <div className="flex justify-between mb-2">
                  <div className="h-4 w-32 bg-slate-700 rounded" />
                  <div className="h-4 w-16 bg-slate-700 rounded" />
                </div>
                <div className="h-3 w-24 bg-slate-700 rounded mb-2" />
                <div className="h-6 w-20 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Package className="h-16 w-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No orders found</h3>
            <p className="text-slate-400 text-sm text-center">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Orders will appear here when customers make purchases'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Refresh indicator */}
            {refreshing && (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="h-5 w-5 text-teal-400 animate-spin" />
              </div>
            )}

            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-slate-800 rounded-xl overflow-hidden"
                >
                  {/* Order Header */}
                  <button
                    onClick={() => handleOrderExpand(order.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-semibold text-white truncate">
                            {order.customer_name || 'Unknown Customer'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <span>#{order.order_number}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(order.created_at)}</span>
                          {order.items_count && (
                            <>
                              <span>•</span>
                              <span>{order.items_count} items</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-3">
                        <span className="text-sm font-bold text-white">
                          {formatCurrency(order.total || 0)}
                        </span>
                        <span className={`mt-1 px-2 py-0.5 text-xs rounded-full border ${statusConfig.color}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-700">
                      {/* Contact Info */}
                      <div className="pt-3 space-y-2">
                        {order.customer_email && (
                          <a
                            href={`mailto:${order.customer_email}`}
                            className="flex items-center space-x-2 text-sm text-slate-300 hover:text-teal-400"
                          >
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="truncate">{order.customer_email}</span>
                          </a>
                        )}
                        {order.customer_phone && (
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="flex items-center space-x-2 text-sm text-slate-300 hover:text-teal-400"
                          >
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span>{order.customer_phone}</span>
                          </a>
                        )}
                        {order.shipping_address && (
                          <div className="flex items-start space-x-2 text-sm text-slate-400">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                              {[
                                order.shipping_address.line1,
                                order.shipping_address.city,
                                order.shipping_address.state,
                                order.shipping_address.postal_code
                              ].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 mt-4">
                        {(order.status === 'pending' || order.status === 'processing') && (
                          <button
                            onClick={() => handleQuickShip(order)}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          >
                            <Truck className="h-4 w-4" />
                            <span className="text-sm font-medium">Quick Ship</span>
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('orders')}
                          className="flex items-center justify-center space-x-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                          <span className="text-sm">Details</span>
                          <ChevronRight className="h-4 w-4" />
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
                className="w-full py-3 text-sm text-teal-400 hover:text-teal-300 font-medium"
              >
                {loading ? 'Loading...' : 'Load more orders'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Ship Modal */}
      {quickShipOrder && (
        <QuickShipModal
          order={quickShipOrder}
          onClose={() => setQuickShipOrder(null)}
          onSuccess={handleShipSuccess}
        />
      )}
    </div>
  );
}

