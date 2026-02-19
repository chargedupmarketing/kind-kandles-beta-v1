'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import {
  Calendar as CalendarIcon,
  Plus,
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
  ChevronDown,
  Filter,
  Search,
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
  created_at: string;
  updated_at: string;
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

export default function SocialCalendarMobile() {
  const { user } = useAdmin();
  const [calendars, setCalendars] = useState<SocialCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<SocialCalendar | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateCalendar, setShowCreateCalendar] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
  }, [selectedCalendar]);

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
      const params = new URLSearchParams({
        calendar_id: selectedCalendar.id,
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
        showSuccess('Calendar created!');
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
          media_urls: [],
          scheduled_date: scheduledDateTime.toISOString(),
          status: 'draft',
          hashtags: newPost.hashtags.split(',').map(h => h.trim()).filter(Boolean),
          mentions: newPost.mentions.split(',').map(m => m.trim()).filter(Boolean),
          location: newPost.location || null,
          notes: newPost.notes || null,
        }),
      });

      if (response.ok) {
        showSuccess('Post created!');
        setShowCreatePost(false);
        setNewPost({
          title: '',
          content: '',
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
        showSuccess('Post updated!');
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
    if (!confirm('Delete this post?')) return;

    try {
      const response = await fetch(`/api/admin/social-calendar/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showSuccess('Post deleted!');
        fetchPosts();
      } else {
        showError('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Failed to delete post');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

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

  const filteredPosts = posts.filter(post => {
    if (filterStatus !== 'all' && post.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <CalendarIcon className="h-6 w-6 text-purple-600" />
          Social Calendar
        </h1>

        {/* Calendar Selector */}
        {calendars.length > 0 ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowCalendarSelector(!showCalendarSelector)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3">
                {selectedCalendar && (
                  <>
                    {(() => {
                      const Icon = PLATFORM_CONFIG[selectedCalendar.platform].icon;
                      return <Icon className="h-5 w-5" style={{ color: selectedCalendar.color }} />;
                    })()}
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedCalendar.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {PLATFORM_CONFIG[selectedCalendar.platform].label}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showCalendarSelector ? 'rotate-180' : ''}`} />
            </button>

            {showCalendarSelector && (
              <div className="space-y-2">
                {calendars.map(calendar => {
                  const Icon = PLATFORM_CONFIG[calendar.platform].icon;
                  return (
                    <button
                      key={calendar.id}
                      onClick={() => {
                        setSelectedCalendar(calendar);
                        setShowCalendarSelector(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                        selectedCalendar?.id === calendar.id
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" style={{ color: calendar.color }} />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {calendar.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          by {calendar.created_by_name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No calendars yet. Create one to get started!
          </p>
        )}

        <button
          onClick={() => setShowCreateCalendar(true)}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Platform Calendar
        </button>
      </div>

      {/* Filters and Search */}
      {selectedCalendar && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center gap-2">
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
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {/* Create Post Button */}
      {selectedCalendar && (
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Post
        </button>
      )}

      {/* Posts List */}
      {selectedCalendar && (
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Posts Yet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create your first post to start scheduling
              </p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Create Post
              </button>
            </div>
          ) : (
            filteredPosts.map(post => {
              const statusColor = getStatusColor(post.status);
              const isExpanded = expandedPost === post.id;

              return (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                    className="p-4 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white flex-1">
                        {post.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 dark:bg-${statusColor}-900/30 text-${statusColor}-700 dark:text-${statusColor}-300`}>
                        {post.status}
                      </span>
                    </div>
                    <p className={`text-sm text-gray-600 dark:text-gray-400 mb-3 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(post.scheduled_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {post.created_by_name}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                      {post.hashtags.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Hash className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1 flex flex-wrap gap-1">
                            {post.hashtags.map((tag, i) => (
                              <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {post.mentions.length > 0 && (
                        <div className="flex items-start gap-2">
                          <AtSign className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1 flex flex-wrap gap-1">
                            {post.mentions.map((mention, i) => (
                              <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {mention}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {post.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          {post.location}
                        </div>
                      )}
                      {post.notes && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Internal Notes:
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {post.notes}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPost(post);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Calendar Modal */}
      {showCreateCalendar && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                New Calendar
              </h2>
              <button
                onClick={() => setShowCreateCalendar(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setNewCalendar({ ...newCalendar, platform: key as any, color: config.color })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          newCalendar.platform === key
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <Icon className="h-6 w-6 mx-auto" style={{ color: config.color }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar({ ...newCalendar, name: e.target.value })}
                  placeholder="Main Account"
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
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowCreateCalendar(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCalendar}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg"
              >
                <Save className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Post Modal */}
      {(showCreatePost || editingPost) && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingPost ? 'Edit Post' : 'New Post'}
              </h2>
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  setEditingPost(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editingPost ? editingPost.title : newPost.title}
                  onChange={(e) => editingPost
                    ? setEditingPost({ ...editingPost, title: e.target.value })
                    : setNewPost({ ...newPost, title: e.target.value })
                  }
                  placeholder="Post title"
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
                  placeholder="Write your post..."
                  rows={6}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
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
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time *
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
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hashtags
                </label>
                <input
                  type="text"
                  value={editingPost ? editingPost.hashtags.join(', ') : newPost.hashtags}
                  onChange={(e) => editingPost
                    ? setEditingPost({ ...editingPost, hashtags: e.target.value.split(',').map(h => h.trim()).filter(Boolean) })
                    : setNewPost({ ...newPost, hashtags: e.target.value })
                  }
                  placeholder="kindness, selfcare"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
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

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  setEditingPost(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg"
              >
                <Save className="h-4 w-4" />
                {editingPost ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
