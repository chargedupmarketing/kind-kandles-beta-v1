'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  User, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Star,
  Filter,
  Search,
  Download,
  Plus,
  Save,
  X,
  Mail
} from 'lucide-react';

interface StorySubmission {
  id: string;
  title: string;
  author: string;
  email: string;
  content: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  isStarred: boolean;
  category: 'candle-journey' | 'kindness-story' | 'product-review' | 'life-moment' | 'other';
  publishedAt?: Date;
  adminNotes?: string;
}

function apiStoryToSubmission(s: { id: string; title: string; author: string; email: string; content: string; submittedAt: string; status: string; isStarred: boolean; category: string; publishedAt?: string; adminNotes?: string }): StorySubmission {
  return {
    id: s.id,
    title: s.title,
    author: s.author,
    email: s.email,
    content: s.content,
    submittedAt: new Date(s.submittedAt),
    status: s.status as StorySubmission['status'],
    isStarred: s.isStarred === true,
    category: (s.category || 'other') as StorySubmission['category'],
    publishedAt: s.publishedAt ? new Date(s.publishedAt) : undefined,
    adminNotes: s.adminNotes,
  };
}

export default function StoryManagement() {
  const [stories, setStories] = useState<StorySubmission[]>([]);
  const [selectedStory, setSelectedStory] = useState<StorySubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'published' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState<StorySubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load stories from API
  const loadStories = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/admin/stories?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load stories');
      const list = Array.isArray(data.stories) ? data.stories : [];
      setStories(list.map(apiStoryToSubmission));
    } catch (e) {
      console.error('Error loading stories:', e);
      setLoadError(e instanceof Error ? e.message : 'Failed to load stories');
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const filteredStories = stories.filter(story => {
    // Apply filter
    if (filter !== 'all' && story.status !== filter) {
      return false;
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        story.title.toLowerCase().includes(term) ||
        story.author.toLowerCase().includes(term) ||
        story.content.toLowerCase().includes(term) ||
        story.category.toLowerCase().includes(term)
      );
    }

    return true;
  }).sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  const handleUpdateStatus = async (id: string, status: StorySubmission['status']) => {
    try {
      const res = await fetch(`/api/admin/stories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      if (data.story) {
        setStories(prev => prev.map(s => s.id === id ? apiStoryToSubmission(data.story) : s));
        if (selectedStory?.id === id) setSelectedStory(apiStoryToSubmission(data.story));
      }
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const handleToggleStar = async (id: string) => {
    const story = stories.find(s => s.id === id);
    if (!story) return;
    const next = !story.isStarred;
    try {
      const res = await fetch(`/api/admin/stories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setStories(prev => prev.map(s => s.id === id ? { ...s, isStarred: next } : s));
      if (selectedStory?.id === id) setSelectedStory(prev => prev ? { ...prev, isStarred: next } : null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this story?')) return;
    try {
      const res = await fetch(`/api/admin/stories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      setStories(prev => prev.filter(s => s.id !== id));
      if (selectedStory?.id === id) setSelectedStory(null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const handleEdit = (story: StorySubmission) => {
    setEditedStory({ ...story });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editedStory) return;
    try {
      const res = await fetch(`/api/admin/stories/${editedStory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedStory.title,
          author: editedStory.author,
          email: editedStory.email,
          content: editedStory.content,
          category: editedStory.category,
          adminNotes: editedStory.adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      if (data.story) {
        const updated = apiStoryToSubmission(data.story);
        setStories(prev => prev.map(s => s.id === editedStory.id ? updated : s));
        setSelectedStory(updated);
      }
      setIsEditing(false);
      setEditedStory(null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedStory(null);
  };

  const exportStories = () => {
    const publishedStories = stories.filter(s => s.status === 'published');
    const dataStr = JSON.stringify(publishedStories, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `published-stories-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const getStats = () => {
    const total = stories.length;
    const pending = stories.filter(s => s.status === 'pending').length;
    const approved = stories.filter(s => s.status === 'approved').length;
    const published = stories.filter(s => s.status === 'published').length;
    const rejected = stories.filter(s => s.status === 'rejected').length;
    return { total, pending, approved, published, rejected };
  };

  const stats = getStats();

  const getStatusColor = (status: StorySubmission['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      case 'published': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getCategoryLabel = (category: StorySubmission['category']) => {
    switch (category) {
      case 'candle-journey': return 'Candle Journey';
      case 'kindness-story': return 'Kindness Story';
      case 'product-review': return 'Product Review';
      case 'life-moment': return 'Life Moment';
      case 'other': return 'Other';
      default: return category;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Story Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Review and publish customer stories</p>
        </div>
        <button
          onClick={exportStories}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Published</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Approved</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.approved}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Published</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.published}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.rejected}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stories List */}
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
                  <option value="all">All Stories</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
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
                placeholder="Search stories..."
              />
            </div>
          </div>

          {/* Stories List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Loading stories...</p>
              </div>
            ) : loadError ? (
              <div className="p-8 text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">{loadError}</p>
                <button
                  type="button"
                  onClick={() => loadStories()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No stories found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredStories.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story)}
                    className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      selectedStory?.id === story.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium truncate text-slate-900 dark:text-slate-100">
                            {story.title}
                          </p>
                          {story.isStarred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          by {story.author}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(story.status)}`}>
                            {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {getCategoryLabel(story.category)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {story.submittedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Story Details */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          {selectedStory ? (
            <div className="p-6">
              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Story</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                      >
                        <Save className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                      >
                        <X className="h-3 w-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={editedStory?.title || ''}
                      onChange={(e) => setEditedStory(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={editedStory?.category || ''}
                      onChange={(e) => setEditedStory(prev => prev ? { ...prev, category: e.target.value as any } : null)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="candle-journey">Candle Journey</option>
                      <option value="kindness-story">Kindness Story</option>
                      <option value="product-review">Product Review</option>
                      <option value="life-moment">Life Moment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                    <textarea
                      value={editedStory?.content || ''}
                      onChange={(e) => setEditedStory(prev => prev ? { ...prev, content: e.target.value } : null)}
                      rows={8}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Notes</label>
                    <textarea
                      value={editedStory?.adminNotes || ''}
                      onChange={(e) => setEditedStory(prev => prev ? { ...prev, adminNotes: e.target.value } : null)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Internal notes..."
                    />
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        {selectedStory.title}
                      </h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedStory.status)}`}>
                          {selectedStory.status.charAt(0).toUpperCase() + selectedStory.status.slice(1)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {getCategoryLabel(selectedStory.category)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Submitted {selectedStory.submittedAt.toLocaleDateString()}
                        {selectedStory.publishedAt && (
                          <span> • Published {selectedStory.publishedAt.toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStar(selectedStory.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedStory.isStarred
                            ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
                            : 'text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                        }`}
                      >
                        <Star className={`h-4 w-4 ${selectedStory.isStarred ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEdit(selectedStory)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedStory.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Author Info */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-900 dark:text-slate-100">{selectedStory.author}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a 
                        href={`mailto:${selectedStory.email}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {selectedStory.email}
                      </a>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Story Content</h4>
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                        {selectedStory.content}
                      </p>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {selectedStory.adminNotes && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Admin Notes</h4>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          {selectedStory.adminNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status Actions */}
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Status Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedStory.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedStory.id, 'approved')}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                      )}
                      {selectedStory.status === 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedStory.id, 'published')}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Publish</span>
                        </button>
                      )}
                      {selectedStory.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedStory.id, 'rejected')}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      )}
                      {selectedStory.status !== 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedStory.id, 'pending')}
                          className="flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>Pending</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Select a story to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
