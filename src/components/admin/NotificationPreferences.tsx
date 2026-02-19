'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone, 
  Save, 
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingCart,
  Star,
  BookOpen,
  MessageCircle,
  Calendar,
  Package,
  AlertTriangle,
  DollarSign,
  Users,
  ChevronDown,
  Shield
} from 'lucide-react';

interface NotificationPreference {
  notification_type: string;
  email_enabled: boolean;
  sms_enabled: boolean;
}

interface AdminInfo {
  id: string;
  email: string;
  phone_number: string | null;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  phone_number: string | null;
  is_active: boolean;
}

interface NotificationTypeInfo {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'orders' | 'content' | 'engagement' | 'system' | 'agenda' | 'social';
}

const NOTIFICATION_TYPES: NotificationTypeInfo[] = [
  {
    key: 'new_order',
    label: 'New Order',
    description: 'When a customer places a new order',
    icon: <ShoppingCart className="w-5 h-5" />,
    category: 'orders',
  },
  {
    key: 'high_value_order',
    label: 'High Value Order',
    description: 'Orders above the configured threshold',
    icon: <DollarSign className="w-5 h-5" />,
    category: 'orders',
  },
  {
    key: 'order_issues',
    label: 'Order Issues',
    description: 'Payment failures, cancellations, etc.',
    icon: <AlertTriangle className="w-5 h-5" />,
    category: 'orders',
  },
  {
    key: 'new_review',
    label: 'New Review',
    description: 'When a customer submits a product review',
    icon: <Star className="w-5 h-5" />,
    category: 'content',
  },
  {
    key: 'new_story',
    label: 'New Story',
    description: 'When a customer submits a story',
    icon: <BookOpen className="w-5 h-5" />,
    category: 'content',
  },
  {
    key: 'new_contact',
    label: 'Contact Form',
    description: 'New contact form submissions',
    icon: <MessageCircle className="w-5 h-5" />,
    category: 'engagement',
  },
  {
    key: 'new_event_booking',
    label: 'Event Booking',
    description: 'New event booking requests',
    icon: <Calendar className="w-5 h-5" />,
    category: 'engagement',
  },
  {
    key: 'low_inventory',
    label: 'Low Inventory',
    description: 'When product stock falls below threshold',
    icon: <Package className="w-5 h-5" />,
    category: 'system',
  },
  {
    key: 'agenda_assigned',
    label: 'Agenda Item Assigned',
    description: 'When an agenda item is assigned to you',
    icon: <Calendar className="w-5 h-5" />,
    category: 'agenda',
  },
  {
    key: 'agenda_due',
    label: 'Agenda Item Due',
    description: 'When an agenda item is approaching its due date',
    icon: <AlertCircle className="w-5 h-5" />,
    category: 'agenda',
  },
  {
    key: 'agenda_updated',
    label: 'Agenda Item Updated',
    description: 'When an agenda item you\'re involved with is updated',
    icon: <Calendar className="w-5 h-5" />,
    category: 'agenda',
  },
  {
    key: 'social_calendar_created',
    label: 'Calendar Created',
    description: 'When a new social media calendar is created',
    icon: <Calendar className="w-5 h-5" />,
    category: 'social',
  },
  {
    key: 'social_post_scheduled',
    label: 'Post Scheduled',
    description: 'When your social media post is scheduled',
    icon: <Calendar className="w-5 h-5" />,
    category: 'social',
  },
  {
    key: 'social_post_published',
    label: 'Post Published',
    description: 'When your social media post is published successfully',
    icon: <CheckCircle className="w-5 h-5" />,
    category: 'social',
  },
  {
    key: 'social_post_failed',
    label: 'Post Failed',
    description: 'When your social media post fails to publish',
    icon: <AlertCircle className="w-5 h-5" />,
    category: 'social',
  },
  {
    key: 'social_post_reminder',
    label: 'Post Reminder',
    description: 'Reminder 24 hours before scheduled post',
    icon: <Bell className="w-5 h-5" />,
    category: 'social',
  },
  {
    key: 'social_post_collaboration',
    label: 'Post Collaboration',
    description: 'When you\'re added as a collaborator on a post',
    icon: <Users className="w-5 h-5" />,
    category: 'social',
  },
];

const CATEGORIES = [
  { key: 'agenda', label: 'Team Agenda', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300' },
  { key: 'social', label: 'Social Media Calendar', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
  { key: 'orders', label: 'Order Notifications', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300' },
  { key: 'content', label: 'Content Submissions', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' },
  { key: 'engagement', label: 'Customer Engagement', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
  { key: 'system', label: 'System Alerts', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' },
];

export default function NotificationPreferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [smsConfigured, setSmsConfigured] = useState(false);
  
  // Super admin features
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isOwnPreferences, setIsOwnPreferences] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    fetchPreferences();
    checkSmsConfiguration();
  }, []);

  // Fetch preferences when selected user changes
  useEffect(() => {
    if (selectedUserId) {
      fetchPreferences(selectedUserId);
    }
  }, [selectedUserId]);

  const checkSmsConfiguration = async () => {
    setSmsConfigured(true);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/notifications/preferences?listUsers=true', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPreferences = async (userId?: string) => {
    try {
      setLoading(true);
      const url = userId 
        ? `/api/admin/notifications/preferences?userId=${userId}`
        : '/api/admin/notifications/preferences';
      
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch preferences');
      }

      const data = await response.json();
      setAdmin(data.admin);
      setPreferences(data.preferences);
      setPhoneNumber(data.admin?.phone_number || '');
      setIsSuperAdmin(data.isSuperAdmin || false);
      setIsOwnPreferences(data.isOwnPreferences !== false);
      
      // If super admin and first load, fetch all users
      if (data.isSuperAdmin && allUsers.length === 0) {
        fetchUsers();
      }
      
      // Set selected user ID on initial load
      if (!selectedUserId && data.admin?.id) {
        setSelectedUserId(data.admin.id);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load notification preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/notifications/preferences', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences,
          phone_number: phoneNumber || null,
          userId: selectedUserId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      const targetName = isOwnPreferences ? 'Your' : `${admin?.first_name || admin?.email}'s`;
      setMessage({ type: 'success', text: `${targetName} preferences saved successfully!` });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDropdown(false);
    setMessage(null);
  };

  const getSelectedUserDisplay = () => {
    if (!admin) return 'Select User';
    const name = admin.first_name && admin.last_name 
      ? `${admin.first_name} ${admin.last_name}`
      : admin.email;
    return isOwnPreferences ? `${name} (You)` : name;
  };

  const sendTestNotification = async (channel: 'email' | 'sms', notificationType?: string) => {
    setTesting(`${channel}-${notificationType || 'general'}`);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel,
          notification_type: notificationType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test notification');
      }

      if (data.success) {
        setMessage({ type: 'success', text: `Test ${channel} sent successfully!` });
      } else {
        setMessage({ type: 'error', text: data.errors?.join(', ') || 'Test notification failed' });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to send test notification' });
    } finally {
      setTesting(null);
    }
  };

  const togglePreference = (notificationType: string, channel: 'email' | 'sms') => {
    setPreferences(prev => prev.map(pref => {
      if (pref.notification_type === notificationType) {
        return {
          ...pref,
          [channel === 'email' ? 'email_enabled' : 'sms_enabled']: 
            !pref[channel === 'email' ? 'email_enabled' : 'sms_enabled'],
        };
      }
      return pref;
    }));
  };

  const getPreference = (notificationType: string): NotificationPreference | undefined => {
    return preferences.find(p => p.notification_type === notificationType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-pink-500" />
            Notification Preferences
          </h2>
          <p className="text-gray-600 mt-1">
            {isOwnPreferences 
              ? 'Configure how you want to receive notifications for different events'
              : `Managing notification preferences for ${admin?.first_name || admin?.email}`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Super Admin User Selector */}
          {isSuperAdmin && allUsers.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
              >
                <Users className="w-4 h-4 text-gray-500" />
                <span className="flex-1 text-left truncate">{getSelectedUserDisplay()}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium px-2">Select user to manage</p>
                  </div>
                  {allUsers.map((user) => {
                    const isSelected = user.id === selectedUserId;
                    const displayName = user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user.email;
                    
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user.id)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 ${isSelected ? 'bg-pink-50 dark:bg-pink-900/20' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-pink-600' : 'text-gray-900'}`}>
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {user.role === 'super_admin' && (
                          <span title="Super Admin">
                            <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          </span>
                        )}
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={savePreferences}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Preferences
          </button>
        </div>
      </div>

      {/* Managing Other User Banner */}
      {!isOwnPreferences && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Managing {admin?.first_name || admin?.email}'s Notification Settings
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              As a super admin, you can configure notification preferences for any team member.
            </p>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={admin?.email || ''}
                disabled
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <button
                onClick={() => sendTestNotification('email')}
                disabled={testing !== null}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {testing === 'email-general' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Test
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email address is managed in your admin profile
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (for SMS)
            </label>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
              <button
                onClick={() => sendTestNotification('sms')}
                disabled={testing !== null || !phoneNumber}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {testing === 'sms-general' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Test
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Include country code for SMS notifications
            </p>
          </div>
        </div>
      </div>

      {/* Notification Types by Category */}
      {CATEGORIES.map(category => {
        const categoryTypes = NOTIFICATION_TYPES.filter(t => t.category === category.key);
        
        return (
          <div key={category.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className={`px-6 py-3 ${category.color} border-b`}>
              <h3 className="font-semibold">{category.label}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {categoryTypes.map(type => {
                const pref = getPreference(type.key);
                
                return (
                  <div key={type.key} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                          {type.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{type.label}</h4>
                          <p className="text-sm text-gray-500">{type.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Email Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref?.email_enabled ?? true}
                            onChange={() => togglePreference(type.key, 'email')}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                          <Mail className={`w-4 h-4 ${pref?.email_enabled ? 'text-pink-500' : 'text-gray-400'}`} />
                        </label>

                        {/* SMS Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref?.sms_enabled ?? false}
                            onChange={() => togglePreference(type.key, 'sms')}
                            disabled={!phoneNumber}
                            className="sr-only peer"
                          />
                          <div className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 ${!phoneNumber ? 'opacity-50' : ''}`}></div>
                          <MessageSquare className={`w-4 h-4 ${pref?.sms_enabled && phoneNumber ? 'text-pink-500' : 'text-gray-400'}`} />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* SMS Info */}
      {!phoneNumber && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">SMS Notifications Disabled</h4>
            <p className="text-sm text-amber-700 mt-1">
              Add your phone number above to enable SMS notifications. SMS notifications are useful for urgent alerts like high-value orders or order issues.
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Email Notification</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>SMS Notification</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
            <span>Enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
            <span>Disabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
