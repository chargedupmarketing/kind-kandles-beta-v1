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
  ChevronDown
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

// Match the API's expected range values
type DateRange = '7d' | '30d' | '90d' | 'year' | 'all';

interface DateRangeOption {
  id: DateRange;
  label: string;
  shortLabel: string;
}

const dateRangeOptions: DateRangeOption[] = [
  { id: '7d', label: 'Last 7 Days', shortLabel: '7 Days' },
  { id: '30d', label: 'Last 30 Days', shortLabel: '30 Days' },
  { id: '90d', label: 'Last 90 Days', shortLabel: '90 Days' },
  { id: 'year', label: 'This Year', shortLabel: 'Year' },
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
      // Fetch overview stats with date range - include auth header
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

      // Calculate trend percentages
      const ordersTrend = overview.previousOrders > 0 
        ? Math.round(((overview.totalOrders - overview.previousOrders) / overview.previousOrders) * 100)
        : 0;
      const revenueTrend = overview.previousRevenue > 0
        ? Math.round(((overview.totalRevenue - overview.previousRevenue) / overview.previousRevenue) * 100)
        : 0;

      // Get pending orders count
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
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      case 'processing': return 'bg-blue-500/20 text-blue-400';
      case 'shipped': return 'bg-purple-500/20 text-purple-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 w-16 bg-slate-700 rounded mb-2" />
              <div className="h-8 w-24 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
        {/* Skeleton Orders */}
        <div className="bg-slate-800 rounded-xl p-4 animate-pulse">
          <div className="h-5 w-32 bg-slate-700 rounded mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-3 border-t border-slate-700 first:border-0">
              <div className="h-4 w-full bg-slate-700 rounded mb-2" />
              <div className="h-3 w-24 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentRangeLabel = dateRangeOptions.find(opt => opt.id === dateRange)?.label || 'Last 30 Days';
  const periodLabel = dateRange === '7d' ? "7-Day" : 
                      dateRange === '30d' ? "30-Day" :
                      dateRange === '90d' ? "90-Day" :
                      dateRange === 'year' ? "Year" :
                      dateRange === 'all' ? "All-Time" : "Period";

  return (
    <div className="p-4 space-y-4">
      {/* Pull to Refresh Indicator */}
      {refreshing && (
        <div className="flex items-center justify-center py-2">
          <RefreshCw className="h-5 w-5 text-teal-400 animate-spin" />
          <span className="ml-2 text-sm text-slate-400">Refreshing...</span>
        </div>
      )}

      {/* Date Range Selector & Refresh */}
      <div className="flex items-center justify-between">
        {/* Date Range Picker */}
        <div className="relative">
          <button
            onClick={() => {
              hapticLight();
              setShowDatePicker(!showDatePicker);
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Calendar className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium text-white">{currentRangeLabel}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDatePicker && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowDatePicker(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                {dateRangeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDateRangeChange(option.id)}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                      dateRange === option.id
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{option.label}</span>
                    {dateRange === option.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Period Orders */}
        <button
          onClick={() => onNavigate('orders')}
          className="bg-slate-800 rounded-xl p-4 text-left hover:bg-slate-700/80 transition-colors active:scale-98"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">{periodLabel} Orders</span>
            <ShoppingCart className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">{stats.periodOrders}</span>
            {stats.ordersTrend !== 0 && (
              <div className={`flex items-center text-xs ${stats.ordersTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.ordersTrend > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                {Math.abs(stats.ordersTrend)}%
              </div>
            )}
          </div>
        </button>

        {/* Period Revenue */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">{periodLabel} Revenue</span>
            <DollarSign className="h-4 w-4 text-green-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">{formatCurrency(stats.periodRevenue)}</span>
            {stats.revenueTrend !== 0 && (
              <div className={`flex items-center text-xs ${stats.revenueTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.revenueTrend > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                {Math.abs(stats.revenueTrend)}%
              </div>
            )}
          </div>
        </div>

        {/* Pending Orders */}
        <button
          onClick={() => onNavigate('fulfillment')}
          className="bg-slate-800 rounded-xl p-4 text-left hover:bg-slate-700/80 transition-colors active:scale-98"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Pending</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-2xl font-bold ${stats.pendingOrders > 0 ? 'text-amber-400' : 'text-white'}`}>
              {stats.pendingOrders}
            </span>
            {stats.pendingOrders > 0 && (
              <span className="text-xs text-amber-400">Action needed</span>
            )}
          </div>
        </button>

        {/* Low Stock */}
        <button
          onClick={() => onNavigate('products')}
          className="bg-slate-800 rounded-xl p-4 text-left hover:bg-slate-700/80 transition-colors active:scale-98"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Low Stock</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {stats.lowStockCount}
            </span>
            {stats.lowStockCount > 0 && (
              <span className="text-xs text-red-400">Restock</span>
            )}
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onNavigate('fulfillment')}
            className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Truck className="h-5 w-5 text-purple-400 mb-1" />
            <span className="text-xs text-slate-300">Ship</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Package className="h-5 w-5 text-blue-400 mb-1" />
            <span className="text-xs text-slate-300">Stock</span>
          </button>
          <button
            onClick={() => onNavigate('customers')}
            className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Users className="h-5 w-5 text-green-400 mb-1" />
            <span className="text-xs text-slate-300">Customers</span>
          </button>
          <button
            onClick={() => onNavigate('reviews')}
            className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Star className="h-5 w-5 text-amber-400 mb-1" />
            <span className="text-xs text-slate-300">Reviews</span>
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center text-xs text-teal-400 hover:text-teal-300"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No recent orders</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {recentOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => onNavigate('orders')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white truncate">
                      {order.customer_name || 'Unknown Customer'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-slate-400">#{order.order_number}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{formatTimeAgo(order.created_at)}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(order.total || 0)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

