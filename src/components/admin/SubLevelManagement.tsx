'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  Users,
  Lock,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';

interface SubLevel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

export default function SubLevelManagement() {
  const { hasPermission, isSuperAdmin, isDeveloper } = useAdmin();
  const [subLevels, setSubLevels] = useState<SubLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = hasPermission('manage_sub_levels');

  useEffect(() => {
    fetchSubLevels();
  }, []);

  const fetchSubLevels = async () => {
    try {
      const response = await fetch('/api/admin/sub-levels');
      if (response.ok) {
        const data = await response.json();
        setSubLevels(data.subLevels || []);
      }
    } catch (error) {
      console.error('Error fetching sub-levels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/admin/sub-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubLevels([...subLevels, data.subLevel]);
        setFormData({ name: '', description: '' });
        setIsCreating(false);
        setSuccess('Sub-level created successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create sub-level');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleUpdate = async (id: string) => {
    setError('');
    
    try {
      const response = await fetch(`/api/admin/sub-levels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubLevels(subLevels.map(sl => sl.id === id ? data.subLevel : sl));
        setEditingId(null);
        setFormData({ name: '', description: '' });
        setSuccess('Sub-level updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update sub-level');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove it from all users.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/sub-levels/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSubLevels(subLevels.filter(sl => sl.id !== id));
        setSuccess('Sub-level deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete sub-level');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const startEdit = (subLevel: SubLevel) => {
    setEditingId(subLevel.id);
    setFormData({ name: subLevel.name, description: subLevel.description || '' });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', description: '' });
    setError('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Teams & Sub-Levels
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team assignments and access groups
          </p>
        </div>
        {canManage && !isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Sub-Level
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Sub-Level
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="e.g., Marketing Team"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                Create
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Levels List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {subLevels.map((subLevel) => (
            <div
              key={subLevel.id}
              className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {editingId === subLevel.id ? (
                // Edit Form
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(subLevel.id); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // Display View
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      subLevel.is_system 
                        ? 'bg-purple-100 dark:bg-purple-900/30' 
                        : 'bg-teal-100 dark:bg-teal-900/30'
                    }`}>
                      {subLevel.is_system ? (
                        <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {subLevel.name}
                        </h3>
                        {subLevel.is_system && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                            <Lock className="h-3 w-3" />
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {subLevel.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Slug: {subLevel.slug}
                      </p>
                    </div>
                  </div>
                  
                  {canManage && !subLevel.is_system && (
                    <div className="flex items-center gap-2 sm:ml-4">
                      <button
                        onClick={() => startEdit(subLevel)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(subLevel.id, subLevel.name)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  )}
                  
                  {subLevel.is_system && (
                    <div className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Protected
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {subLevels.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No sub-levels found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

