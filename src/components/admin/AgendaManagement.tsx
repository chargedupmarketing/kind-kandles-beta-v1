'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  Circle, 
  Clock, 
  User, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Filter,
  Search,
  AlertCircle,
  FileText,
  Tag,
  Bell,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  MessageSquare,
  Send,
  Paperclip,
  Link as LinkIcon,
  Image as ImageIcon,
  PlayCircle,
  StopCircle,
  Timer,
  TrendingUp,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Copy,
  Repeat,
  GitBranch,
  Zap,
  Star,
  Flag,
  Activity,
  Users,
  Download,
  ExternalLink,
  Sparkles,
  BarChart3,
  Target,
  Layers
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

interface AgendaComment {
  id: string;
  agenda_item_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

interface AgendaSubtask {
  id: string;
  agenda_item_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  completed_by?: string;
  completed_at?: string;
  created_at: string;
}

interface AgendaTag {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

interface AgendaAttachment {
  id: string;
  agenda_item_id: string;
  type: 'file' | 'link' | 'image';
  name: string;
  url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  created_at: string;
}

interface TimeLog {
  id: string;
  agenda_item_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  description?: string;
  user?: {
    name: string;
    email: string;
  };
}

interface ActivityLog {
  id: string;
  agenda_item_id: string;
  user_id: string;
  user_name: string;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  metadata?: any;
  created_at: string;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'note' | 'reminder';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  start_date: string | null;
  assigned_to: string;
  assigned_to_name: string;
  created_by: string;
  created_by_name: string;
  tags: string[];
  item_tags?: AgendaTag[];
  notes: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  notify_on_due: boolean;
  notify_on_update: boolean;
  comments?: AgendaComment[];
  comments_count?: number;
  subtasks_count?: number;
  attachments_count?: number;
  watchers_count?: number;
  progress_percentage?: number;
  estimated_hours?: number;
  actual_hours?: number;
  color?: string;
  parent_id?: string;
  recurrence_pattern?: any;
  is_template?: boolean;
}

type FilterType = 'all' | 'my-items' | 'assigned-to-me' | 'pending' | 'in_progress' | 'completed' | 'high-priority';
type SortType = 'due_date' | 'priority' | 'created_at' | 'status' | 'progress';
type ViewMode = 'list' | 'kanban' | 'calendar' | 'timeline';

export default function AgendaManagementEnhanced() {
  const { user } = useAdmin();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [allTags, setAllTags] = useState<AgendaTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('due_date');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Advanced feature states
  const [showSubtasks, setShowSubtasks] = useState<{ [key: string]: AgendaSubtask[] }>({});
  const [showAttachments, setShowAttachments] = useState<{ [key: string]: AgendaAttachment[] }>({});
  const [showTimeLogs, setShowTimeLogs] = useState<{ [key: string]: TimeLog[] }>({});
  const [showActivity, setShowActivity] = useState<{ [key: string]: ActivityLog[] }>({});
  const [activeTimers, setActiveTimers] = useState<{ [key: string]: string }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [addingComment, setAddingComment] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState<{ [key: string]: string }>({});
  const [newAttachment, setNewAttachment] = useState<{ [key: string]: { type: string; name: string; url: string } }>({});
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: '#6b7280' });

  // Enhanced form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as 'task' | 'note' | 'reminder',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
    start_date: '',
    assigned_to: user?.id || '',
    tags: '',
    tag_ids: [] as string[],
    notes: '',
    notify_on_due: true,
    notify_on_update: false,
    estimated_hours: '',
    color: '#3b82f6',
    subtasks: [] as string[],
    recurrence: {
      enabled: false,
      type: 'daily' as 'daily' | 'weekly' | 'monthly',
      interval: 1,
      end_date: '',
    },
  });

  useEffect(() => {
    fetchItems();
    fetchTags();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/agenda', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        showError('Failed to load agenda items');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      showError('Failed to load agenda items');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/agenda/tags', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAllTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchSubtasks = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/subtasks`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setShowSubtasks(prev => ({ ...prev, [itemId]: data.subtasks || [] }));
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const fetchAttachments = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/attachments`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setShowAttachments(prev => ({ ...prev, [itemId]: data.attachments || [] }));
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchTimeLogs = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/time-logs`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setShowTimeLogs(prev => ({ ...prev, [itemId]: data.timeLogs || [] }));
      }
    } catch (error) {
      console.error('Error fetching time logs:', error);
    }
  };

  const fetchActivity = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/activity`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setShowActivity(prev => ({ ...prev, [itemId]: data.activities || [] }));
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const fetchComments = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/comments`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId ? { ...item, comments: data.comments } : item
          )
        );
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCreateItem = async () => {
    if (!formData.title.trim()) {
      showError('Title is required');
      return;
    }

    try {
      const recurrencePattern = formData.recurrence.enabled ? {
        type: formData.recurrence.type,
        interval: formData.recurrence.interval,
        end_date: formData.recurrence.end_date || null,
      } : null;

      const response = await fetch('/api/admin/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
          recurrence_pattern: recurrencePattern,
          subtasks: formData.subtasks.filter(Boolean),
        }),
      });

      if (response.ok) {
        showSuccess('Agenda item created successfully!');
        setIsCreating(false);
        resetForm();
        fetchItems();
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create agenda item');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      showError('Failed to create agenda item');
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<AgendaItem>) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        showSuccess('Item updated successfully!');
        setEditingId(null);
        fetchItems();
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      showError('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this agenda item?')) return;

    try {
      const response = await fetch(`/api/admin/agenda/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showSuccess('Item deleted successfully!');
        fetchItems();
      } else {
        showError('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showError('Failed to delete item');
    }
  };

  const handleAddSubtask = async (itemId: string) => {
    const title = newSubtask[itemId]?.trim();
    if (!title) return;

    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        setNewSubtask(prev => ({ ...prev, [itemId]: '' }));
        fetchSubtasks(itemId);
        fetchItems(); // Refresh to update counts
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleToggleSubtask = async (itemId: string, subtaskId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/subtasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subtask_id: subtaskId, is_completed: !isCompleted }),
      });

      if (response.ok) {
        fetchSubtasks(itemId);
        fetchItems(); // Refresh to update progress
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  const handleDeleteSubtask = async (itemId: string, subtaskId: string) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/subtasks?subtask_id=${subtaskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchSubtasks(itemId);
        fetchItems();
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const handleAddAttachment = async (itemId: string) => {
    const attachment = newAttachment[itemId];
    if (!attachment?.name || !attachment?.url) {
      showError('Name and URL are required');
      return;
    }

    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(attachment),
      });

      if (response.ok) {
        setNewAttachment(prev => ({ ...prev, [itemId]: { type: 'link', name: '', url: '' } }));
        fetchAttachments(itemId);
        fetchItems();
        showSuccess('Attachment added!');
      }
    } catch (error) {
      console.error('Error adding attachment:', error);
      showError('Failed to add attachment');
    }
  };

  const handleStartTimer = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'start' }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveTimers(prev => ({ ...prev, [itemId]: data.timeLog.id }));
        showSuccess('Timer started!');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      showError('Failed to start timer');
    }
  };

  const handleStopTimer = async (itemId: string) => {
    const logId = activeTimers[itemId];
    if (!logId) return;

    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'end', log_id: logId }),
      });

      if (response.ok) {
        setActiveTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[itemId];
          return newTimers;
        });
        fetchTimeLogs(itemId);
        fetchItems(); // Refresh to update actual_hours
        showSuccess('Timer stopped!');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      showError('Failed to stop timer');
    }
  };

  const handleAddComment = async (itemId: string) => {
    const comment = newComment[itemId]?.trim();
    if (!comment) return;

    setAddingComment(itemId);
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        setNewComment(prev => ({ ...prev, [itemId]: '' }));
        fetchComments(itemId);
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, comments_count: (item.comments_count || 0) + 1 }
              : item
          )
        );
        showSuccess('Comment added!');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Failed to add comment');
    } finally {
      setAddingComment(null);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      showError('Tag name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/agenda/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTag),
      });

      if (response.ok) {
        setShowCreateTag(false);
        setNewTag({ name: '', color: '#6b7280' });
        fetchTags();
        showSuccess('Tag created!');
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      showError('Failed to create tag');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'task',
      priority: 'medium',
      due_date: '',
      start_date: '',
      assigned_to: user?.id || '',
      tags: '',
      tag_ids: [],
      notes: '',
      notify_on_due: true,
      notify_on_update: false,
      estimated_hours: '',
      color: '#3b82f6',
      subtasks: [],
      recurrence: {
        enabled: false,
        type: 'daily',
        interval: 1,
        end_date: '',
      },
    });
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'cancelled': return <X className="h-5 w-5 text-gray-400" />;
      default: return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Filter and sort items
  const filteredItems = items.filter(item => {
    // Filter by type
    if (filterType === 'my-items' && item.created_by !== user?.id) return false;
    if (filterType === 'assigned-to-me' && item.assigned_to !== user?.id) return false;
    if (filterType === 'pending' && item.status !== 'pending') return false;
    if (filterType === 'in_progress' && item.status !== 'in_progress') return false;
    if (filterType === 'completed' && item.status !== 'completed') return false;
    if (filterType === 'high-priority' && !['high', 'urgent'].includes(item.priority)) return false;

    // Filter by selected tags
    if (selectedTags.length > 0) {
      const itemTagIds = item.item_tags?.map(t => t.id) || [];
      if (!selectedTags.some(tagId => itemTagIds.includes(tagId))) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.assigned_to_name.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'due_date':
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'status':
        const statusOrder = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      case 'progress':
        return (b.progress_percentage || 0) - (a.progress_percentage || 0);
      default:
        return 0;
    }
  });

  // Calculate statistics
  const stats = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    completed: items.filter(i => i.status === 'completed').length,
    overdue: items.filter(i => i.status !== 'completed' && isOverdue(i.due_date)).length,
    high_priority: items.filter(i => ['high', 'urgent'].includes(i.priority)).length,
    my_items: items.filter(i => i.assigned_to === user?.id && i.status !== 'completed').length,
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
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <AlertCircle className="h-5 w-5" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calendar className="h-8 w-8 text-teal-600" />
            Team Agenda
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Advanced task management with subtasks, time tracking, and collaboration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateTag(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Tag className="h-4 w-4" />
            Manage Tags
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-lg"
          >
            <Plus className="h-4 w-4" />
            New Item
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Layers className="h-5 w-5 text-gray-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Circle className="h-5 w-5 text-gray-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.in_progress}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-2xl font-bold text-red-600">{stats.overdue}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Flag className="h-5 w-5 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">{stats.high_priority}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">High Priority</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-teal-200 dark:border-teal-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <User className="h-5 w-5 text-teal-600" />
            <span className="text-2xl font-bold text-teal-600">{stats.my_items}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">My Active</div>
        </div>
      </div>

      {/* View Mode Selector & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View Mode */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-1" />
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4 inline mr-1" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-1" />
              Calendar
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agenda items..."
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Items</option>
              <option value="my-items">My Items</option>
              <option value="assigned-to-me">Assigned to Me</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="high-priority">High Priority</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created_at">Created Date</option>
              <option value="status">Status</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by tags:</span>
            {allTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag.id)
                      ? prev.filter(id => id !== tag.id)
                      : [...prev, tag.id]
                  );
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTags.includes(tag.id)
                    ? 'ring-2 ring-offset-2 ring-teal-500'
                    : ''
                }`}
                style={{
                  backgroundColor: `${tag.color}30`,
                  color: tag.color,
                }}
              >
                {tag.name}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Items List */}
      {sortedItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Agenda Items Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || selectedTags.length > 0 ? 'Try adjusting your filters' : 'Create your first agenda item to get started'}
          </p>
          {!searchQuery && selectedTags.length === 0 && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create First Item
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map(item => {
            const priorityColor = getPriorityColor(item.priority);
            const isExpanded = expandedId === item.id;
            const hasTimer = activeTimers[item.id];

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
                style={{ borderLeftWidth: '4px', borderLeftColor: item.color || '#3b82f6' }}
              >
                {/* Item Header */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : item.id);
                    if (!isExpanded) {
                      fetchSubtasks(item.id);
                      fetchAttachments(item.id);
                      fetchTimeLogs(item.id);
                      if (!item.comments) fetchComments(item.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="pt-1">
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {item.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${priorityColor}-100 dark:bg-${priorityColor}-900/30 text-${priorityColor}-700 dark:text-${priorityColor}-300`}>
                            {item.priority}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {item.type}
                          </span>
                          {item.recurrence_pattern && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                              <Repeat className="h-3 w-3 inline mr-1" />
                              Recurring
                            </span>
                          )}
                          {hasTimer && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 animate-pulse">
                              <Timer className="h-3 w-3 inline mr-1" />
                              Timer Active
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-6 text-sm flex-wrap">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span className={isOverdue(item.due_date) && item.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                              {formatDate(item.due_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <User className="h-4 w-4" />
                            <span>{item.assigned_to_name}</span>
                          </div>
                          {(item.progress_percentage || 0) > 0 && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 transition-all"
                                    style={{ width: `${item.progress_percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-blue-600">{item.progress_percentage}%</span>
                              </div>
                            </div>
                          )}
                          {item.subtasks_count! > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <CheckSquare className="h-4 w-4" />
                              <span>{item.subtasks_count} subtasks</span>
                            </div>
                          )}
                          {item.attachments_count! > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Paperclip className="h-4 w-4" />
                              <span>{item.attachments_count}</span>
                            </div>
                          )}
                          {item.comments_count! > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <MessageSquare className="h-4 w-4" />
                              <span>{item.comments_count}</span>
                            </div>
                          )}
                          {item.estimated_hours && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Target className="h-4 w-4" />
                              <span>{item.estimated_hours}h est.</span>
                            </div>
                          )}
                          {item.actual_hours && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Timer className="h-4 w-4" />
                              <span>{item.actual_hours}h logged</span>
                            </div>
                          )}
                        </div>
                        {item.item_tags && item.item_tags.length > 0 && (
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {item.item_tags.map(tag => (
                              <span
                                key={tag.id}
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${tag.color}30`,
                                  color: tag.color,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {!hasTimer ? (
                        <button
                          onClick={() => handleStartTimer(item.id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Start Timer"
                        >
                          <PlayCircle className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStopTimer(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors animate-pulse"
                          title="Stop Timer"
                        >
                          <StopCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {/* Tabs for different sections */}
                    <div className="px-6 py-4 space-y-4">
                      {/* Subtasks Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckSquare className="h-5 w-5 text-teal-600" />
                          Subtasks ({showSubtasks[item.id]?.filter(s => s.is_completed).length || 0}/{showSubtasks[item.id]?.length || 0})
                        </h4>
                        {showSubtasks[item.id] && showSubtasks[item.id].length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {showSubtasks[item.id].map(subtask => (
                              <div key={subtask.id} className="flex items-center gap-3 group">
                                <button
                                  onClick={() => handleToggleSubtask(item.id, subtask.id, subtask.is_completed)}
                                  className="flex-shrink-0"
                                >
                                  {subtask.is_completed ? (
                                    <CheckSquare className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Square className="h-5 w-5 text-gray-400 hover:text-teal-600" />
                                  )}
                                </button>
                                <span className={`flex-1 text-sm ${subtask.is_completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {subtask.title}
                                </span>
                                <button
                                  onClick={() => handleDeleteSubtask(item.id, subtask.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No subtasks yet</p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubtask[item.id] || ''}
                            onChange={(e) => setNewSubtask(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask(item.id)}
                            placeholder="Add a subtask..."
                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => handleAddSubtask(item.id)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Time Tracking Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Timer className="h-5 w-5 text-blue-600" />
                          Time Tracking
                        </h4>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estimated</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {item.estimated_hours ? `${item.estimated_hours}h` : '-'}
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Logged</div>
                            <div className="text-lg font-bold text-blue-600">
                              {item.actual_hours ? `${item.actual_hours}h` : '0h'}
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Variance</div>
                            <div className={`text-lg font-bold ${
                              item.estimated_hours && item.actual_hours && item.actual_hours > item.estimated_hours
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}>
                              {item.estimated_hours && item.actual_hours
                                ? `${(item.actual_hours - item.estimated_hours).toFixed(1)}h`
                                : '-'}
                            </div>
                          </div>
                        </div>
                        {showTimeLogs[item.id] && showTimeLogs[item.id].length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {showTimeLogs[item.id].map(log => (
                              <div key={log.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700 rounded p-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {log.user?.name || 'Unknown'}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {formatTime(log.started_at)}
                                  </span>
                                </div>
                                {log.duration_minutes && (
                                  <span className="font-medium text-blue-600">
                                    {formatDuration(log.duration_minutes)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Attachments Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Paperclip className="h-5 w-5 text-purple-600" />
                          Attachments ({item.attachments_count || 0})
                        </h4>
                        {showAttachments[item.id] && showAttachments[item.id].length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {showAttachments[item.id].map(attachment => (
                              <div key={attachment.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 group">
                                {attachment.type === 'image' ? (
                                  <ImageIcon className="h-5 w-5 text-purple-600" />
                                ) : attachment.type === 'file' ? (
                                  <FileText className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <LinkIcon className="h-5 w-5 text-teal-600" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {attachment.name}
                                  </div>
                                  {attachment.file_size && (
                                    <div className="text-xs text-gray-500">
                                      {(attachment.file_size / 1024).toFixed(1)} KB
                                    </div>
                                  )}
                                </div>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-gray-600 hover:text-teal-600 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No attachments</p>
                        )}
                        <div className="space-y-2">
                          <select
                            value={newAttachment[item.id]?.type || 'link'}
                            onChange={(e) => setNewAttachment(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], type: e.target.value, name: prev[item.id]?.name || '', url: prev[item.id]?.url || '' }
                            }))}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                          >
                            <option value="link">Link</option>
                            <option value="file">File</option>
                            <option value="image">Image</option>
                          </select>
                          <input
                            type="text"
                            value={newAttachment[item.id]?.name || ''}
                            onChange={(e) => setNewAttachment(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], type: prev[item.id]?.type || 'link', name: e.target.value, url: prev[item.id]?.url || '' }
                            }))}
                            placeholder="Attachment name..."
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newAttachment[item.id]?.url || ''}
                              onChange={(e) => setNewAttachment(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], type: prev[item.id]?.type || 'link', name: prev[item.id]?.name || '', url: e.target.value }
                              }))}
                              placeholder="URL..."
                              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            />
                            <button
                              onClick={() => handleAddAttachment(item.id)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-orange-600" />
                          Comments ({item.comments_count || 0})
                        </h4>
                        {item.comments && item.comments.length > 0 ? (
                          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                            {item.comments.map(comment => (
                              <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {comment.user_name}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTime(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {comment.comment}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No comments yet</p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment[item.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(item.id)}
                            placeholder="Add a comment..."
                            disabled={addingComment === item.id}
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => handleAddComment(item.id)}
                            disabled={addingComment === item.id}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Activity Log */}
                      {showActivity[item.id] && showActivity[item.id].length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-gray-600" />
                            Activity Log
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {showActivity[item.id].slice(0, 10).map(activity => (
                              <div key={activity.id} className="flex items-start gap-3 text-xs">
                                <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5"></div>
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {activity.user_name}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {' '}{activity.action.replace(/_/g, ' ')}
                                  </span>
                                  {activity.field_changed && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {' '}({activity.field_changed}: {activity.old_value} → {activity.new_value})
                                    </span>
                                  )}
                                  <div className="text-gray-400 text-xs mt-0.5">
                                    {formatTime(activity.created_at)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => fetchActivity(item.id)}
                            className="text-xs text-teal-600 hover:text-teal-700 mt-2"
                          >
                            Refresh activity
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Item Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create New Agenda Item
                </h2>
                <button
                  onClick={() => { setIsCreating(false); resetForm(); }}
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
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details..."
                  rows={4}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Type, Priority, Color */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="task">Task</option>
                    <option value="note">Note</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Dates and Estimated Hours */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                    placeholder="0.0"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          tag_ids: prev.tag_ids.includes(tag.id)
                            ? prev.tag_ids.filter(id => id !== tag.id)
                            : [...prev.tag_ids, tag.id]
                        }));
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        formData.tag_ids.includes(tag.id) ? 'ring-2 ring-offset-2 ring-teal-500' : ''
                      }`}
                      style={{
                        backgroundColor: `${tag.color}30`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subtasks (Checklist)
                </label>
                {formData.subtasks.map((subtask, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={subtask}
                      onChange={(e) => {
                        const newSubtasks = [...formData.subtasks];
                        newSubtasks[index] = e.target.value;
                        setFormData({ ...formData, subtasks: newSubtasks });
                      }}
                      placeholder="Subtask title..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          subtasks: formData.subtasks.filter((_, i) => i !== index)
                        });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFormData({ ...formData, subtasks: [...formData.subtasks, ''] })}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Subtask
                </button>
              </div>

              {/* Recurring Settings */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.recurrence.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      recurrence: { ...formData.recurrence, enabled: e.target.checked }
                    })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Repeat className="h-4 w-4 inline mr-1" />
                    Make this recurring
                  </label>
                </div>
                {formData.recurrence.enabled && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <select
                      value={formData.recurrence.type}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurrence: { ...formData.recurrence, type: e.target.value as any }
                      })}
                      className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={formData.recurrence.interval}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurrence: { ...formData.recurrence, interval: parseInt(e.target.value) || 1 }
                      })}
                      placeholder="Interval"
                      className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                    <input
                      type="date"
                      value={formData.recurrence.end_date}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurrence: { ...formData.recurrence, end_date: e.target.value }
                      })}
                      placeholder="End date (optional)"
                      className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Private notes (only visible to admins)..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Notification Settings */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.notify_on_due}
                    onChange={(e) => setFormData({ ...formData, notify_on_due: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <Bell className="h-4 w-4 inline mr-1" />
                    Notify on due date
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.notify_on_update}
                    onChange={(e) => setFormData({ ...formData, notify_on_update: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <Bell className="h-4 w-4 inline mr-1" />
                    Notify on updates
                  </span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => { setIsCreating(false); resetForm(); }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateItem}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Create Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Tag Modal */}
      {showCreateTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create New Tag
                </h2>
                <button
                  onClick={() => setShowCreateTag(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  placeholder="e.g., urgent, marketing, bug"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'].map(color => (
                  <button
                    key={color}
                    onClick={() => setNewTag({ ...newTag, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newTag.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateTag(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTag}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Create Tag
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Info Box */}
      <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-800">
        <h3 className="font-bold text-teal-900 dark:text-teal-300 mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Advanced Features
        </h3>
        <ul className="grid grid-cols-2 gap-2 text-sm text-teal-800 dark:text-teal-300">
          <li>• <strong>Subtasks:</strong> Break down tasks into checklist items</li>
          <li>• <strong>Time Tracking:</strong> Start/stop timers to log work time</li>
          <li>• <strong>Attachments:</strong> Add files, links, and images</li>
          <li>• <strong>Tags:</strong> Organize with custom colored tags</li>
          <li>• <strong>Progress:</strong> Auto-calculated from subtask completion</li>
          <li>• <strong>Recurring:</strong> Set up repeating agenda items</li>
          <li>• <strong>Activity Log:</strong> Track all changes and updates</li>
          <li>• <strong>Collaboration:</strong> Comments and notifications</li>
        </ul>
      </div>
    </div>
  );
}
