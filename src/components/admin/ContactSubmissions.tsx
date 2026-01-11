'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Mail, 
  Calendar, 
  User, 
  MessageSquare, 
  Phone, 
  MapPin,
  Eye,
  Trash2,
  Archive,
  Star,
  Filter,
  Search,
  Download
} from 'lucide-react';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  ip_address?: string;
  user_agent?: string;
}

export default function ContactSubmissions() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch submissions from database
  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/contact');
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
    }
  };

  // Load submissions on component mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Apply filter
      switch (filter) {
        case 'unread':
          if (submission.is_read) return false;
          break;
        case 'starred':
          if (!submission.is_starred) return false;
          break;
        case 'archived':
          if (!submission.is_archived) return false;
          break;
        default:
          if (submission.is_archived) return false; // Don't show archived in 'all'
      }

      // Apply search
      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase();
        return (
          submission.name.toLowerCase().includes(term) ||
          submission.email.toLowerCase().includes(term) ||
          submission.subject.toLowerCase().includes(term) ||
          submission.message.toLowerCase().includes(term)
        );
      }

      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [submissions, filter, debouncedSearchTerm]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });
      if (response.ok) {
        setSubmissions(prev => prev.map(sub => 
          sub.id === id ? { ...sub, is_read: true } : sub
        ));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleToggleStar = async (id: string) => {
    const submission = submissions.find(s => s.id === id);
    if (!submission) return;

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: !submission.is_starred }),
      });
      if (response.ok) {
        setSubmissions(prev => prev.map(sub => 
          sub.id === id ? { ...sub, is_starred: !sub.is_starred } : sub
        ));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleArchive = async (id: string) => {
    const submission = submissions.find(s => s.id === id);
    if (!submission) return;

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: !submission.is_archived }),
      });
      if (response.ok) {
        setSubmissions(prev => prev.map(sub => 
          sub.id === id ? { ...sub, is_archived: !sub.is_archived } : sub
        ));
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('Error archiving:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this submission?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSubmissions(prev => prev.filter(sub => sub.id !== id));
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };

  const handleViewSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    if (!submission.is_read) {
      handleMarkAsRead(submission.id);
    }
  };

  const exportSubmissions = () => {
    const dataStr = JSON.stringify(filteredSubmissions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contact-submissions-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const getStats = () => {
    const total = submissions.filter(s => !s.is_archived).length;
    const unread = submissions.filter(s => !s.is_read && !s.is_archived).length;
    const starred = submissions.filter(s => s.is_starred && !s.is_archived).length;
    const archived = submissions.filter(s => s.is_archived).length;
    return { total, unread, starred, archived };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Contact Form Submissions</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage and respond to customer inquiries</p>
        </div>
        <button
          onClick={exportSubmissions}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Unread</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.unread}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Starred</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.starred}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <Archive className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Archived</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.archived}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          {/* Filters and Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="starred">Starred</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Search submissions..."
              />
            </div>
          </div>

          {/* Submissions List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No submissions found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => handleViewSubmission(submission)}
                    className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      !submission.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } ${
                      selectedSubmission?.id === submission.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className={`font-medium truncate ${
                            !submission.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {submission.name}
                          </p>
                          {submission.is_starred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          {!submission.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          !submission.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {submission.subject}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submission Details */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          {selectedSubmission ? (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedSubmission.subject}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(selectedSubmission.created_at).toLocaleDateString()} at {new Date(selectedSubmission.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleStar(selectedSubmission.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedSubmission.is_starred
                        ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
                        : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${selectedSubmission.is_starred ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleArchive(selectedSubmission.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSubmission.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-900 dark:text-slate-100">{selectedSubmission.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a 
                    href={`mailto:${selectedSubmission.email}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedSubmission.email}
                  </a>
                </div>
                {selectedSubmission.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a 
                      href={`tel:${selectedSubmission.phone}`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {selectedSubmission.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</h4>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                    {selectedSubmission.message}
                  </p>
                </div>
              </div>

              {/* Technical Info */}
              <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Technical Details</h4>
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {selectedSubmission.ip_address && (
                    <p>IP Address: {selectedSubmission.ip_address}</p>
                  )}
                  {selectedSubmission.user_agent && (
                    <p>User Agent: {selectedSubmission.user_agent}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <a
                  href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg transition-colors"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Eye className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Select a submission to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
