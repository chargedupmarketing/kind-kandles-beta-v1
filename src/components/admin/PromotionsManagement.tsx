'use client';

import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Percent,
  Gift,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  Type,
  Palette
} from 'lucide-react';

interface TopBarBanner {
  enabled: boolean;
  title: string;
  emoji_left: string;
  emoji_right: string;
  highlight_text: string;
  secondary_text: string;
  tertiary_text: string;
  background_gradient_from: string;
  background_gradient_via: string;
  background_gradient_to: string;
  text_color: string;
  dismissible: boolean;
  dismiss_duration_hours: number;
}

interface CountdownPromo {
  enabled: boolean;
  title: string;
  subtitle: string;
  end_date: string;
  end_time: string;
  background_style: 'pink-purple' | 'teal' | 'dark' | 'custom';
  custom_gradient_from?: string;
  custom_gradient_to?: string;
}

interface FlashSaleUrgency {
  enabled: boolean;
  text: string;
  show_icon: boolean;
}

interface PopupPromo {
  enabled: boolean;
  title: string;
  description: string;
  discount_percent: number;
  min_order_amount: number;
  end_date: string;
  end_time: string;
  trigger: 'immediate' | 'scroll' | 'exit_intent' | 'delay';
  trigger_delay_seconds: number;
  trigger_scroll_percent: number;
}

interface PromotionsSettings {
  top_bar_banner: TopBarBanner;
  countdown_promo: CountdownPromo;
  flash_sale_urgency: FlashSaleUrgency;
  popup_promo: PopupPromo;
}

const DEFAULT_SETTINGS: PromotionsSettings = {
  top_bar_banner: {
    enabled: true,
    title: 'PRE-BLACK FRIDAY SALE',
    emoji_left: '🔥',
    emoji_right: '🔥',
    highlight_text: 'Save 25% on everything',
    secondary_text: 'FREE shipping on orders $50+',
    tertiary_text: '',
    background_gradient_from: '#0d9488', // teal-600
    background_gradient_via: '#14b8a6', // teal-500
    background_gradient_to: '#2dd4bf', // teal-400
    text_color: '#ffffff',
    dismissible: true,
    dismiss_duration_hours: 24
  },
  countdown_promo: {
    enabled: true,
    title: '🔥 PRE-BLACK FRIDAY SALE ENDS SOON! 🔥',
    subtitle: 'Early Bird Special - Save 25% on everything + FREE shipping over $50!',
    end_date: '2025-11-27',
    end_time: '23:59',
    background_style: 'pink-purple'
  },
  flash_sale_urgency: {
    enabled: true,
    text: 'Flash sale ends in 24 hours - Don\'t miss out!',
    show_icon: true
  },
  popup_promo: {
    enabled: false,
    title: 'Special Offer!',
    description: 'Get an exclusive discount on your first order',
    discount_percent: 15,
    min_order_amount: 25,
    end_date: '2025-12-31',
    end_time: '23:59',
    trigger: 'delay',
    trigger_delay_seconds: 10,
    trigger_scroll_percent: 50
  }
};

type SectionKey = 'top_bar' | 'countdown' | 'urgency' | 'popup';

export default function PromotionsManagement() {
  const [settings, setSettings] = useState<PromotionsSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState<SectionKey[]>(['top_bar']);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/promotions', {
        headers: { 'Authorization': 'Bearer admin-token' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.value });
        }
      }
    } catch (error) {
      console.error('Error fetching promotions settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/settings/promotions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ value: settings })
      });

      if (response.ok) {
        setSuccessMessage('Promotions saved successfully!');
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

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateTopBar = (updates: Partial<TopBarBanner>) => {
    setSettings(prev => ({
      ...prev,
      top_bar_banner: { ...prev.top_bar_banner, ...updates }
    }));
  };

  const updateCountdown = (updates: Partial<CountdownPromo>) => {
    setSettings(prev => ({
      ...prev,
      countdown_promo: { ...prev.countdown_promo, ...updates }
    }));
  };

  const updateUrgency = (updates: Partial<FlashSaleUrgency>) => {
    setSettings(prev => ({
      ...prev,
      flash_sale_urgency: { ...prev.flash_sale_urgency, ...updates }
    }));
  };

  const updatePopup = (updates: Partial<PopupPromo>) => {
    setSettings(prev => ({
      ...prev,
      popup_promo: { ...prev.popup_promo, ...updates }
    }));
  };

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
            <Megaphone className="h-7 w-7 text-pink-600" />
            Promotions & Banners
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage promotional banners, countdown timers, and special offers displayed on your site
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Top Bar Banner Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('top_bar')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
              <Megaphone className="h-5 w-5 text-teal-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Bar Banner</h3>
              <p className="text-sm text-gray-500">The announcement bar above the header</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTopBar({ enabled: !settings.top_bar_banner.enabled });
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                settings.top_bar_banner.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {settings.top_bar_banner.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {settings.top_bar_banner.enabled ? 'Visible' : 'Hidden'}
            </button>
            {expandedSections.includes('top_bar') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.includes('top_bar') && (
          <div className="p-6 pt-0 space-y-6 border-t dark:border-gray-700">
            {/* Preview */}
            <div className="rounded-lg overflow-hidden">
              <div 
                className="py-2 px-4 text-center text-sm"
                style={{
                  background: `linear-gradient(to right, ${settings.top_bar_banner.background_gradient_from}, ${settings.top_bar_banner.background_gradient_via}, ${settings.top_bar_banner.background_gradient_to})`,
                  color: settings.top_bar_banner.text_color
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">{settings.top_bar_banner.emoji_left}</span>
                  <span className="font-bold">{settings.top_bar_banner.title}</span>
                  <span className="animate-pulse">{settings.top_bar_banner.emoji_right}</span>
                  <span>•</span>
                  <span>{settings.top_bar_banner.highlight_text}</span>
                  {settings.top_bar_banner.secondary_text && (
                    <>
                      <span>•</span>
                      <span>{settings.top_bar_banner.secondary_text}</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">Preview</p>
            </div>

            {/* Content Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Main Title</label>
                <input
                  type="text"
                  value={settings.top_bar_banner.title}
                  onChange={(e) => updateTopBar({ title: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="PRE-BLACK FRIDAY SALE"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Left Emoji</label>
                  <input
                    type="text"
                    value={settings.top_bar_banner.emoji_left}
                    onChange={(e) => updateTopBar({ emoji_left: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 text-center text-xl"
                    placeholder="🔥"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Right Emoji</label>
                  <input
                    type="text"
                    value={settings.top_bar_banner.emoji_right}
                    onChange={(e) => updateTopBar({ emoji_right: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 text-center text-xl"
                    placeholder="🔥"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Highlight Text</label>
                <input
                  type="text"
                  value={settings.top_bar_banner.highlight_text}
                  onChange={(e) => updateTopBar({ highlight_text: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Save 25% on everything"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Text</label>
                <input
                  type="text"
                  value={settings.top_bar_banner.secondary_text}
                  onChange={(e) => updateTopBar({ secondary_text: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="FREE shipping on orders $50+"
                />
              </div>
            </div>

            {/* Color Settings */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gradient Start</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.top_bar_banner.background_gradient_from}
                      onChange={(e) => updateTopBar({ background_gradient_from: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.top_bar_banner.background_gradient_from}
                      onChange={(e) => updateTopBar({ background_gradient_from: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gradient Middle</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.top_bar_banner.background_gradient_via}
                      onChange={(e) => updateTopBar({ background_gradient_via: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.top_bar_banner.background_gradient_via}
                      onChange={(e) => updateTopBar({ background_gradient_via: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Gradient End</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.top_bar_banner.background_gradient_to}
                      onChange={(e) => updateTopBar({ background_gradient_to: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.top_bar_banner.background_gradient_to}
                      onChange={(e) => updateTopBar({ background_gradient_to: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.top_bar_banner.text_color}
                      onChange={(e) => updateTopBar({ text_color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.top_bar_banner.text_color}
                      onChange={(e) => updateTopBar({ text_color: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Behavior Settings */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium">Allow Dismiss</p>
                <p className="text-sm text-gray-500">Users can close the banner with an X button</p>
              </div>
              <button
                onClick={() => updateTopBar({ dismissible: !settings.top_bar_banner.dismissible })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.top_bar_banner.dismissible ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  settings.top_bar_banner.dismissible ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            {settings.top_bar_banner.dismissible && (
              <div>
                <label className="block text-sm font-medium mb-2">Re-show After (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.top_bar_banner.dismiss_duration_hours}
                  onChange={(e) => updateTopBar({ dismiss_duration_hours: parseInt(e.target.value) || 24 })}
                  className="w-32 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Banner will reappear after this many hours
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Countdown Timer Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('countdown')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
              <Clock className="h-5 w-5 text-pink-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Countdown Timer</h3>
              <p className="text-sm text-gray-500">Sale countdown displayed below the hero section</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateCountdown({ enabled: !settings.countdown_promo.enabled });
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                settings.countdown_promo.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {settings.countdown_promo.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {settings.countdown_promo.enabled ? 'Visible' : 'Hidden'}
            </button>
            {expandedSections.includes('countdown') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.includes('countdown') && (
          <div className="p-6 pt-0 space-y-6 border-t dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={settings.countdown_promo.title}
                  onChange={(e) => updateCountdown({ title: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="🔥 PRE-BLACK FRIDAY SALE ENDS SOON! 🔥"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Subtitle</label>
                <input
                  type="text"
                  value={settings.countdown_promo.subtitle}
                  onChange={(e) => updateCountdown({ subtitle: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Early Bird Special - Save 25% on everything + FREE shipping over $50!"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date
                </label>
                <input
                  type="date"
                  value={settings.countdown_promo.end_date}
                  onChange={(e) => updateCountdown({ end_date: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={settings.countdown_promo.end_time}
                  onChange={(e) => updateCountdown({ end_time: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Background Style</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'pink-purple', label: 'Teal (Default)', preview: 'bg-gradient-to-r from-teal-100 to-cyan-100' },
                  { value: 'teal', label: 'Teal Alt', preview: 'bg-gradient-to-r from-teal-50 to-emerald-100' },
                  { value: 'dark', label: 'Dark', preview: 'bg-gradient-to-r from-gray-700 to-gray-800' },
                  { value: 'custom', label: 'Custom', preview: 'bg-gradient-to-r from-yellow-100 to-orange-100' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => updateCountdown({ background_style: style.value as any })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.countdown_promo.background_style === style.value
                        ? 'border-pink-500 ring-2 ring-pink-200'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-8 rounded ${style.preview} mb-2`} />
                    <p className="text-sm font-medium">{style.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Flash Sale Urgency Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('urgency')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Sparkles className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Flash Sale Urgency</h3>
              <p className="text-sm text-gray-500">Urgency message at the bottom of the homepage CTA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateUrgency({ enabled: !settings.flash_sale_urgency.enabled });
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                settings.flash_sale_urgency.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {settings.flash_sale_urgency.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {settings.flash_sale_urgency.enabled ? 'Visible' : 'Hidden'}
            </button>
            {expandedSections.includes('urgency') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.includes('urgency') && (
          <div className="p-6 pt-0 space-y-6 border-t dark:border-gray-700">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-6 py-3">
                {settings.flash_sale_urgency.show_icon && (
                  <Clock className="h-5 w-5 text-red-600 animate-pulse" />
                )}
                <span className="text-red-700 font-medium">{settings.flash_sale_urgency.text}</span>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500">Preview</p>

            <div>
              <label className="block text-sm font-medium mb-2">Urgency Text</label>
              <input
                type="text"
                value={settings.flash_sale_urgency.text}
                onChange={(e) => updateUrgency({ text: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Flash sale ends in 24 hours - Don't miss out!"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium">Show Clock Icon</p>
                <p className="text-sm text-gray-500">Display animated clock icon</p>
              </div>
              <button
                onClick={() => updateUrgency({ show_icon: !settings.flash_sale_urgency.show_icon })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.flash_sale_urgency.show_icon ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  settings.flash_sale_urgency.show_icon ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popup Promo Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => toggleSection('popup')}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Gift className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Popup Promotion</h3>
              <p className="text-sm text-gray-500">Special offer popup with countdown</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updatePopup({ enabled: !settings.popup_promo.enabled });
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                settings.popup_promo.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {settings.popup_promo.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {settings.popup_promo.enabled ? 'Active' : 'Disabled'}
            </button>
            {expandedSections.includes('popup') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {expandedSections.includes('popup') && (
          <div className="p-6 pt-0 space-y-6 border-t dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={settings.popup_promo.title}
                  onChange={(e) => updatePopup({ title: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Special Offer!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Discount %</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.popup_promo.discount_percent}
                    onChange={(e) => updatePopup({ discount_percent: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={settings.popup_promo.description}
                onChange={(e) => updatePopup({ description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Get an exclusive discount on your first order"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Min Order Amount</label>
                <input
                  type="number"
                  min="0"
                  value={settings.popup_promo.min_order_amount}
                  onChange={(e) => updatePopup({ min_order_amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={settings.popup_promo.end_date}
                  onChange={(e) => updatePopup({ end_date: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={settings.popup_promo.end_time}
                  onChange={(e) => updatePopup({ end_time: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trigger</label>
              <select
                value={settings.popup_promo.trigger}
                onChange={(e) => updatePopup({ trigger: e.target.value as any })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="immediate">Show Immediately</option>
                <option value="delay">After Delay</option>
                <option value="scroll">On Scroll</option>
                <option value="exit_intent">Exit Intent</option>
              </select>
            </div>

            {settings.popup_promo.trigger === 'delay' && (
              <div>
                <label className="block text-sm font-medium mb-2">Delay (seconds)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.popup_promo.trigger_delay_seconds}
                  onChange={(e) => updatePopup({ trigger_delay_seconds: parseInt(e.target.value) || 10 })}
                  className="w-32 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            )}

            {settings.popup_promo.trigger === 'scroll' && (
              <div>
                <label className="block text-sm font-medium mb-2">Scroll Percentage</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={settings.popup_promo.trigger_scroll_percent}
                  onChange={(e) => updatePopup({ trigger_scroll_percent: parseInt(e.target.value) || 50 })}
                  className="w-32 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Show popup when user scrolls past this % of the page
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-3">💡 Quick Tips</h3>
        <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
          <li>• <strong>Top Bar Banner:</strong> Best for site-wide announcements like sales or free shipping thresholds</li>
          <li>• <strong>Countdown Timer:</strong> Creates urgency for limited-time offers - set end dates wisely!</li>
          <li>• <strong>Flash Sale Urgency:</strong> Reinforces scarcity at the point of decision</li>
          <li>• <strong>Popup Promotion:</strong> Use sparingly to avoid annoying visitors - exit intent works best</li>
          <li>• Changes will apply immediately after saving</li>
        </ul>
      </div>
    </div>
  );
}

