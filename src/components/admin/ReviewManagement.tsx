'use client';

import { useState, useEffect } from 'react';
import {
  Star,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  MessageSquare,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  AlertCircle,
} from 'lucide-react';

interface Review {
  id: string;
  product_id: string;
  customer_email: string;
  customer_name: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  status: 'pending' | 'approved' | 'rejected';
  verified_purchase: boolean;
  order_id: string | null;
  admin_response: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    title: string;
    handle: string;
  };
}

interface ReviewStats {
  pending: number;
  approved: number;
  rejected: number;
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Selected review for response
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, page, searchQuery]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/reviews?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setStats(data.stats || null);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        // Clear error on success
        setError(null);
        // Show info message if table doesn't exist
        if (data.message) {
          setError(data.message);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError('Error fetching reviews. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: reviewId, status: newStatus }),
      });

      if (response.ok) {
        setSuccess(`Review ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
        fetchReviews();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update review status');
      }
    } catch (err) {
      setError('Error updating review');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('Review deleted successfully');
        fetchReviews();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete review');
      }
    } catch (err) {
      setError('Error deleting review');
    }
  };

  const handleAddResponse = async () => {
    if (!selectedReview || !adminResponse.trim()) return;

    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: selectedReview.id,
          admin_response: adminResponse,
        }),
      });

      if (response.ok) {
        setSuccess('Response added successfully');
        setShowResponseModal(false);
        setSelectedReview(null);
        setAdminResponse('');
        fetchReviews();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to add response');
      }
    } catch (err) {
      setError('Error adding response');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Moderate customer reviews and respond to feedback
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setStatusFilter('pending')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              statusFilter === 'pending'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div
            onClick={() => setStatusFilter('approved')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              statusFilter === 'approved'
                ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div
            onClick={() => setStatusFilter('rejected')}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              statusFilter === 'rejected'
                ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            statusFilter === 'all'
              ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'
          }`}
        >
          <Filter className="h-4 w-4" />
          All Reviews
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reviews Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter === 'pending'
              ? 'No pending reviews to moderate.'
              : 'No reviews match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {renderStars(review.rating)}
                    {getStatusBadge(review.status)}
                    {review.verified_purchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {review.customer_name || 'Anonymous'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      {review.customer_email}
                    </span>
                  </div>
                  
                  {review.products && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                      Product: {review.products.title}
                    </p>
                  )}
                  
                  {review.title && (
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {review.title}
                    </h4>
                  )}
                  
                  {review.content && (
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {review.content}
                    </p>
                  )}
                  
                  {review.admin_response && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border-l-4 border-amber-400 mt-3">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                        Store Response:
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        {review.admin_response}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Submitted {formatDate(review.created_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(review.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(review.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setAdminResponse(review.admin_response || '');
                      setShowResponseModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {review.admin_response ? 'Edit Response' : 'Respond'}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} reviews
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {selectedReview.admin_response ? 'Edit Response' : 'Add Response'}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {renderStars(selectedReview.rating)}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  by {selectedReview.customer_name || 'Anonymous'}
                </span>
              </div>
              {selectedReview.content && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  &quot;{selectedReview.content}&quot;
                </p>
              )}
            </div>
            
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Write your response to this review..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedReview(null);
                  setAdminResponse('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddResponse}
                disabled={!adminResponse.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Save Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

