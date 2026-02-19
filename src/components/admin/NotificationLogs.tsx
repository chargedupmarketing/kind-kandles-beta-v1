'use client';

import { useState, useEffect } from 'react';
import { 
  History, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  Loader2,
  RefreshCw,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';

interface NotificationLog {
  id: string;
  notification_type: string;
  recipient_type: 'admin' | 'customer';
  recipient_email: string | null;
  recipient_phone: string | null;
  channel: 'email' | 'sms';
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  subject: string | null;
  body: string | null;
  error_message: string | null;
  external_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

interface LogSummary {
  total_24h: number;
  sent_24h: number;
  failed_24h: number;
  delivered_24h: number;
}

interface Filters {
  type: string;
  status: string;
  recipientType: string;
  channel: string;
  startDate: string;
  endDate: string;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  sent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  delivered: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
};

const STATUS_ICONS = {
  pending: <Clock className="w-4 h-4" />,
  sent: <Send className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
};

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  new_order: 'New Order',
  high_value_order: 'High Value Order',
  order_issues: 'Order Issues',
  new_review: 'New Review',
  new_story: 'New Story',
  new_contact: 'Contact Form',
  new_event_booking: 'Event Booking',
  low_inventory: 'Low Inventory',
  customer_order_delivered: 'Order Delivered',
  customer_review_approved: 'Review Approved',
  customer_story_approved: 'Story Approved',
  customer_event_confirmed: 'Event Confirmed',
  customer_event_reminder: 'Event Reminder',
  customer_abandoned_cart: 'Abandoned Cart',
  test: 'Test Notification',
};

export default function NotificationLogs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [filters, setFilters] = useState<Filters>({
    type: '',
    status: '',
    recipientType: '',
    channel: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());
      
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.recipientType) params.set('recipientType', filters.recipientType);
      if (filters.channel) params.set('channel', filters.channel);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const response = await fetch(`/api/admin/notifications/logs?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', '1000');
      
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const response = await fetch(`/api/admin/notifications/logs?${params}`, {
        credentials: 'include',
      });

      const data = await response.json();
      
      // Convert to CSV
      const headers = ['Date', 'Type', 'Recipient', 'Channel', 'Status', 'Subject', 'Error'];
      const rows = data.logs.map((log: NotificationLog) => [
        new Date(log.created_at).toLocaleString(),
        NOTIFICATION_TYPE_LABELS[log.notification_type] || log.notification_type,
        log.recipient_email || log.recipient_phone || 'N/A',
        log.channel,
        log.status,
        log.subject || '',
        log.error_message || '',
      ]);

      const csv = [headers, ...rows].map(row => row.map((cell: string) => `"${cell}"`).join(',')).join('\n');
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notification-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      recipientType: '',
      channel: '',
      startDate: '',
      endDate: '',
    });
    setPage(0);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-6 h-6 text-pink-500" />
            Notification Logs
          </h2>
          <p className="text-gray-600 mt-1">
            View history of all sent notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${
              showFilters ? 'border-pink-500 text-pink-500' : 'border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total (24h)</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total_24h}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Sent</div>
            <div className="text-2xl font-bold text-blue-600">{summary.sent_24h}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Delivered</div>
            <div className="text-2xl font-bold text-green-600">{summary.delivered_24h}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Failed</div>
            <div className="text-2xl font-bold text-red-600">{summary.failed_24h}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Types</option>
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <select
                value={filters.recipientType}
                onChange={(e) => setFilters({ ...filters, recipientType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Recipients</option>
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={filters.channel}
                onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Channels</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p>No notification logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {NOTIFICATION_TYPE_LABELS[log.notification_type] || log.notification_type}
                      </span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                        log.recipient_type === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {log.recipient_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {log.recipient_email || log.recipient_phone || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        {log.channel === 'email' ? (
                          <Mail className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                        {log.channel}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[log.status]}`}>
                        {STATUS_ICONS[log.status]}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.subject || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-gray-400 hover:text-pink-500 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} logs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-gray-900">
                    {NOTIFICATION_TYPE_LABELS[selectedLog.notification_type] || selectedLog.notification_type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedLog.status]}`}>
                      {STATUS_ICONS[selectedLog.status]}
                      {selectedLog.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Channel</label>
                  <p className="text-gray-900 flex items-center gap-1">
                    {selectedLog.channel === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    {selectedLog.channel}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Recipient Type</label>
                  <p className="text-gray-900 capitalize">{selectedLog.recipient_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Recipient</label>
                  <p className="text-gray-900">{selectedLog.recipient_email || selectedLog.recipient_phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
                {selectedLog.sent_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sent At</label>
                    <p className="text-gray-900">{new Date(selectedLog.sent_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedLog.delivered_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivered At</label>
                    <p className="text-gray-900">{new Date(selectedLog.delivered_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedLog.external_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">External ID</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedLog.external_id}</p>
                  </div>
                )}
              </div>

              {selectedLog.subject && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <p className="text-gray-900">{selectedLog.subject}</p>
                </div>
              )}

              {selectedLog.body && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Body</label>
                  <div 
                    className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 max-h-64 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: selectedLog.body }}
                  />
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium text-red-500 dark:text-red-400">Error Message</label>
                  <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mt-1">{selectedLog.error_message}</p>
                </div>
              )}

              {selectedLog.related_entity_type && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Related Entity</label>
                  <p className="text-gray-900">
                    {selectedLog.related_entity_type}: {selectedLog.related_entity_id}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
