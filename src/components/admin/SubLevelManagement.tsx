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
  AlertTriangle,
  MoreVertical
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);

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
        setMobileMenuOpen(null);
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
    setMobileMenuOpen(null);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
            className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors text-sm"
          >
            <Plus className="h-5 w-5" />
            Add Sub-Level
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Create Form - Full width card on mobile */}
      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Sub-Level
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                placeholder="e.g., Marketing Team"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors"
              >
                <Save className="h-4 w-4" />
                Create
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
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              {editingId === subLevel.id ? (
                // Edit Form
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(subLevel.id); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                // Display View
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${
                      subLevel.is_system 
                        ? 'bg-purple-100 dark:bg-purple-900/30' 
                        : 'bg-teal-100 dark:bg-teal-900/30'
                    }`}>
                      {subLevel.is_system ? (
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          {subLevel.name}
                        </h3>
                        {subLevel.is_system && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                            <Lock className="h-3 w-3" />
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 line-clamp-2">
                        {subLevel.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 hidden sm:block">
                        Slug: {subLevel.slug}
                      </p>
                    </div>
                  </div>
                  
                  {/* Desktop Actions */}
                  {canManage && !subLevel.is_system && (
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
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
                  
                  {/* Mobile Actions Menu */}
                  {canManage && !subLevel.is_system && (
                    <div className="sm:hidden relative flex-shrink-0">
                      <button
                        onClick={() => setMobileMenuOpen(mobileMenuOpen === subLevel.id ? null : subLevel.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      
                      {mobileMenuOpen === subLevel.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setMobileMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-20 py-1">
                            <button
                              onClick={() => startEdit(subLevel)}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2"
                            >
                              <Edit2 className="h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(subLevel.id, subLevel.name)}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {subLevel.is_system && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="hidden sm:inline">Protected</span>
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
