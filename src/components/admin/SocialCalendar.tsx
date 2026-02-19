'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Image as ImageIcon,
  Video,
  Hash,
  AtSign,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Filter,
  Search,
  MoreVertical,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface SocialCalendar {
  id: string;
  name: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'pinterest' | 'linkedin' | 'youtube' | 'threads';
  description?: string;
  color: string;
  is_active: boolean;
  created_by: string;
  created_by_name: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
}

interface SocialPost {
  id: string;
  calendar_id: string;
  title: string;
  content: string;
  media_urls: string[];
  scheduled_date: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  post_url?: string;
  hashtags: string[];
  mentions: string[];
  location?: string;
  notes?: string;
  created_by: string;
  created_by_name: string;
  published_at?: string;
  published_by?: string;
  created_at: string;
  updated_at: string;
  calendar?: {
    name: string;
    platform: string;
    color: string;
  };
  collaborators?: {
    user_id: string;
    user_name: string;
  }[];
}

const PLATFORM_CONFIG = {
  instagram: { icon: Instagram, color: '#E4405F', label: 'Instagram' },
  facebook: { icon: Facebook, color: '#1877F2', label: 'Facebook' },
  tiktok: { icon: Video, color: '#000000', label: 'TikTok' },
  twitter: { icon: Twitter, color: '#1DA1F2', label: 'Twitter/X' },
  pinterest: { icon: ImageIcon, color: '#E60023', label: 'Pinterest' },
  linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
  youtube: { icon: Youtube, color: '#FF0000', label: 'YouTube' },
  threads: { icon: AtSign, color: '#000000', label: 'Threads' },
};

export default function SocialCalendar() {
  const { user } = useAdmin();
  const [calendars, setCalendars] = useState<SocialCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<SocialCalendar | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateCalendar, setShowCreateCalendar] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Calendar view state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New calendar form
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    platform: 'instagram' as const,
    description: '',
    color: '#db2777',
  });

  // New post form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    media_urls: [] as string[],
    scheduled_date: '',
    scheduled_time: '',
    hashtags: '',
    mentions: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchCalendars();
  }, []);

  useEffect(() => {
    if (selectedCalendar) {
      fetchPosts();
    }
  }, [selectedCalendar, currentDate, viewMode]);

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/admin/social-calendar', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars || []);
        if (data.calendars.length > 0 && !selectedCalendar) {
          setSelectedCalendar(data.calendars[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      showError('Failed to load calendars');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!selectedCalendar) return;

    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const params = new URLSearchParams({
        calendar_id: selectedCalendar.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/admin/social-calendar/posts?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleCreateCalendar = async () => {
    if (!newCalendar.name || !newCalendar.platform) {
      showError('Name and platform are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/social-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newCalendar),
      });

      if (response.ok) {
        const data = await response.json();
        setCalendars([...calendars, data.calendar]);
        setSelectedCalendar(data.calendar);
        setShowCreateCalendar(false);
        setNewCalendar({ name: '', platform: 'instagram', description: '', color: '#db2777' });
        showSuccess('Calendar created successfully!');
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create calendar');
      }
    } catch (error) {
      console.error('Error creating calendar:', error);
      showError('Failed to create calendar');
    }
  };

  const handleCreatePost = async () => {
    if (!selectedCalendar || !newPost.title || !newPost.content || !newPost.scheduled_date || !newPost.scheduled_time) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      const scheduledDateTime = new Date(`${newPost.scheduled_date}T${newPost.scheduled_time}`);

      const response = await fetch('/api/admin/social-calendar/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          calendar_id: selectedCalendar.id,
          title: newPost.title,
          content: newPost.content,
          media_urls: newPost.media_urls,
          scheduled_date: scheduledDateTime.toISOString(),
          status: 'draft',
          hashtags: newPost.hashtags.split(',').map(h => h.trim()).filter(Boolean),
          mentions: newPost.mentions.split(',').map(m => m.trim()).filter(Boolean),
          location: newPost.location || null,
          notes: newPost.notes || null,
        }),
      });

      if (response.ok) {
        showSuccess('Post created successfully!');
        setShowCreatePost(false);
        setNewPost({
          title: '',
          content: '',
          media_urls: [],
          scheduled_date: '',
          scheduled_time: '',
          hashtags: '',
          mentions: '',
          location: '',
          notes: '',
        });
        fetchPosts();
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showError('Failed to create post');
    }
  };

  const handleUpdatePost = async (postId: string, updates: Partial<SocialPost>) => {
    try {
      const response = await fetch(`/api/admin/social-calendar/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        showSuccess('Post updated successfully!');
        setEditingPost(null);
        fetchPosts();
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      showError('Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/admin/social-calendar/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showSuccess('Post deleted successfully!');
        fetchPosts();
      } else {
        showError('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Failed to delete post');
    }
  };

  const handleDeleteCalendar = async (calendarId: string) => {
    if (!confirm('Are you sure you want to delete this calendar? All posts will be deleted.')) return;

    try {
      const response = await fetch(`/api/admin/social-calendar/${calendarId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setCalendars(calendars.filter(c => c.id !== calendarId));
        if (selectedCalendar?.id === calendarId) {
          setSelectedCalendar(calendars.find(c => c.id !== calendarId) || null);
        }
        showSuccess('Calendar deleted successfully!');
      } else {
        showError('Failed to delete calendar');
      }
    } catch (error) {
      console.error('Error deleting calendar:', error);
      showError('Failed to delete calendar');
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (viewMode === 'month') {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    } else if (viewMode === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
      return date;
    } else {
      date.setHours(0, 0, 0, 0);
      return date;
    }
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    if (viewMode === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
      return date;
    } else if (viewMode === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day + 6);
      date.setHours(23, 59, 59, 999);
      return date;
    } else {
      date.setHours(23, 59, 59, 999);
      return date;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduled_date);
      return (
        postDate.getFullYear() === date.getFullYear() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getDate() === date.getDate()
      );
    });
  };

  const filteredPosts = posts.filter(post => {
    if (filterStatus !== 'all' && post.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.hashtags.some(h => h.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'scheduled': return 'blue';
      case 'published': return 'green';
      case 'failed': return 'red';
      case 'cancelled': return 'orange';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-purple-600" />
            Social Media Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Plan and schedule your social media content across platforms
          </p>
        </div>
        <button
          onClick={() => setShowCreateCalendar(true)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Platform Calendar
        </button>
      </div>

      {/* Calendar Selector Dropdown */}
      {calendars.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Platform:
              </label>
              <select
                value={selectedCalendar?.id || ''}
                onChange={(e) => {
                  const calendar = calendars.find(c => c.id === e.target.value);
                  setSelectedCalendar(calendar || null);
                }}
                className="flex-1 max-w-md px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                {calendars.map(calendar => {
                  const config = PLATFORM_CONFIG[calendar.platform];
                  return (
                    <option key={calendar.id} value={calendar.id}>
                      {config.label} - {calendar.name} (by {calendar.created_by_name})
                    </option>
                  );
                })}
              </select>
              {selectedCalendar && (
                <button
                  onClick={() => handleDeleteCalendar(selectedCalendar.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Calendar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Calendars State */}
      {calendars.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Social Calendars Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first social media calendar to start planning content
          </p>
          <button
            onClick={() => setShowCreateCalendar(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Calendar
          </button>
        </div>
      )}

      {/* Calendar View */}
      {selectedCalendar && (
        <>
          {/* View Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white ml-2">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
              </div>

              {/* View Mode Selector */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'month'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowCreatePost(true)}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Post
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Calendar Grid - Month View */}
          {viewMode === 'month' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 dark:divide-gray-700">
                {getMonthDays().map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const dayPosts = getPostsForDate(day);

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 ${
                        !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''
                      } ${isToday ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        isToday
                          ? 'text-purple-600 dark:text-purple-400'
                          : isCurrentMonth
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.slice(0, 3).map(post => {
                          const statusColor = getStatusColor(post.status);
                          return (
                            <div
                              key={post.id}
                              onClick={() => setEditingPost(post)}
                              className={`text-xs p-1.5 rounded cursor-pointer bg-${statusColor}-100 dark:bg-${statusColor}-900/30 text-${statusColor}-700 dark:text-${statusColor}-300 hover:bg-${statusColor}-200 dark:hover:bg-${statusColor}-900/50 transition-colors truncate`}
                              title={post.title}
                            >
                              {formatTime(post.scheduled_date)} - {post.title}
                            </div>
                          );
                        })}
                        {dayPosts.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            +{dayPosts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredPosts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Posts Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first post to start scheduling content
                  </p>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create First Post
                  </button>
                </div>
              ) : (
                filteredPosts.map(post => {
                  const statusColor = getStatusColor(post.status);
                  const PlatformIcon = PLATFORM_CONFIG[selectedCalendar.platform].icon;

                  return (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: `${selectedCalendar.color}20` }}
                          >
                            <PlatformIcon className="h-6 w-6" style={{ color: selectedCalendar.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {post.title}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 dark:bg-${statusColor}-900/30 text-${statusColor}-700 dark:text-${statusColor}-300`}>
                                {post.status}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(post.scheduled_date)} at {formatTime(post.scheduled_date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Users className="h-4 w-4" />
                                <span>{post.created_by_name}</span>
                              </div>
                              {post.hashtags.length > 0 && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Hash className="h-4 w-4" />
                                  <span>{post.hashtags.length} tags</span>
                                </div>
                              )}
                              {post.media_urls.length > 0 && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <ImageIcon className="h-4 w-4" />
                                  <span>{post.media_urls.length} media</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingPost(post)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Create Calendar Modal */}
      {showCreateCalendar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create Social Media Calendar
                </h2>
                <button
                  onClick={() => setShowCreateCalendar(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Platform *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setNewCalendar({ ...newCalendar, platform: key as any, color: config.color })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          newCalendar.platform === key
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2" style={{ color: config.color }} />
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {config.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calendar Name *
                </label>
                <input
                  type="text"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                  placeholder="e.g., Main Instagram Account, Product Launches"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newCalendar.description}
                  onChange={(e) => setNewCalendar({ ...newCalendar, description: e.target.value })}
                  placeholder="What's this calendar for?"
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calendar Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCalendar.color}
                    onChange={(e) => setNewCalendar({ ...newCalendar, color: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCalendar.color}
                    onChange={(e) => setNewCalendar({ ...newCalendar, color: e.target.value })}
                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateCalendar(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCalendar}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Create Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Post Modal */}
      {(showCreatePost || editingPost) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreatePost(false);
                    setEditingPost(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Post Title *
                </label>
                <input
                  type="text"
                  value={editingPost ? editingPost.title : newPost.title}
                  onChange={(e) => editingPost
                    ? setEditingPost({ ...editingPost, title: e.target.value })
                    : setNewPost({ ...newPost, title: e.target.value })
                  }
                  placeholder="Give your post a title"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={editingPost ? editingPost.content : newPost.content}
                  onChange={(e) => editingPost
                    ? setEditingPost({ ...editingPost, content: e.target.value })
                    : setNewPost({ ...newPost, content: e.target.value })
                  }
                  placeholder="Write your post content..."
                  rows={6}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(editingPost ? editingPost.content : newPost.content).length} characters
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={editingPost
                      ? new Date(editingPost.scheduled_date).toISOString().split('T')[0]
                      : newPost.scheduled_date
                    }
                    onChange={(e) => editingPost
                      ? setEditingPost({ ...editingPost, scheduled_date: new Date(e.target.value + 'T' + new Date(editingPost.scheduled_date).toTimeString().split(' ')[0]).toISOString() })
                      : setNewPost({ ...newPost, scheduled_date: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scheduled Time *
                  </label>
                  <input
                    type="time"
                    value={editingPost
                      ? new Date(editingPost.scheduled_date).toTimeString().split(' ')[0].substring(0, 5)
                      : newPost.scheduled_time
                    }
                    onChange={(e) => editingPost
                      ? setEditingPost({ ...editingPost, scheduled_date: new Date(new Date(editingPost.scheduled_date).toISOString().split('T')[0] + 'T' + e.target.value).toISOString() })
                      : setNewPost({ ...newPost, scheduled_time: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Hash className="h-4 w-4 inline mr-1" />
                  Hashtags
                </label>
                <input
                  type="text"
                  value={editingPost ? editingPost.hashtags.join(', ') : newPost.hashtags}
                  onChange={(e) => editingPost
                    ? setEditingPost({ ...editingPost, hashtags: e.target.value.split(',').map(h => h.trim()).filter(Boolean) })
                    : setNewPost({ ...newPost, hashtags: e.target.value })
                  }
                  placeholder="kindness, selfcare, candles (comma separated)"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Mentions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <AtSign className="h-4 w-4 inline mr-1" />
                  Mentions
                </label>
                <input
                  type="text"
                  value={editingPost ? editingPost.mentions.join(', ') : newPost.mentions}
                  onChange={(e) => editingPost
                    ? setEditingPost({ ...editingPost, mentions: e.target.value.split(',').map(m => m.trim()).filter(Boolean) })
                    : setNewPost({ ...newPost, mentions: e.target.value })
                  }
                  placeholder="@username1, @username2 (comma separated)"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={editingPost ? editingPost.location || '' : newPost.location}
                  onChange={(e) => editingPost
                    ? setEditingPost({ ...editingPost, location: e.target.value })
                    : setNewPost({ ...newPost, location: e.target.value })
                  }
                  placeholder="Maryland, USA"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Internal Notes
                </label>
                <textarea
                  value={editingPost ? editingPost.notes || '' : newPost.notes}
                  onChange={(e) => editingPost
                    ? setEditingPost({ ...editingPost, notes: e.target.value })
                    : setNewPost({ ...newPost, notes: e.target.value })
                  }
                  placeholder="Internal notes (not visible in post)"
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Status (only for editing) */}
              {editingPost && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editingPost.status}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  setEditingPost(null);
                }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingPost) {
                    handleUpdatePost(editingPost.id, editingPost);
                  } else {
                    handleCreatePost();
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                {editingPost ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Social Calendar Tips
        </h3>
        <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-300">
          <li>• <strong>Multiple Calendars:</strong> Create separate calendars for different platforms or campaigns</li>
          <li>• <strong>Scheduling:</strong> Plan content in advance and maintain consistent posting schedules</li>
          <li>• <strong>Collaboration:</strong> All admins can view and edit posts, with creator attribution</li>
          <li>• <strong>Notifications:</strong> Get reminders 24 hours before scheduled posts</li>
        </ul>
      </div>
    </div>
  );
}
