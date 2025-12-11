'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw,
  BarChart3,
  Clock,
  Flame
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  previousRevenue: number;
  previousOrders: number;
}

interface TopProduct {
  product_id: string;
  product_title: string;
  total_quantity: number;
  total_revenue: number;
}

interface LowStockProduct {
  product_id: string;
  product_title: string;
  variant_id: string;
  variant_title: string;
  sku: string;
  inventory_quantity: number;
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

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const [overviewRes, topProductsRes, lowStockRes, recentOrdersRes] = await Promise.all([
        fetch(`/api/analytics/overview?range=${dateRange}`, {
          headers: { 'Authorization': 'Bearer admin-token' }
        }),
        fetch(`/api/analytics/top-products?range=${dateRange}&limit=5`, {
          headers: { 'Authorization': 'Bearer admin-token' }
        }),
        fetch('/api/analytics/low-stock?threshold=5', {
          headers: { 'Authorization': 'Bearer admin-token' }
        }),
        fetch('/api/orders?limit=5', {
          headers: { 'Authorization': 'Bearer admin-token' }
        })
      ]);

      const [overviewData, topProductsData, lowStockData, ordersData] = await Promise.all([
        overviewRes.json(),
        topProductsRes.json(),
        lowStockRes.json(),
        recentOrdersRes.json()
      ]);

      setOverview(overviewData);
      setTopProducts(topProductsData.products || []);
      setLowStockProducts(lowStockData.products || []);
      setRecentOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getPercentChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const getDateRangeLabel = (range: DateRange): string => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case 'year': return 'This year';
      case 'all': return 'All time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'paid': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  const revenueChange = overview ? getPercentChange(overview.totalRevenue, overview.previousRevenue) : { value: 0, isPositive: true };
  const ordersChange = overview ? getPercentChange(overview.totalOrders, overview.previousOrders) : { value: 0, isPositive: true };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Overview of your store performance
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="year">This year</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue */}
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            {overview && overview.previousRevenue > 0 && (
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${revenueChange.isPositive ? 'text-green-200' : 'text-red-200'}`}>
                {revenueChange.isPositive ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" /> : <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />}
                {revenueChange.value.toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{formatPrice(overview?.totalRevenue || 0)}</p>
          <p className="text-pink-100 text-xs sm:text-sm mt-1">Total Revenue</p>
        </div>

        {/* Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            {overview && overview.previousOrders > 0 && (
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${ordersChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {ordersChange.isPositive ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" /> : <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" />}
                {ordersChange.value.toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{overview?.totalOrders || 0}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Total Orders</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(overview?.avgOrderValue || 0)}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Avg. Order Value</p>
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            {overview && overview.newCustomers > 0 && (
              <span className="text-xs sm:text-sm text-green-600 flex items-center gap-1">
                +{overview.newCustomers} new
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{overview?.totalCustomers || 0}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Total Customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Top Selling</h3>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">{getDateRangeLabel(dateRange)}</span>
          </div>
          <div className="p-3 sm:p-4">
            {topProducts.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.product_id} className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {product.product_title}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {product.total_quantity} sold
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm text-pink-600">{formatPrice(product.total_revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                <p className="text-sm">No sales data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Low Stock</h3>
            </div>
            {lowStockProducts.length > 0 && (
              <span className="px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium">
                {lowStockProducts.length}
              </span>
            )}
          </div>
          <div className="p-3 sm:p-4">
            {lowStockProducts.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.variant_id} className="flex items-center justify-between p-2 sm:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {product.product_title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {product.variant_title !== 'Default Title' && `${product.variant_title} • `}
                        SKU: {product.sku || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap ${
                        product.inventory_quantity === 0 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {product.inventory_quantity === 0 ? 'Out' : `${product.inventory_quantity} left`}
                      </span>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-center text-xs sm:text-sm text-gray-500 pt-2">
                    +{lowStockProducts.length - 5} more items
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                <p className="text-sm">All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Recent Orders</h3>
          </div>
          <a href="#" className="text-xs sm:text-sm text-pink-600 hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </a>
        </div>
        
        {/* Mobile Card View */}
        <div className="sm:hidden p-3">
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{order.order_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate mr-2">{order.customer_name}</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="font-semibold text-pink-600">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          {recentOrders.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">{order.order_number}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-pink-600">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No orders yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            <span className="text-xs sm:text-sm text-blue-600 font-medium">Today</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-700">
            {recentOrders.filter(o => 
              new Date(o.created_at).toDateString() === new Date().toDateString()
            ).length}
          </p>
          <p className="text-xs sm:text-sm text-blue-600">orders today</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            <span className="text-xs sm:text-sm text-green-600 font-medium">Conversion</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-700">--</p>
          <p className="text-xs sm:text-sm text-green-600">coming soon</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            <span className="text-xs sm:text-sm text-purple-600 font-medium">Views</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-700">--</p>
          <p className="text-xs sm:text-sm text-purple-600">coming soon</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            <span className="text-xs sm:text-sm text-orange-600 font-medium">Low Stock</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-700">{lowStockProducts.length}</p>
          <p className="text-xs sm:text-sm text-orange-600">items</p>
        </div>
      </div>
    </div>
  );
}

