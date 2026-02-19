'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
  Tag,
  X,
  ChevronRight,
  Eye,
  Star,
  Package,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Shield
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';
import { useReauth } from '@/hooks/useReauth';
import ReauthModal from './ReauthModal';

interface CustomerOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
}

interface CustomerTag {
  id: string;
  name: string;
  color: string;
}

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  accepts_marketing: boolean;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  last_order_at: string | null;
  notes: string | null;
  tags?: CustomerTag[];
  orders?: CustomerOrder[];
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sortBy, setSortBy] = useState<'total_spent' | 'total_orders' | 'created_at'>('total_spent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  const { 
    isReauthenticated, 
    showReauthModal, 
    requireReauth, 
    handleReauthSuccess, 
    handleReauthCancel,
    userEmail 
  } = useReauth();

  useEffect(() => {
    if (isReauthenticated) {
      fetchCustomers();
    }
  }, [sortBy, sortOrder, isReauthenticated]);

  // Check reauth on component mount
  useEffect(() => {
    requireReauth();
  }, [requireReauth]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?sort=${sortBy}&order=${sortOrder}`, {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });
      const data = await response.json();
      if (data.customer) {
        setSelectedCustomer(data.customer);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'First Name', 'Last Name', 'Phone', 'Total Orders', 'Total Spent', 'Marketing Opt-in', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(c => [
        c.email,
        c.first_name || '',
        c.last_name || '',
        c.phone || '',
        c.total_orders,
        c.total_spent.toFixed(2),
        c.accepts_marketing ? 'Yes' : 'No',
        new Date(c.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredCustomers = customers.filter(c =>
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.first_name && c.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.last_name && c.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    total: customers.length,
    marketing: customers.filter(c => c.accepts_marketing).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    avgValue: customers.length > 0 ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length : 0
  };

  // Show reauth modal if not authenticated
  if (!isReauthenticated) {
    return (
      <>
        {showReauthModal && (
          <ReauthModal
            onSuccess={handleReauthSuccess}
            onCancel={handleReauthCancel}
            userEmail={userEmail}
          />
        )}
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Shield className="h-16 w-16 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Security Verification Required</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            This section contains sensitive customer data.
          </p>
          <button
            onClick={() => requireReauth()}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Verify Identity
          </button>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Reauth Modal */}
      {showReauthModal && (
        <ReauthModal
          onSuccess={handleReauthSuccess}
          onCancel={handleReauthCancel}
          userEmail={userEmail}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Customers</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {customers.length} total customers
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats - Scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible">
        <div className="flex-shrink-0 w-36 sm:w-auto bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="flex-shrink-0 w-36 sm:w-auto bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Subscribed</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.marketing}</p>
        </div>
        <div className="flex-shrink-0 w-36 sm:w-auto bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Revenue</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalRevenue)}</p>
        </div>
        <div className="flex-shrink-0 w-36 sm:w-auto bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Value</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stats.avgValue)}</p>
        </div>
      </div>

      {/* Filters - Stack on mobile */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
          />
        </div>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field as any);
            setSortOrder(order as any);
          }}
          className="px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
        >
          <option value="total_spent-desc">Highest Spenders</option>
          <option value="total_spent-asc">Lowest Spenders</option>
          <option value="total_orders-desc">Most Orders</option>
          <option value="total_orders-asc">Fewest Orders</option>
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
        </select>
      </div>

      {/* Customer Detail Drawer - Full screen on mobile */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-stretch sm:justify-end">
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg h-[95vh] sm:h-full overflow-y-auto shadow-xl rounded-t-2xl sm:rounded-none">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customer Details</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Customer Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
                    {(selectedCustomer.first_name?.[0] || selectedCustomer.email[0]).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                      {selectedCustomer.first_name || selectedCustomer.last_name 
                        ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim()
                        : 'No Name'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{selectedCustomer.email}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${selectedCustomer.email}`} className="text-blue-600 hover:underline text-sm truncate">
                      {selectedCustomer.email}
                    </a>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${selectedCustomer.phone}`} className="text-blue-600 hover:underline text-sm">
                        {selectedCustomer.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-teal-600">{formatPrice(selectedCustomer.total_spent)}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{selectedCustomer.total_orders}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Orders</p>
                  </div>
                </div>

                {/* Marketing Status */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <span className="text-sm">Newsletter</span>
                  </div>
                  <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    selectedCustomer.accepts_marketing
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {selectedCustomer.accepts_marketing ? 'Subscribed' : 'Not Subscribed'}
                  </span>
                </div>

                {/* Tags */}
                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2 text-slate-900 dark:text-white">Tags</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order History */}
                <div>
                  <h5 className="text-sm font-medium mb-3 text-slate-900 dark:text-white">Order History</h5>
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCustomer.orders.map(order => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 dark:text-white">{order.order_number}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()} • {order.items_count} items
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{formatPrice(order.total)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              order.status === 'processing' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-sm">No orders yet</p>
                  )}
                </div>

                {/* Notes */}
                {selectedCustomer.notes && (
                  <div>
                    <h5 className="text-sm font-medium mb-2 text-slate-900 dark:text-white">Notes</h5>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                      {selectedCustomer.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers - Desktop Table / Mobile Cards */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Orders</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Last Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {(customer.first_name?.[0] || customer.email[0]).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {customer.first_name || customer.last_name 
                            ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                            : 'No Name'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-slate-900 dark:text-white">{customer.total_orders}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-teal-600">{formatPrice(customer.total_spent)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {customer.last_order_at 
                        ? new Date(customer.last_order_at).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {customer.accepts_marketing ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs">
                        <Mail className="h-3 w-3" />
                        Subscribed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs">
                        Not Subscribed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => fetchCustomerDetails(customer.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-slate-700 dark:text-slate-200"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {filteredCustomers.map((customer) => {
            const isExpanded = expandedCustomerId === customer.id;
            
            return (
              <div key={customer.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                      {(customer.first_name?.[0] || customer.email[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {customer.first_name || customer.last_name 
                          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                          : 'No Name'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-semibold text-teal-600 text-sm">{formatPrice(customer.total_spent)}</p>
                    <p className="text-xs text-gray-500">{customer.total_orders} orders</p>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
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
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Newsletter</span>
                      {customer.accepts_marketing ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs">
                          <Mail className="h-3 w-3" />
                          Subscribed
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not Subscribed</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last Order</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {customer.last_order_at 
                          ? new Date(customer.last_order_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                    <button
                      onClick={() => fetchCustomerDetails(customer.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 active:bg-teal-800 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      View Full Details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 px-4">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
