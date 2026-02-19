'use client';

import { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Wand2,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookOpen,
  Target,
  Hash,
  Type,
  AlignLeft,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  List,
  Link,
  Quote,
  Heading1,
  Heading2,
  Heading3
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

interface AIGenerationOptions {
  type: 'title' | 'excerpt' | 'content' | 'outline' | 'seo' | 'tags' | 'improve';
  topic?: string;
  tone?: 'professional' | 'friendly' | 'casual' | 'inspiring';
  length?: 'short' | 'medium' | 'long';
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

// Topic suggestions for candle/boutique business
const TOPIC_SUGGESTIONS = [
  'Benefits of soy candles vs paraffin',
  'How to choose the perfect candle scent',
  'Candle care tips for longer burn time',
  'Creating a relaxing spa atmosphere at home',
  'Seasonal scent guide: Fall favorites',
  'The art of candle layering',
  'Self-care rituals with candles',
  'Gift guide: Candles for every occasion',
  'Understanding fragrance notes',
  'Eco-friendly candle choices'
];

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // AI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPanel, setAiPanel] = useState<'hidden' | 'assistant' | 'suggestions'>('hidden');
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'casual' | 'inspiring'>('friendly');
  const [generatedContent, setGeneratedContent] = useState('');

  const contentRef = useRef<HTMLTextAreaElement>(null);

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
        headers: { 'Authorization': 'Bearer admin-token' },
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          const fetchedPosts = data.value.posts;
          const postsToUse = (fetchedPosts && fetchedPosts.length > 0) 
            ? fetchedPosts 
            : DEFAULT_SETTINGS.posts;
          
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data.value,
            posts: postsToUse
          });
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

  // AI Content Generation
  const generateWithAI = async (options: AIGenerationOptions) => {
    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const response = await fetch('/api/admin/ai/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: options.type,
          topic: options.topic || aiTopic,
          tone: options.tone || aiTone,
          length: options.length,
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI generation failed');
      }

      const data = await response.json();
      const content = data.content || '';
      setGeneratedContent(content);

      // Auto-apply for certain types
      if (options.type === 'excerpt' && content) {
        setFormData(prev => ({ ...prev, excerpt: content.trim() }));
      }

    } catch (error) {
      console.error('AI generation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'AI generation failed');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedContent = (type: 'title' | 'content' | 'excerpt' | 'append') => {
    if (!generatedContent) return;

    switch (type) {
      case 'title':
        // Extract first title suggestion
        const titleMatch = generatedContent.match(/\d\.\s*(.+)/);
        if (titleMatch) {
          setFormData(prev => ({ 
            ...prev, 
            title: titleMatch[1].replace(/[*"]/g, '').trim(),
            slug: generateSlug(titleMatch[1])
          }));
        }
        break;
      case 'content':
        setFormData(prev => ({ ...prev, content: generatedContent }));
        break;
      case 'excerpt':
        setFormData(prev => ({ ...prev, excerpt: generatedContent.substring(0, 300) }));
        break;
      case 'append':
        setFormData(prev => ({ ...prev, content: (prev.content || '') + '\n\n' + generatedContent }));
        break;
    }
    setGeneratedContent('');
    setAiPanel('hidden');
  };

  const applyTagsFromGenerated = () => {
    if (!generatedContent) return;
    const tags = generatedContent
      .split(/[,\n]/)
      .map(t => t.replace(/^\d+\.\s*/, '').trim().toLowerCase())
      .filter(t => t && t.length > 1 && t.length < 30);
    setFormData(prev => ({ ...prev, tags: [...new Set([...(prev.tags || []), ...tags])] }));
    setGeneratedContent('');
  };

  const applySEOFromGenerated = () => {
    if (!generatedContent) return;
    const titleMatch = generatedContent.match(/SEO Title[:\s]*(.+)/i);
    const descMatch = generatedContent.match(/Meta Description[:\s]*(.+)/i);
    
    if (titleMatch) {
      setFormData(prev => ({ ...prev, seo_title: titleMatch[1].trim() }));
    }
    if (descMatch) {
      setFormData(prev => ({ ...prev, seo_description: descMatch[1].trim() }));
    }
    setGeneratedContent('');
  };

  const insertFormatting = (tag: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content?.substring(start, end) || '';
    
    let newText = '';
    switch (tag) {
      case 'bold':
        newText = `<strong>${selectedText || 'bold text'}</strong>`;
        break;
      case 'italic':
        newText = `<em>${selectedText || 'italic text'}</em>`;
        break;
      case 'h2':
        newText = `<h2>${selectedText || 'Heading'}</h2>`;
        break;
      case 'h3':
        newText = `<h3>${selectedText || 'Subheading'}</h3>`;
        break;
      case 'list':
        newText = `<ul>\n  <li>${selectedText || 'Item 1'}</li>\n  <li>Item 2</li>\n</ul>`;
        break;
      case 'link':
        newText = `<a href="URL">${selectedText || 'link text'}</a>`;
        break;
      case 'quote':
        newText = `<blockquote>${selectedText || 'Quote text'}</blockquote>`;
        break;
      case 'p':
        newText = `<p>${selectedText || 'Paragraph text'}</p>`;
        break;
    }

    const newContent = (formData.content || '').substring(0, start) + newText + (formData.content || '').substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
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
    setAiPanel('hidden');
    setGeneratedContent('');
  };

  const handleEdit = (post: BlogPost) => {
    setIsCreating(false);
    setEditingPost(post);
    setFormData({ ...post });
    setShowEditor(true);
    setAiPanel('hidden');
    setGeneratedContent('');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-7 w-7 text-blue-600" />
            Blog Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage blog posts with AI assistance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        </div>
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
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase hidden md:table-cell">Author</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase hidden sm:table-cell">Date</th>
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
                          className="w-12 h-12 rounded-lg object-cover hidden sm:block"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{post.excerpt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{post.author}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
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
                    <div className="flex items-center justify-end gap-1">
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
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isFullscreen ? '' : 'p-4'}`}>
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col ${
            isFullscreen ? 'w-full h-full rounded-none' : 'max-w-6xl w-full max-h-[95vh]'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {isCreating ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
                {isCreating ? 'New Blog Post' : 'Edit Blog Post'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-white/80 hover:text-white p-1"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => { setShowEditor(false); setIsFullscreen(false); }}
                  className="text-white/80 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content - Split View */}
            <div className="flex-1 overflow-hidden flex">
              {/* Main Editor */}
              <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${aiPanel !== 'hidden' ? 'lg:w-2/3' : 'w-full'}`}>
                {/* Title with AI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Title *</label>
                    <button
                      onClick={() => { setAiPanel('assistant'); generateWithAI({ type: 'title', topic: aiTopic }); }}
                      disabled={isGenerating}
                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate titles
                    </button>
                  </div>
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
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-lg"
                    placeholder="Enter an engaging post title..."
                  />
                </div>

                {/* Quick Info Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">URL Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                      placeholder="post-url-slug"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Author</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                      placeholder="Author name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                      placeholder="March 30, 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Featured Image</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                      placeholder="/logos/1.webp"
                    />
                  </div>
                </div>

                {/* Excerpt with AI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Excerpt *</label>
                    <button
                      onClick={() => generateWithAI({ type: 'excerpt' })}
                      disabled={isGenerating || !formData.title}
                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate excerpt
                    </button>
                  </div>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Brief summary that hooks readers..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.excerpt?.length || 0}/160 characters recommended</p>
                </div>

                {/* Content Editor with Toolbar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Content</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setAiPanel('assistant'); generateWithAI({ type: 'outline' }); }}
                        disabled={isGenerating || !formData.title}
                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                      >
                        <BookOpen className="h-3 w-3" />
                        Generate outline
                      </button>
                      <button
                        onClick={() => { setAiPanel('assistant'); generateWithAI({ type: 'content', length: 'medium' }); }}
                        disabled={isGenerating || !formData.title}
                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                      >
                        <Wand2 className="h-3 w-3" />
                        Write with AI
                      </button>
                    </div>
                  </div>
                  
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-t-lg border border-b-0 dark:border-gray-600">
                    <button onClick={() => insertFormatting('h2')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Heading 2">
                      <Heading2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => insertFormatting('h3')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Heading 3">
                      <Heading3 className="h-4 w-4" />
                    </button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <button onClick={() => insertFormatting('bold')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Bold">
                      <Bold className="h-4 w-4" />
                    </button>
                    <button onClick={() => insertFormatting('italic')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Italic">
                      <Italic className="h-4 w-4" />
                    </button>
                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
                    <button onClick={() => insertFormatting('p')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Paragraph">
                      <AlignLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => insertFormatting('list')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="List">
                      <List className="h-4 w-4" />
                    </button>
                    <button onClick={() => insertFormatting('quote')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Quote">
                      <Quote className="h-4 w-4" />
                    </button>
                    <button onClick={() => insertFormatting('link')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Link">
                      <Link className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    ref={contentRef}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={isFullscreen ? 20 : 12}
                    className="w-full px-4 py-3 border rounded-b-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                    placeholder="Write your blog post content here... HTML is supported."
                  />
                </div>

                {/* Tags with AI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Tags</label>
                    <button
                      onClick={() => { setAiPanel('assistant'); generateWithAI({ type: 'tags' }); }}
                      disabled={isGenerating || !formData.title}
                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Hash className="h-3 w-3" />
                      Suggest tags
                    </button>
                  </div>
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

                {/* SEO with AI */}
                <div className="border-t dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      SEO Settings
                    </h4>
                    <button
                      onClick={() => { setAiPanel('assistant'); generateWithAI({ type: 'seo' }); }}
                      disabled={isGenerating || !formData.title}
                      className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate SEO
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">SEO Title</label>
                      <input
                        type="text"
                        value={formData.seo_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Custom title for search engines (50-60 chars)"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.seo_title?.length || 0}/60 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SEO Description</label>
                      <textarea
                        value={formData.seo_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="Custom description for search engines (150-160 chars)"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.seo_description?.length || 0}/160 characters</p>
                    </div>
                  </div>
                </div>

                {/* Status & Featured */}
                <div className="flex flex-wrap items-center gap-6">
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
                    <label className="text-sm font-medium">Status:</label>
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

              {/* AI Assistant Panel */}
              {aiPanel !== 'hidden' && (
                <div className="w-full lg:w-1/3 border-l dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                  <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-purple-500 to-pink-500">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI Assistant
                      </h4>
                      <button
                        onClick={() => setAiPanel('hidden')}
                        className="text-white/80 hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Topic Input */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Topic / Idea</label>
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                        placeholder="Enter a topic for AI suggestions..."
                      />
                    </div>

                    {/* Topic Suggestions */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Quick Ideas</label>
                      <div className="flex flex-wrap gap-1">
                        {TOPIC_SUGGESTIONS.slice(0, 6).map((topic) => (
                          <button
                            key={topic}
                            onClick={() => setAiTopic(topic)}
                            className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200"
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tone Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Writing Tone</label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                      >
                        <option value="friendly">Friendly & Warm</option>
                        <option value="professional">Professional</option>
                        <option value="casual">Casual & Fun</option>
                        <option value="inspiring">Inspiring & Motivational</option>
                      </select>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => generateWithAI({ type: 'title', topic: aiTopic, tone: aiTone })}
                        disabled={isGenerating}
                        className="p-2 text-sm bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Type className="h-4 w-4" />
                        Titles
                      </button>
                      <button
                        onClick={() => generateWithAI({ type: 'outline', topic: aiTopic, tone: aiTone })}
                        disabled={isGenerating}
                        className="p-2 text-sm bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <BookOpen className="h-4 w-4" />
                        Outline
                      </button>
                      <button
                        onClick={() => generateWithAI({ type: 'content', topic: aiTopic, tone: aiTone, length: 'medium' })}
                        disabled={isGenerating || !formData.title}
                        className="p-2 text-sm bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Wand2 className="h-4 w-4" />
                        Full Post
                      </button>
                      <button
                        onClick={() => generateWithAI({ type: 'improve', tone: aiTone })}
                        disabled={isGenerating || !formData.content}
                        className="p-2 text-sm bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Improve
                      </button>
                    </div>

                    {/* Generated Content */}
                    {isGenerating && (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                        <span className="ml-2 text-purple-600">Generating...</span>
                      </div>
                    )}

                    {generatedContent && !isGenerating && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">Generated Content</label>
                        <div className="bg-white dark:bg-gray-800 border rounded-lg p-3 max-h-64 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                            {generatedContent}
                          </pre>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => applyGeneratedContent('content')}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                          >
                            Replace Content
                          </button>
                          <button
                            onClick={() => applyGeneratedContent('append')}
                            className="flex-1 px-3 py-2 border border-purple-600 text-purple-600 text-sm rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          >
                            Append
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => applyGeneratedContent('title')}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                          >
                            Use as Title
                          </button>
                          <button
                            onClick={applyTagsFromGenerated}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                          >
                            Extract Tags
                          </button>
                          <button
                            onClick={applySEOFromGenerated}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                          >
                            Apply SEO
                          </button>
                          <button
                            onClick={() => { navigator.clipboard.writeText(generatedContent); setSuccessMessage('Copied!'); setTimeout(() => setSuccessMessage(''), 2000); }}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                          >
                            <Copy className="h-3 w-3 inline mr-1" />
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setAiPanel(aiPanel === 'hidden' ? 'assistant' : 'hidden')}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
              >
                <Sparkles className="h-4 w-4" />
                {aiPanel === 'hidden' ? 'Show AI Assistant' : 'Hide AI Assistant'}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowEditor(false); setIsFullscreen(false); }}
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
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="font-bold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Blog Writing Tips with AI
        </h3>
        <ul className="space-y-2 text-sm text-purple-600 dark:text-purple-400">
          <li>• <strong>Generate Titles:</strong> Get 5 engaging title suggestions based on your topic</li>
          <li>• <strong>Create Outlines:</strong> AI creates a structured outline before you write</li>
          <li>• <strong>Write Full Posts:</strong> Generate complete blog posts with proper formatting</li>
          <li>• <strong>Improve Content:</strong> Enhance existing content for better engagement</li>
          <li>• <strong>SEO Optimization:</strong> Auto-generate SEO titles, descriptions, and tags</li>
          <li>• <strong>Formatting Toolbar:</strong> Easily add HTML formatting to your content</li>
        </ul>
      </div>
    </div>
  );
}
