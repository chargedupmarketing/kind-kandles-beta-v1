'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Mail, 
  Calendar,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  X,
  Loader,
  UserPlus,
  RefreshCw,
  MoreVertical,
  Edit2,
  Save,
  Lock,
  AlertTriangle,
  UsersRound
} from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'user';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  sub_levels?: string[];
}

interface NewUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'user';
}

interface SubLevel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

type ActiveTab = 'users' | 'teams';

export default function UserManagement() {
  const { hasPermission, isSuperAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  
  // User state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<string | null>(null);
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'user' as 'super_admin' | 'admin' | 'user',
    password: '',
    confirmPassword: '',
    sub_levels: [] as string[]
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  
  // Sub-level state
  const [subLevels, setSubLevels] = useState<SubLevel[]>([]);
  const [subLevelsLoading, setSubLevelsLoading] = useState(true);
  const [isCreatingSubLevel, setIsCreatingSubLevel] = useState(false);
  const [editingSubLevelId, setEditingSubLevelId] = useState<string | null>(null);
  const [subLevelFormData, setSubLevelFormData] = useState({ name: '', description: '' });
  const [subLevelMobileMenuOpen, setSubLevelMobileMenuOpen] = useState<string | null>(null);
  
  const canManageSubLevels = hasPermission('manage_sub_levels');
  
  const [newUser, setNewUser] = useState<NewUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
    fetchSubLevels();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

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
      setSubLevelsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUser.email || !newUser.password || !newUser.first_name || !newUser.last_name) {
      setError('All fields are required');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newUser.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`User ${newUser.email} created successfully`);
      setNewUser({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        role: 'admin'
      });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setError(null);
    setSuccess(null);
    setIsDeleting(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      setDeleteConfirm(null);
      setMobileMenuOpen(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      password: '',
      confirmPassword: '',
      sub_levels: user.sub_levels || []
    });
    setShowEditPassword(false);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setError(null);
    setSuccess(null);

    // Validate password if provided
    if (editFormData.password) {
      if (editFormData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (editFormData.password !== editFormData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsUpdating(true);
    try {
      const updatePayload: Record<string, unknown> = {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        role: editFormData.role,
        sub_levels: editFormData.sub_levels
      };

      // Only include password if it was changed
      if (editFormData.password) {
        updatePayload.password = editFormData.password;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess(`User ${editFormData.first_name} ${editFormData.last_name} updated successfully`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleSubLevel = (subLevelId: string) => {
    setEditFormData(prev => ({
      ...prev,
      sub_levels: prev.sub_levels.includes(subLevelId)
        ? prev.sub_levels.filter(id => id !== subLevelId)
        : [...prev.sub_levels, subLevelId]
    }));
  };

  // Sub-level handlers
  const handleCreateSubLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('/api/admin/sub-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subLevelFormData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubLevels([...subLevels, data.subLevel]);
        setSubLevelFormData({ name: '', description: '' });
        setIsCreatingSubLevel(false);
        setSuccess('Team created successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to create team');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleUpdateSubLevel = async (id: string) => {
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/sub-levels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subLevelFormData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubLevels(subLevels.map(sl => sl.id === id ? data.subLevel : sl));
        setEditingSubLevelId(null);
        setSubLevelFormData({ name: '', description: '' });
        setSuccess('Team updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update team');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteSubLevel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove it from all users.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/sub-levels/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSubLevels(subLevels.filter(sl => sl.id !== id));
        setSuccess('Team deleted successfully');
        setSubLevelMobileMenuOpen(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete team');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const startEditSubLevel = (subLevel: SubLevel) => {
    setEditingSubLevelId(subLevel.id);
    setSubLevelFormData({ name: subLevel.name, description: subLevel.description || '' });
    setIsCreatingSubLevel(false);
    setSubLevelMobileMenuOpen(null);
  };

  const cancelSubLevelEdit = () => {
    setEditingSubLevelId(null);
    setIsCreatingSubLevel(false);
    setSubLevelFormData({ name: '', description: '' });
    setError(null);
  };

  const getRoleBadge = (role: string, compact = false) => {
    const baseClasses = compact 
      ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (role) {
      case 'super_admin':
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`}>
            <ShieldCheck className="h-3 w-3 mr-1" />
            {compact ? 'Super' : 'Super Admin'}
          </span>
        );
      case 'admin':
        return (
          <span className={`${baseClasses} bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300`}>
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </span>
        );
      case 'user':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>
            User
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`}>
            {role}
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null, short = false) => {
    if (!dateString) return 'Never';
    const options: Intl.DateTimeFormatOptions = short 
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            User Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
            Manage admin users, roles, and teams
          </p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => { fetchUsers(); fetchSubLevels(); }}
            className="p-2.5 sm:p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {activeTab === 'users' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              <UserPlus className="h-5 w-5" />
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
          {activeTab === 'teams' && canManageSubLevels && !isCreatingSubLevel && !editingSubLevelId && (
            <button
              onClick={() => setIsCreatingSubLevel(true)}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add Team</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Users</span>
          <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'teams'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UsersRound className="h-4 w-4" />
          <span>Teams</span>
          <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
            {subLevels.length}
          </span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-800 dark:text-red-200 break-words">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-800 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4 flex items-start space-x-3">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-green-800 dark:text-green-200 break-words">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-600 dark:text-green-400 hover:text-green-800 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* Create User Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
              <div className="bg-white dark:bg-slate-800 w-full sm:rounded-xl shadow-xl sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl">
                <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Create New User
                    </h3>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCreateUser} className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                        className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                        className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                        placeholder="admin@example.com"
                        required
                        autoCapitalize="none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2.5 sm:py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                        placeholder="Min. 8 characters"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Confirm Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                      placeholder="Confirm password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Role *
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'super_admin' | 'admin' | 'user' })}
                      className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                    >
                      <option value="user">User - View only</option>
                      <option value="admin">Admin - Store access</option>
                      <option value="super_admin">Super Admin - Full access</option>
                    </select>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="w-full sm:w-auto px-4 py-3 sm:py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors text-base"
                    >
                      {isCreating ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Create User</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
              <div className="bg-white dark:bg-slate-800 w-full sm:rounded-xl shadow-xl sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl">
                <div className="sticky top-0 bg-white dark:bg-slate-800 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Edit User
                    </h3>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleUpdateUser} className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.first_name}
                        onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                        className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={editFormData.last_name}
                        onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                        className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        value={editingUser.email}
                        disabled
                        className="w-full pl-10 pr-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed text-base"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Role *
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'super_admin' | 'admin' | 'user' })}
                      className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                    >
                      <option value="user">User - View only</option>
                      <option value="admin">Admin - Store access</option>
                      <option value="super_admin">Super Admin - Full access</option>
                    </select>
                  </div>

                  {/* Teams/Sub-levels */}
                  {subLevels.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Teams
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                        {subLevels.map((subLevel) => (
                          <label key={subLevel.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editFormData.sub_levels.includes(subLevel.id)}
                              onChange={() => handleToggleSubLevel(subLevel.id)}
                              className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{subLevel.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Password Change Section */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Change Password
                      </label>
                      <span className="text-xs text-slate-500 dark:text-slate-400">(Optional)</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type={showEditPassword ? 'text' : 'password'}
                            value={editFormData.password}
                            onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                            className="w-full pl-10 pr-10 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                            placeholder="Min. 8 characters"
                            minLength={8}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          >
                            {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {editFormData.password && (
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                            Confirm New Password
                          </label>
                          <input
                            type={showEditPassword ? 'text' : 'password'}
                            value={editFormData.confirmPassword}
                            onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                            placeholder="Confirm password"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="w-full sm:w-auto px-4 py-3 sm:py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors text-base"
                    >
                      {isUpdating ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No admin users found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                  Create your first admin user to get started
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Add User</span>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                                <span className="text-teal-600 dark:text-teal-400 font-medium">
                                  {user.first_name[0]}{user.last_name[0]}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              disabled={user.role === 'super_admin'}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                user.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200'
                              } ${user.role === 'super_admin' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(user.last_login)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                                  title="Edit user"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                              {isSuperAdmin && deleteConfirm === user.id ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-slate-600 dark:text-slate-400">Confirm?</span>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={isDeleting === user.id}
                                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                  >
                                    {isDeleting === user.id ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="p-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : isSuperAdmin ? (
                                <button
                                  onClick={() => setDeleteConfirm(user.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map((user) => (
                    <div key={user.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="h-11 w-11 flex-shrink-0 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
                            <span className="text-teal-600 dark:text-teal-400 font-medium text-sm">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                                {user.first_name} {user.last_name}
                              </span>
                              {getRoleBadge(user.role, true)}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                          </div>
                        </div>
                        
                        {isSuperAdmin && (
                          <div className="relative ml-2">
                            <button
                              onClick={() => setMobileMenuOpen(mobileMenuOpen === user.id ? null : user.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            
                            {mobileMenuOpen === user.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setMobileMenuOpen(null)} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-20 py-1">
                                  <button
                                    onClick={() => { handleEditUser(user); setMobileMenuOpen(null); }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 flex items-center space-x-2"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                    <span>Edit User</span>
                                  </button>
                                  <button
                                    onClick={() => { handleToggleActive(user.id, user.is_active); setMobileMenuOpen(null); }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                                  >
                                    {user.is_active ? 'Deactivate User' : 'Activate User'}
                                  </button>
                                  {deleteConfirm === user.id ? (
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                      <span className="text-sm text-red-600 dark:text-red-400">Confirm delete?</span>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => handleDeleteUser(user.id)}
                                          disabled={isDeleting === user.id}
                                          className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                        >
                                          {isDeleting === user.id ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </button>
                                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded">
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirm(user.id)}
                                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      Delete User
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <button
                          onClick={() => user.role !== 'super_admin' && handleToggleActive(user.id, user.is_active)}
                          disabled={user.role === 'super_admin'}
                          className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          } ${user.role === 'super_admin' ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <span className="text-slate-500 dark:text-slate-400">
                          Last login: {formatDate(user.last_login, true)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Teams Tab Content */}
      {activeTab === 'teams' && (
        <>
          {/* Create Team Form */}
          {isCreatingSubLevel && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Create New Team
              </h3>
              <form onSubmit={handleCreateSubLevel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={subLevelFormData.name}
                    onChange={(e) => setSubLevelFormData({ ...subLevelFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                    placeholder="e.g., Marketing Team"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={subLevelFormData.description}
                    onChange={(e) => setSubLevelFormData({ ...subLevelFormData, description: e.target.value })}
                    className="w-full px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={cancelSubLevelEdit}
                    className="flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
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

          {/* Teams List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {subLevelsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : subLevels.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <UsersRound className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p>No teams found</p>
                {canManageSubLevels && (
                  <button
                    onClick={() => setIsCreatingSubLevel(true)}
                    className="mt-4 inline-flex items-center space-x-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Team</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {subLevels.map((subLevel) => (
                  <div key={subLevel.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    {editingSubLevelId === subLevel.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleUpdateSubLevel(subLevel.id); }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name *</label>
                          <input
                            type="text"
                            value={subLevelFormData.name}
                            onChange={(e) => setSubLevelFormData({ ...subLevelFormData, name: e.target.value })}
                            className="w-full px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                          <textarea
                            value={subLevelFormData.description}
                            onChange={(e) => setSubLevelFormData({ ...subLevelFormData, description: e.target.value })}
                            className="w-full px-4 py-2.5 sm:py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-base"
                            rows={2}
                          />
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                          <button type="button" onClick={cancelSubLevelEdit} className="flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            <X className="h-4 w-4" /> Cancel
                          </button>
                          <button type="submit" className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors">
                            <Save className="h-4 w-4" /> Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${subLevel.is_system ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-teal-100 dark:bg-teal-900/30'}`}>
                            {subLevel.is_system ? (
                              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <UsersRound className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{subLevel.name}</h3>
                              {subLevel.is_system && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                                  <Lock className="h-3 w-3" /> System
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 line-clamp-2">
                              {subLevel.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        
                        {canManageSubLevels && !subLevel.is_system && (
                          <>
                            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => startEditSubLevel(subLevel)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Edit">
                                <Edit2 className="h-4 w-4 text-slate-500" />
                              </button>
                              <button onClick={() => handleDeleteSubLevel(subLevel.id, subLevel.name)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                            
                            <div className="sm:hidden relative flex-shrink-0">
                              <button
                                onClick={() => setSubLevelMobileMenuOpen(subLevelMobileMenuOpen === subLevel.id ? null : subLevel.id)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              
                              {subLevelMobileMenuOpen === subLevel.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setSubLevelMobileMenuOpen(null)} />
                                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-20 py-1">
                                    <button onClick={() => startEditSubLevel(subLevel)} className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2">
                                      <Edit2 className="h-4 w-4" /> Edit
                                    </button>
                                    <button onClick={() => handleDeleteSubLevel(subLevel.id, subLevel.name)} className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                      <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                        
                        {subLevel.is_system && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="hidden sm:inline">Protected</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              About User Roles & Teams
            </h4>
            <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li><strong>Super Admin:</strong> Full system access including user management and database operations</li>
              <li><strong>Admin:</strong> Full store management (products, orders, customers, discounts)</li>
              <li><strong>User:</strong> View-only access to dashboard</li>
              <li><strong>Teams:</strong> Organize users into groups for better management and permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
