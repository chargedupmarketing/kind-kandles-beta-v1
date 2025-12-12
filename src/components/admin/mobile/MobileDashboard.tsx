'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  ChevronRight,
  Truck,
  Users,
  Star,
  Calendar,
  ChevronDown,
  Zap
} from 'lucide-react';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import type { AdminSection } from './MobileAppShell';

interface MobileDashboardProps {
  onNavigate: (section: AdminSection) => void;
  pendingOrderCount: number;
}

interface DashboardStats {
  periodOrders: number;
  periodRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  ordersTrend: number;
  revenueTrend: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

type DateRange = '7d' | '30d' | '90d' | 'year' | 'all';

interface DateRangeOption {
  id: DateRange;
  label: string;
  shortLabel: string;
}

const dateRangeOptions: DateRangeOption[] = [
  { id: '7d', label: 'Last 7 Days', shortLabel: '7D' },
  { id: '30d', label: 'Last 30 Days', shortLabel: '30D' },
  { id: '90d', label: 'Last 90 Days', shortLabel: '90D' },
  { id: 'year', label: 'This Year', shortLabel: 'YTD' },
  { id: 'all', label: 'All Time', shortLabel: 'All' },
];

export default function MobileDashboard({ onNavigate, pendingOrderCount }: MobileDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    periodOrders: 0,
    periodRevenue: 0,
    pendingOrders: pendingOrderCount,
    lowStockCount: 0,
    ordersTrend: 0,
    revenueTrend: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [overviewRes, ordersRes, lowStockRes] = await Promise.all([
        fetch(`/api/analytics/overview?range=${dateRange}`, {
          headers: { 'Authorization': 'Bearer admin-token' }
        }),
        fetch('/api/orders?limit=5&sort=created_at&order=desc', {
          headers: { 'Authorization': 'Bearer admin-token' }
        }),
        fetch('/api/analytics/low-stock?threshold=5', {
          headers: { 'Authorization': 'Bearer admin-token' }
        }),
      ]);

      const overview = await overviewRes.json();
      const orders = await ordersRes.json();
      const lowStock = await lowStockRes.json();

      const ordersTrend = overview.previousOrders > 0 
        ? Math.round(((overview.totalOrders - overview.previousOrders) / overview.previousOrders) * 100)
        : 0;
      const revenueTrend = overview.previousRevenue > 0
        ? Math.round(((overview.totalRevenue - overview.previousRevenue) / overview.previousRevenue) * 100)
        : 0;

      const pendingRes = await fetch('/api/orders?status=pending&limit=1', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      const pendingData = await pendingRes.json();

      setStats({
        periodOrders: overview.totalOrders || 0,
        periodRevenue: overview.totalRevenue || 0,
        pendingOrders: pendingData.total || pendingOrderCount,
        lowStockCount: lowStock.products?.length || lowStock.count || 0,
        ordersTrend,
        revenueTrend,
      });

      setRecentOrders(orders.orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pendingOrderCount, dateRange]);

  const handleDateRangeChange = (range: DateRange) => {
    hapticLight();
    setDateRange(range);
    setShowDatePicker(false);
    setLoading(true);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    hapticMedium();
    setRefreshing(true);
    await fetchDashboardData();
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyFull = (amount: number) => {
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
    return `${diffDays}d`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-500 text-white';
      case 'processing': return 'bg-blue-500 text-white';
      case 'shipped': return 'bg-purple-500 text-white';
      case 'delivered': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-3 animate-pulse">
              <div className="h-3 w-12 bg-slate-700 rounded mb-2" />
              <div className="h-6 w-16 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 animate-pulse">
          <div className="h-4 w-24 bg-slate-700 rounded mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-2 border-t border-slate-700/50 first:border-0">
              <div className="h-3 w-full bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentRangeLabel = dateRangeOptions.find(opt => opt.id === dateRange)?.shortLabel || '30D';

  return (
    <div className="p-3 space-y-3">
      {/* Refresh Indicator */}
      {refreshing && (
        <div className="flex items-center justify-center py-1">
          <RefreshCw className="h-4 w-4 text-teal-400 animate-spin" />
        </div>
      )}

      {/* Compact Header Row */}
      <div className="flex items-center justify-between">
        {/* Date Range Pills */}
        <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-0.5">
          {dateRangeOptions.slice(0, 4).map((option) => (
            <button
              key={option.id}
              onClick={() => handleDateRangeChange(option.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                dateRange === option.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {option.shortLabel}
            </button>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Orders */}
        <button
          onClick={() => onNavigate('orders')}
          className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 rounded-lg p-3 text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between mb-1">
            <ShoppingCart className="h-4 w-4 text-blue-400" />
            {stats.ordersTrend !== 0 && (
              <span className={`flex items-center text-[10px] font-medium ${stats.ordersTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.ordersTrend > 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                {Math.abs(stats.ordersTrend)}%
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-white">{stats.periodOrders}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Orders</div>
        </button>

        {/* Revenue */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <DollarSign className="h-4 w-4 text-green-400" />
            {stats.revenueTrend !== 0 && (
              <span className={`flex items-center text-[10px] font-medium ${stats.revenueTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.revenueTrend > 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                {Math.abs(stats.revenueTrend)}%
              </span>
            )}
          </div>
          <div className="text-xl font-bold text-white">{formatCurrency(stats.periodRevenue)}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Revenue</div>
        </div>

        {/* Pending */}
        <button
          onClick={() => onNavigate('fulfillment')}
          className={`rounded-lg p-3 text-left active:scale-[0.98] transition-transform ${
            stats.pendingOrders > 0 
              ? 'bg-gradient-to-br from-amber-600/30 to-amber-600/5 border border-amber-500/30' 
              : 'bg-slate-800/50 border border-slate-700/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Clock className={`h-4 w-4 ${stats.pendingOrders > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            {stats.pendingOrders > 0 && (
              <span className="flex items-center text-[10px] font-medium text-amber-400">
                <Zap className="h-2.5 w-2.5 mr-0.5" />
                Action
              </span>
            )}
          </div>
          <div className={`text-xl font-bold ${stats.pendingOrders > 0 ? 'text-amber-400' : 'text-white'}`}>
            {stats.pendingOrders}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Pending</div>
        </button>

        {/* Low Stock */}
        <button
          onClick={() => onNavigate('products')}
          className={`rounded-lg p-3 text-left active:scale-[0.98] transition-transform ${
            stats.lowStockCount > 10 
              ? 'bg-gradient-to-br from-red-600/30 to-red-600/5 border border-red-500/30' 
              : 'bg-slate-800/50 border border-slate-700/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <AlertTriangle className={`h-4 w-4 ${stats.lowStockCount > 10 ? 'text-red-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-xl font-bold ${stats.lowStockCount > 10 ? 'text-red-400' : 'text-white'}`}>
            {stats.lowStockCount}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wide">Low Stock</div>
        </button>
      </div>

      {/* Quick Actions - More Compact */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onNavigate('fulfillment')}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-purple-600/20 border border-purple-500/30 rounded-lg active:scale-[0.98] transition-transform"
        >
          <Truck className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-medium text-purple-300">Ship</span>
        </button>
        <button
          onClick={() => onNavigate('products')}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-blue-600/20 border border-blue-500/30 rounded-lg active:scale-[0.98] transition-transform"
        >
          <Package className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-medium text-blue-300">Stock</span>
        </button>
        <button
          onClick={() => onNavigate('customers')}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-green-600/20 border border-green-500/30 rounded-lg active:scale-[0.98] transition-transform"
        >
          <Users className="h-4 w-4 text-green-400" />
          <span className="text-xs font-medium text-green-300">CRM</span>
        </button>
        <button
          onClick={() => onNavigate('reviews')}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-amber-600/20 border border-amber-500/30 rounded-lg active:scale-[0.98] transition-transform"
        >
          <Star className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-medium text-amber-300">Reviews</span>
        </button>
      </div>

      {/* Recent Orders - Compact List */}
      <div className="bg-slate-800/30 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Recent Orders</span>
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center text-[10px] text-teal-400 font-medium"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingCart className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No recent orders</p>
          </div>
        ) : (
          <div>
            {recentOrders.map((order, index) => (
              <button
                key={order.id}
                onClick={() => onNavigate('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700/30 transition-colors ${
                  index !== recentOrders.length - 1 ? 'border-b border-slate-700/30' : ''
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${getStatusColor(order.status)}`}>
                    {order.status?.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white truncate">
                      {order.customer_name || 'Unknown'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      #{order.order_number?.slice(-4)} • {formatTimeAgo(order.created_at)}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-white ml-2">
                  {formatCurrencyFull(order.total || 0)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
