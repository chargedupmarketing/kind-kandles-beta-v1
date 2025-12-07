'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Calendar,
  User,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
  image: string;
  status: 'draft' | 'published';
  featured: boolean;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
}

interface BlogSettings {
  posts: BlogPost[];
  hero_title: string;
  hero_subtitle: string;
}

const DEFAULT_SETTINGS: BlogSettings = {
  posts: [
    {
      id: 'the-thoughtful-gift-that-always-wins',
      title: 'The Thoughtful Gift That Always Wins',
      slug: 'the-thoughtful-gift-that-always-wins',
      author: 'Kia Wells',
      date: 'March 30, 2025',
      excerpt: 'Candles are like the little black dress of gift-giving—always appropriate, always appreciated. But with so many options, how do you choose the right one?',
      content: '',
      image: '/logos/1.webp',
      status: 'published',
      featured: true,
      tags: ['gifts', 'candles'],
      created_at: '2025-03-30',
      updated_at: '2025-03-30'
    },
    {
      id: 'candles-color-psychology',
      title: 'Candles & Color Psychology: How to Design Your Space with Wax & Wick',
      slug: 'candles-color-psychology',
      author: 'Kia Wells',
      date: 'March 30, 2025',
      excerpt: 'Color psychology applies to candles too. Studies show that different colors evoke specific emotional responses. Design your space with intention.',
      content: '',
      image: '/logos/2.webp',
      status: 'published',
      featured: false,
      tags: ['design', 'psychology', 'candles'],
      created_at: '2025-03-30',
      updated_at: '2025-03-30'
    },
    {
      id: 'emotions-are-triggered-by-what',
      title: 'Emotions are triggered by - WHAT?',
      slug: 'emotions-are-triggered-by-what',
      author: 'Kia Wells',
      date: 'March 30, 2025',
      excerpt: 'Studies show that 75% of emotions are triggered by scent. The right fragrance makes your home feel inviting and luxurious.',
      content: '',
      image: '/logos/3.webp',
      status: 'published',
      featured: false,
      tags: ['scent', 'emotions', 'wellness'],
      created_at: '2025-03-30',
      updated_at: '2025-03-30'
    }
  ],
  hero_title: 'KKB Blog',
  hero_subtitle: 'Insights, tips, and inspiration from the world of candles and self-care'
};

export default function BlogManagement() {
  const [settings, setSettings] = useState<BlogSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    author: 'Kia Wells',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    excerpt: '',
    content: '',
    image: '',
    status: 'draft',
    featured: false,
    tags: [],
    seo_title: '',
    seo_description: ''
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/blog', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.value });
        }
      }
    } catch (error) {
      console.error('Error fetching blog settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings?: BlogSettings) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/settings/blog', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ value: newSettings || settings })
      });

      if (response.ok) {
        setSuccessMessage('Blog settings saved!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      author: 'Kia Wells',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      excerpt: '',
      content: '',
      image: '',
      status: 'draft',
      featured: false,
      tags: [],
      seo_title: '',
      seo_description: ''
    });
    setShowEditor(true);
  };

  const handleEdit = (post: BlogPost) => {
    setIsCreating(false);
    setEditingPost(post);
    setFormData({
      ...post
    });
    setShowEditor(true);
  };

  const handleSavePost = async () => {
    if (!formData.title || !formData.excerpt) {
      setErrorMessage('Title and excerpt are required');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const slug = formData.slug || generateSlug(formData.title!);
    const now = new Date().toISOString().split('T')[0];

    const newPost: BlogPost = {
      id: isCreating ? slug : editingPost!.id,
      title: formData.title!,
      slug,
      author: formData.author || 'Kia Wells',
      date: formData.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      excerpt: formData.excerpt!,
      content: formData.content || '',
      image: formData.image || '/logos/1.webp',
      status: formData.status || 'draft',
      featured: formData.featured || false,
      tags: formData.tags || [],
      seo_title: formData.seo_title,
      seo_description: formData.seo_description,
      created_at: isCreating ? now : editingPost!.created_at,
      updated_at: now
    };

    let newPosts: BlogPost[];
    if (isCreating) {
      newPosts = [...settings.posts, newPost];
    } else {
      newPosts = settings.posts.map(p => p.id === editingPost!.id ? newPost : p);
    }

    const newSettings = { ...settings, posts: newPosts };
    setSettings(newSettings);
    await saveSettings(newSettings);
    setShowEditor(false);
    setEditingPost(null);
    setIsCreating(false);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    const newPosts = settings.posts.filter(p => p.id !== postId);
    const newSettings = { ...settings, posts: newPosts };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const newPosts = settings.posts.map(p => 
      p.id === post.id ? { ...p, status: newStatus, updated_at: new Date().toISOString().split('T')[0] } : p
    );
    const newSettings = { ...settings, posts: newPosts as BlogPost[] };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const filteredPosts = settings.posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" />
            Blog Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage blog posts for your website
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Post
        </button>
      </div>

      {/* Blog Hero Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Blog Page Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Hero Title</label>
            <input
              type="text"
              value={settings.hero_title}
              onChange={(e) => setSettings(prev => ({ ...prev, hero_title: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="KKB Blog"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Hero Subtitle</label>
            <input
              type="text"
              value={settings.hero_subtitle}
              onChange={(e) => setSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Insights, tips, and inspiration..."
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => saveSettings()}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{settings.posts.length}</p>
            </div>
            <FileText className="h-10 w-10 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Published</p>
              <p className="text-3xl font-bold text-green-600">{settings.posts.filter(p => p.status === 'published').length}</p>
            </div>
            <Eye className="h-10 w-10 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Drafts</p>
              <p className="text-3xl font-bold text-yellow-600">{settings.posts.filter(p => p.status === 'draft').length}</p>
            </div>
            <EyeOff className="h-10 w-10 text-yellow-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Post</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Author</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{post.author}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{post.date}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggleStatus(post)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}
                    >
                      {post.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        title="View post"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        title="Edit post"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    No blog posts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-cyan-500">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {isCreating ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                {isCreating ? 'New Blog Post' : 'Edit Blog Post'}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        title: e.target.value,
                        slug: prev.slug || generateSlug(e.target.value)
                      }));
                    }}
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter post title..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">URL Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="post-url-slug"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Author</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Author name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="March 30, 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Featured Image URL</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="/logos/1.webp"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Excerpt *</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Brief summary of the post..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content (HTML supported)</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={10}
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                    placeholder="Full post content..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {formData.tags?.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm"
                      >
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Add a tag..."
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* SEO */}
                <div className="border-t dark:border-gray-700 pt-4">
                  <h4 className="font-medium mb-4">SEO Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">SEO Title</label>
                      <input
                        type="text"
                        value={formData.seo_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                        className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Custom title for search engines"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SEO Description</label>
                      <textarea
                        value={formData.seo_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Custom description for search engines"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Featured */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="featured" className="text-sm font-medium">Featured Post</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                      className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePost}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : (isCreating ? 'Create Post' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-3">💡 Blog Management Tips</h3>
        <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
          <li>• <strong>Note:</strong> Blog posts are currently stored in settings. For dynamic routing, you'll need to create individual page files.</li>
          <li>• Use the <strong>Featured</strong> checkbox to highlight important posts</li>
          <li>• <strong>Draft</strong> posts won't appear on the public blog page</li>
          <li>• Add relevant <strong>tags</strong> to help with organization and SEO</li>
          <li>• The <strong>excerpt</strong> appears on the blog listing page</li>
        </ul>
      </div>
    </div>
  );
}


