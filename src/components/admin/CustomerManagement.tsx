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
  TrendingUp
} from 'lucide-react';
import { formatPrice } from '@/lib/localStore';

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

  useEffect(() => {
    fetchCustomers();
  }, [sortBy, sortOrder]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {customers.length} total customers
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Customers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Newsletter Subscribers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.marketing}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-pink-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Customer Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(stats.avgValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field as any);
            setSortOrder(order as any);
          }}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="total_spent-desc">Highest Spenders</option>
          <option value="total_spent-asc">Lowest Spenders</option>
          <option value="total_orders-desc">Most Orders</option>
          <option value="total_orders-asc">Fewest Orders</option>
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
        </select>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Customer Details</h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {(selectedCustomer.first_name?.[0] || selectedCustomer.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">
                      {selectedCustomer.first_name || selectedCustomer.last_name 
                        ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim()
                        : 'No Name'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedCustomer.email}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${selectedCustomer.email}`} className="text-blue-600 hover:underline">
                      {selectedCustomer.email}
                    </a>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${selectedCustomer.phone}`} className="text-blue-600 hover:underline">
                        {selectedCustomer.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Customer since {new Date(selectedCustomer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-pink-600">{formatPrice(selectedCustomer.total_spent)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedCustomer.total_orders}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Orders</p>
                  </div>
                </div>

                {/* Marketing Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>Newsletter Subscription</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                    <h5 className="text-sm font-medium mb-2">Tags</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-sm font-medium"
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
                  <h5 className="text-sm font-medium mb-3">Order History</h5>
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCustomer.orders.map(order => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()} • {order.items_count} items
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.total)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No orders yet</p>
                  )}
                </div>

                {/* Notes */}
                {selectedCustomer.notes && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Notes</h5>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                      {selectedCustomer.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
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
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {(customer.first_name?.[0] || customer.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {customer.first_name || customer.last_name 
                          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                          : 'No Name'}
                      </p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{customer.total_orders}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-pink-600">{formatPrice(customer.total_spent)}</span>
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
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}

