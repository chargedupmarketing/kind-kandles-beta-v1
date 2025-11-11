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
  submittedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export default function ContactSubmissions() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load mock data on component mount
  useEffect(() => {
    const mockSubmissions: ContactSubmission[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(555) 123-4567',
        subject: 'Question about candle ingredients',
        message: 'Hi! I love your candles and was wondering if you could tell me more about the ingredients you use. I have sensitive skin and want to make sure they\'re safe for me to use. Also, do you offer any unscented options? Thank you!',
        submittedAt: new Date('2024-11-10T14:30:00'),
        isRead: false,
        isStarred: true,
        isArchived: false,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'mchen@company.com',
        phone: '(555) 987-6543',
        subject: 'Bulk order inquiry',
        message: 'Hello, I\'m interested in placing a bulk order for our office. We\'d like to order about 50 candles for our holiday gifts. Could you provide pricing for bulk orders and let me know about customization options?',
        submittedAt: new Date('2024-11-10T11:15:00'),
        isRead: true,
        isStarred: false,
        isArchived: false,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.r.designs@gmail.com',
        subject: 'Collaboration opportunity',
        message: 'Hi there! I\'m a local artist and I love what you\'re doing with Kind Kandles. I was wondering if you\'d be interested in collaborating on some custom candle designs for my upcoming art show. I think our aesthetics would work really well together!',
        submittedAt: new Date('2024-11-09T16:45:00'),
        isRead: true,
        isStarred: true,
        isArchived: false,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      {
        id: '4',
        name: 'David Thompson',
        email: 'dthompson@email.com',
        phone: '(555) 456-7890',
        subject: 'Shipping issue',
        message: 'I placed an order last week (Order #1234) and haven\'t received any shipping updates. Could you please check on the status? I ordered it as a gift and need it by this weekend.',
        submittedAt: new Date('2024-11-08T09:20:00'),
        isRead: true,
        isStarred: false,
        isArchived: true,
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '5',
        name: 'Lisa Park',
        email: 'lisa.park.wellness@gmail.com',
        subject: 'Product feedback',
        message: 'I recently purchased your lavender candle and I absolutely love it! The scent is perfect and it burns so evenly. I wanted to let you know how much I appreciate the quality. I\'ll definitely be ordering more soon!',
        submittedAt: new Date('2024-11-07T20:10:00'),
        isRead: false,
        isStarred: false,
        isArchived: false,
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:109.0) Gecko/111.0 Firefox/119.0'
      }
    ];

    // Load from localStorage or use mock data
    const savedSubmissions = localStorage.getItem('contactSubmissions');
    if (savedSubmissions) {
      const parsed = JSON.parse(savedSubmissions);
      // Convert date strings back to Date objects
      const withDates = parsed.map((sub: any) => ({
        ...sub,
        submittedAt: new Date(sub.submittedAt)
      }));
      setSubmissions(withDates);
    } else {
      setSubmissions(mockSubmissions);
      localStorage.setItem('contactSubmissions', JSON.stringify(mockSubmissions));
    }
  }, []);

  // Save submissions to localStorage whenever they change
  useEffect(() => {
    if (submissions.length > 0) {
      localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
    }
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Apply filter
      switch (filter) {
        case 'unread':
          if (submission.isRead) return false;
          break;
        case 'starred':
          if (!submission.isStarred) return false;
          break;
        case 'archived':
          if (!submission.isArchived) return false;
          break;
        default:
          if (submission.isArchived) return false; // Don't show archived in 'all'
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
    }).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }, [submissions, filter, debouncedSearchTerm]);

  const handleMarkAsRead = (id: string) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, isRead: true } : sub
    ));
  };

  const handleToggleStar = (id: string) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, isStarred: !sub.isStarred } : sub
    ));
  };

  const handleArchive = (id: string) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, isArchived: !sub.isArchived } : sub
    ));
    setSelectedSubmission(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this submission?')) {
      setSubmissions(prev => prev.filter(sub => sub.id !== id));
      setSelectedSubmission(null);
    }
  };

  const handleViewSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    if (!submission.isRead) {
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
    const total = submissions.filter(s => !s.isArchived).length;
    const unread = submissions.filter(s => !s.isRead && !s.isArchived).length;
    const starred = submissions.filter(s => s.isStarred && !s.isArchived).length;
    const archived = submissions.filter(s => s.isArchived).length;
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
                      !submission.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } ${
                      selectedSubmission?.id === submission.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className={`font-medium truncate ${
                            !submission.isRead ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {submission.name}
                          </p>
                          {submission.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          {!submission.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          !submission.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {submission.subject}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {submission.submittedAt.toLocaleDateString()} at {submission.submittedAt.toLocaleTimeString()}
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
                    {selectedSubmission.submittedAt.toLocaleDateString()} at {selectedSubmission.submittedAt.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleStar(selectedSubmission.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedSubmission.isStarred
                        ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
                        : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${selectedSubmission.isStarred ? 'fill-current' : ''}`} />
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
                  {selectedSubmission.ipAddress && (
                    <p>IP Address: {selectedSubmission.ipAddress}</p>
                  )}
                  {selectedSubmission.userAgent && (
                    <p>User Agent: {selectedSubmission.userAgent}</p>
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
