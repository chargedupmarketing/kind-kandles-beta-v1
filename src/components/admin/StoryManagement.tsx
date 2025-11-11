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

export default function StoryManagement() {
  const [stories, setStories] = useState<StorySubmission[]>([]);
  const [selectedStory, setSelectedStory] = useState<StorySubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'published' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState<StorySubmission | null>(null);

  // Load mock data on component mount
  useEffect(() => {
    const mockStories: StorySubmission[] = [
      {
        id: '1',
        title: 'My Candle Journey: Finding Peace in Scent',
        author: 'Jennifer Martinez',
        email: 'jennifer.m@email.com',
        content: 'I discovered Kind Kandles during one of the most stressful periods of my life. I was working long hours, barely sleeping, and feeling completely overwhelmed. A friend recommended your lavender candle, saying it might help me relax.\n\nThe first time I lit that candle, something magical happened. The gentle scent filled my apartment, and for the first time in months, I felt my shoulders relax. It became my evening ritual - lighting the candle, taking deep breaths, and allowing myself to just be present.\n\nNow, six months later, I have a collection of your candles for different moods and moments. The citrus ones energize my mornings, the vanilla soothes my evenings, and the eucalyptus helps me focus during work. Each candle tells a story, and together they\'ve helped me create a more mindful, peaceful life.\n\nThank you for creating products that do more than just smell good - they create experiences and memories.',
        submittedAt: new Date('2024-11-09T15:30:00'),
        status: 'pending',
        isStarred: true,
        category: 'candle-journey',
        adminNotes: 'Beautiful story, perfect for homepage feature'
      },
      {
        id: '2',
        title: 'A Gift of Kindness That Changed Everything',
        author: 'Robert Chen',
        email: 'rchen.writer@gmail.com',
        content: 'Last year, my neighbor Mrs. Thompson was going through chemotherapy. She\'s always been the kindest person on our block, always checking on everyone, bringing cookies, and just spreading joy wherever she went.\n\nWhen I heard about her diagnosis, I wanted to do something special but didn\'t know what. That\'s when I remembered seeing your "Do All Things With Kindness" motto on your candles. I ordered a care package with different scented candles and a handwritten note.\n\nThe smile on her face when I delivered it was priceless. She told me later that during her toughest days, she would light one of your candles and remember that people cared about her. The scents became associated with hope and healing for her.\n\nMrs. Thompson is now cancer-free, and she still lights your candles every evening. She says they remind her to approach each day with kindness, just like your motto suggests. Your candles didn\'t just provide comfort - they became symbols of community and caring.',
        submittedAt: new Date('2024-11-08T10:45:00'),
        status: 'approved',
        isStarred: true,
        category: 'kindness-story',
        publishedAt: new Date('2024-11-09T09:00:00')
      },
      {
        id: '3',
        title: 'The Perfect Wedding Favor',
        author: 'Sarah & Mike Johnson',
        email: 'sarahmike.wedding@email.com',
        content: 'We used Kind Kandles as our wedding favors and they were absolutely perfect! We chose the "Love Blossom" scent and had custom labels made with our wedding date and a thank you message.\n\nOur guests loved them, and we still get messages from friends and family saying they light their candle and think of our special day. The quality is amazing - even a year later, people tell us their candles still smell incredible and burn evenly.\n\nWhat made it even more special was working with your team. They were so helpful with the custom labeling and made sure everything arrived on time. The attention to detail and customer service was outstanding.\n\nThank you for helping make our wedding day even more memorable!',
        submittedAt: new Date('2024-11-07T14:20:00'),
        status: 'published',
        isStarred: false,
        category: 'product-review',
        publishedAt: new Date('2024-11-08T12:00:00')
      },
      {
        id: '4',
        title: 'Creating Memories with My Daughter',
        author: 'Maria Rodriguez',
        email: 'maria.rodriguez.mom@gmail.com',
        content: 'Every Sunday, my 8-year-old daughter and I have "candle time." We light one of your candles, turn off all the electronics, and just talk about our week. It started as a way to get her to open up about school, but it\'s become so much more.\n\nShe has her favorite scents for different moods - vanilla when she\'s feeling cozy, citrus when she\'s excited about something, and lavender when she needs comfort. Last month, she asked if we could make our own candles someday "just like the Kind Kandles lady."\n\nThese simple moments have strengthened our bond in ways I never expected. Your candles have become the backdrop for some of our most precious conversations and memories.',
        submittedAt: new Date('2024-11-06T19:15:00'),
        status: 'pending',
        isStarred: false,
        category: 'life-moment'
      },
      {
        id: '5',
        title: 'From Skeptic to Believer',
        author: 'David Park',
        email: 'dpark.reviews@email.com',
        content: 'I\'ll be honest - I was skeptical about "fancy" candles. I thought a candle was just a candle. My wife kept talking about trying Kind Kandles, and I kept rolling my eyes and suggesting we just buy the cheap ones from the grocery store.\n\nThen she surprised me with the "Man Cave Season" candle for my birthday. The scent was incredible - woodsy and masculine without being overpowering. But what really impressed me was how long it lasted and how evenly it burned.\n\nNow I\'m the one suggesting we order more candles. The quality difference is undeniable, and I\'ve become a believer in supporting small businesses that clearly care about their craft. Consider me converted!',
        submittedAt: new Date('2024-11-05T16:30:00'),
        status: 'rejected',
        isStarred: false,
        category: 'product-review',
        adminNotes: 'Good review but doesn\'t fit current story theme'
      }
    ];

    // Load from localStorage or use mock data
    const savedStories = localStorage.getItem('storySubmissions');
    if (savedStories) {
      const parsed = JSON.parse(savedStories);
      // Convert date strings back to Date objects
      const withDates = parsed.map((story: any) => ({
        ...story,
        submittedAt: new Date(story.submittedAt),
        publishedAt: story.publishedAt ? new Date(story.publishedAt) : undefined
      }));
      setStories(withDates);
    } else {
      setStories(mockStories);
      localStorage.setItem('storySubmissions', JSON.stringify(mockStories));
    }
  }, []);

  // Save stories to localStorage whenever they change
  useEffect(() => {
    if (stories.length > 0) {
      localStorage.setItem('storySubmissions', JSON.stringify(stories));
    }
  }, [stories]);

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

  const handleUpdateStatus = (id: string, status: StorySubmission['status']) => {
    setStories(prev => prev.map(story => {
      if (story.id === id) {
        const updated = { ...story, status };
        if (status === 'published' && !story.publishedAt) {
          updated.publishedAt = new Date();
        }
        return updated;
      }
      return story;
    }));
  };

  const handleToggleStar = (id: string) => {
    setStories(prev => prev.map(story => 
      story.id === id ? { ...story, isStarred: !story.isStarred } : story
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this story?')) {
      setStories(prev => prev.filter(story => story.id !== id));
      setSelectedStory(null);
    }
  };

  const handleEdit = (story: StorySubmission) => {
    setEditedStory({ ...story });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedStory) {
      setStories(prev => prev.map(story => 
        story.id === editedStory.id ? editedStory : story
      ));
      setSelectedStory(editedStory);
      setIsEditing(false);
      setEditedStory(null);
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
            {filteredStories.length === 0 ? (
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
