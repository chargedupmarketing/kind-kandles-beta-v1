'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download
} from 'lucide-react';
import type { EventBooking, BookingStatus, PaymentStatus } from '@/lib/types';

interface BookingWithDetails extends EventBooking {
  event_title?: string;
  occurrence_date?: string;
  occurrence_time?: string;
}

export default function EventBookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | 'all'>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/events/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!booking.customer_name.toLowerCase().includes(term) && 
            !booking.customer_email.toLowerCase().includes(term) &&
            !booking.event_title?.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== 'all' && booking.booking_status !== filterStatus) {
        return false;
      }

      // Payment filter
      if (filterPayment !== 'all' && booking.payment_status !== filterPayment) {
        return false;
      }

      return true;
    });
  }, [bookings, searchTerm, filterStatus, filterPayment]);

  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const response = await fetch(`/api/admin/events/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_status: status }),
      });

      if (!response.ok) throw new Error('Failed to update booking');

      alert('Booking status updated');
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  const handleUpdatePayment = async (bookingId: string, status: PaymentStatus) => {
    try {
      const response = await fetch(`/api/admin/events/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: status }),
      });

      if (!response.ok) throw new Error('Failed to update payment');

      alert('Payment status updated');
      fetchBookings();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment');
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await fetch(`/api/admin/events/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete booking');

      alert('Booking deleted');
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Event',
      'Customer Name',
      'Email',
      'Phone',
      'Participants',
      'Total Price',
      'Status',
      'Payment Status',
      'Notes'
    ];

    const rows = filteredBookings.map(booking => [
      booking.occurrence_date || '',
      booking.event_title || '',
      booking.customer_name,
      booking.customer_email,
      booking.customer_phone || '',
      booking.number_of_participants,
      booking.total_price,
      booking.booking_status,
      booking.payment_status,
      booking.special_requests || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: BookingStatus) => {
    const colors: Record<BookingStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    return colors[status] || colors.pending;
  };

  const getPaymentColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      deposit_paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return colors[status] || colors.pending;
  };

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.booking_status === 'pending').length,
      confirmed: bookings.filter(b => b.booking_status === 'confirmed').length,
      revenue: bookings
        .filter(b => b.payment_status === 'paid' || b.payment_status === 'deposit_paid')
        .reduce((sum, b) => sum + b.total_price, 0),
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Event Bookings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customer event reservations
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confirmed</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue</div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            ${stats.revenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as BookingStatus | 'all')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
            <option value="no_show">No Show</option>
          </select>

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value as PaymentStatus | 'all')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="deposit_paid">Deposit Paid</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            {searchTerm || filterStatus !== 'all' || filterPayment !== 'all'
              ? 'Try adjusting your filters'
              : 'Bookings will appear here when customers make reservations'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left: Booking Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {booking.event_title || 'Event'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.occurrence_date} at {booking.occurrence_time}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(booking.booking_status)}`}>
                        {booking.booking_status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPaymentColor(booking.payment_status)}`}>
                        {booking.payment_status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{booking.customer_name}</span>
                      <span className="text-gray-400">•</span>
                      <a href={`mailto:${booking.customer_email}`} className="text-teal-600 hover:underline">
                        {booking.customer_email}
                      </a>
                    </div>
                    {booking.customer_phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${booking.customer_phone}`} className="text-teal-600 hover:underline">
                          {booking.customer_phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>{booking.number_of_participants} participants</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">${booking.total_price.toFixed(2)}</span>
                    </div>
                  </div>

                  {booking.special_requests && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Notes:</strong> {booking.special_requests}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex lg:flex-col gap-2">
                  <select
                    value={booking.booking_status}
                    onChange={(e) => handleUpdateStatus(booking.id, e.target.value as BookingStatus)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                    <option value="no_show">No Show</option>
                  </select>

                  <select
                    value={booking.payment_status}
                    onChange={(e) => handleUpdatePayment(booking.id, e.target.value as PaymentStatus)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed</option>
                  </select>

                  <button
                    onClick={() => handleDelete(booking.id)}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
