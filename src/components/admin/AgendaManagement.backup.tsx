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
  Send
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

interface AgendaItem {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'note' | 'reminder';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_to: string;
  assigned_to_name: string;
  created_by: string;
  created_by_name: string;
  tags: string[];
  notes: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  notify_on_due: boolean;
  notify_on_update: boolean;
  comments?: AgendaComment[];
  comments_count?: number;
}

type FilterType = 'all' | 'my-items' | 'assigned-to-me' | 'pending' | 'completed';
type SortType = 'due_date' | 'priority' | 'created_at' | 'status';

export default function AgendaManagement() {
  const { user } = useAdmin();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('due_date');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [addingComment, setAddingComment] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as 'task' | 'note' | 'reminder',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
    assigned_to: user?.id || '',
    tags: '',
    notes: '',
    notify_on_due: true,
    notify_on_update: false,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/agenda', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching agenda items:', error);
      setErrorMessage('Failed to load agenda items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      setErrorMessage('Title is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItems([data.item, ...items]);
        setSuccessMessage('Agenda item created successfully');
        setIsCreating(false);
        resetForm();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to create item');
      }
    } catch (error) {
      console.error('Error creating agenda item:', error);
      setErrorMessage('Failed to create item');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<AgendaItem>) => {
    try {
      const response = await fetch(`/api/admin/agenda/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setItems(items.map(item => item.id === id ? data.item : item));
        setSuccessMessage('Item updated successfully');
        setEditingId(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating agenda item:', error);
      setErrorMessage('Failed to update item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/admin/agenda/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== id));
        setSuccessMessage('Item deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting agenda item:', error);
      setErrorMessage('Failed to delete item');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await handleUpdate(id, { 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    });
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
        const data = await response.json();
        // Update the item with the new comment
        setItems(items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              comments: [...(item.comments || []), data.comment],
              comments_count: (item.comments_count || 0) + 1,
            };
          }
          return item;
        }));
        setNewComment({ ...newComment, [itemId]: '' });
        setSuccessMessage('Comment added successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setErrorMessage('Failed to add comment');
    } finally {
      setAddingComment(null);
    }
  };

  const fetchComments = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/agenda/${itemId}/comments`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setItems(items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              comments: data.comments,
              comments_count: data.comments.length,
            };
          }
          return item;
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'task',
      priority: 'medium',
      due_date: '',
      assigned_to: user?.id || '',
      tags: '',
      notes: '',
      notify_on_due: true,
      notify_on_update: false,
    });
  };

  // Filter and sort items
  const filteredItems = items.filter(item => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(query) && 
          !item.description.toLowerCase().includes(query) &&
          !item.tags.some(tag => tag.toLowerCase().includes(query))) {
        return false;
      }
    }

    // Type filter
    switch (filterType) {
      case 'my-items':
        return item.created_by === user?.id;
      case 'assigned-to-me':
        return item.assigned_to === user?.id;
      case 'pending':
        return item.status === 'pending' || item.status === 'in_progress';
      case 'completed':
        return item.status === 'completed';
      default:
        return true;
    }
  }).sort((a, b) => {
    switch (sortBy) {
      case 'due_date':
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'status':
        const statusOrder = { in_progress: 0, pending: 1, completed: 2, cancelled: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return CheckCircle;
      case 'note': return FileText;
      case 'reminder': return Bell;
      default: return Circle;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
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
          <button onClick={() => setErrorMessage('')} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-7 w-7 text-teal-600" />
            Team Agenda
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage tasks, notes, and reminders for your team
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Circle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {items.filter(i => i.status === 'pending' || i.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {items.filter(i => i.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {items.filter(i => isOverdue(i.due_date) && i.status !== 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned to Me</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {items.filter(i => i.assigned_to === user?.id && i.status !== 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Items</option>
            <option value="my-items">My Items</option>
            <option value="assigned-to-me">Assigned to Me</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="due_date">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
            <option value="created_at">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-teal-200 dark:border-teal-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Item</h3>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="task">Task</option>
                  <option value="note">Note</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="Enter description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="urgent, meeting, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notify_on_due}
                  onChange={(e) => setFormData({ ...formData, notify_on_due: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Notify when due</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notify_on_update}
                  onChange={(e) => setFormData({ ...formData, notify_on_update: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Notify on updates</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Create Item
              </button>
              <button
                onClick={() => { setIsCreating(false); resetForm(); }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No items found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your filters or search query'
                : 'Create your first agenda item to get started'}
            </p>
            {!isCreating && (
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
          filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            const isExpanded = expandedId === item.id;
            const overdue = isOverdue(item.due_date);
            const dueToday = isDueToday(item.due_date);

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
                  item.status === 'completed'
                    ? 'border-gray-200 dark:border-gray-700 opacity-60'
                    : overdue
                    ? 'border-red-200 dark:border-red-800'
                    : dueToday
                    ? 'border-yellow-200 dark:border-yellow-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleStatus(item.id, item.status)}
                      className="mt-1 flex-shrink-0"
                    >
                      {item.status === 'completed' ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 hover:text-teal-600 transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TypeIcon className="h-4 w-4 text-gray-400" />
                            <h3 className={`text-lg font-semibold ${
                              item.status === 'completed'
                                ? 'line-through text-gray-500 dark:text-gray-500'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {item.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {item.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            {item.due_date && (
                              <div className={`flex items-center gap-1 ${
                                overdue ? 'text-red-600 dark:text-red-400 font-semibold' :
                                dueToday ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : ''
                              }`}>
                                <Clock className="h-3 w-3" />
                                {new Date(item.due_date).toLocaleString()}
                                {overdue && ' (Overdue)'}
                                {dueToday && ' (Today)'}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Assigned to: {item.assigned_to_name}
                            </div>
                            <div className="flex items-center gap-1">
                              Created by: {item.created_by_name}
                            </div>
                            {(item.comments_count || 0) > 0 && (
                              <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                                <MessageSquare className="h-3 w-3" />
                                {item.comments_count} {item.comments_count === 1 ? 'comment' : 'comments'}
                              </div>
                            )}
                          </div>

                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                                >
                                  <Tag className="h-3 w-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                          {/* Additional Notes */}
                          {item.notes && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Additional Notes:
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {item.notes}
                              </p>
                            </div>
                          )}

                          {/* Comments Section */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Comments ({item.comments_count || 0})
                              </h4>
                              {!item.comments && (
                                <button
                                  onClick={() => fetchComments(item.id)}
                                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                                >
                                  Load comments
                                </button>
                              )}
                            </div>

                            {/* Comments List */}
                            {item.comments && item.comments.length > 0 && (
                              <div className="space-y-3 mb-4">
                                {item.comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex items-start justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-gray-500" />
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                          {comment.user_name}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(comment.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                      {comment.comment}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newComment[item.id] || ''}
                                onChange={(e) => setNewComment({ ...newComment, [item.id]: e.target.value })}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(item.id);
                                  }
                                }}
                                placeholder="Add a comment..."
                                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500"
                              />
                              <button
                                onClick={() => handleAddComment(item.id)}
                                disabled={!newComment[item.id]?.trim() || addingComment === item.id}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                              >
                                <Send className="h-4 w-4" />
                                {addingComment === item.id ? 'Sending...' : 'Send'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
