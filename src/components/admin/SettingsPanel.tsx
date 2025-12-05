'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  Truck, 
  Receipt, 
  Mail,
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  MapPin,
  Phone,
  Globe,
  DollarSign,
  Percent,
  AlertCircle
} from 'lucide-react';

interface StoreInfo {
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  logo_url: string;
  tagline: string;
}

interface TaxSettings {
  default_rate: number;
  tax_inclusive: boolean;
  tax_shipping: boolean;
}

interface EmailSettings {
  from_email: string;
  from_name: string;
  admin_email: string;
}

interface CheckoutSettings {
  free_shipping_threshold: number;
  allow_guest_checkout: boolean;
  require_phone: boolean;
}

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states: string[];
}

interface ShippingRate {
  id: string;
  zone_id: string;
  name: string;
  min_weight: number | null;
  max_weight: number | null;
  min_price: number | null;
  max_price: number | null;
  price: number;
}

type SettingsTab = 'store' | 'shipping' | 'taxes' | 'email';

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('store');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Settings state
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    name: '',
    email: '',
    phone: '',
    address: { line1: '', line2: '', city: '', state: '', postal_code: '', country: 'US' },
    logo_url: '',
    tagline: ''
  });
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    default_rate: 0.06,
    tax_inclusive: false,
    tax_shipping: false
  });
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    from_email: '',
    from_name: '',
    admin_email: ''
  });
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings>({
    free_shipping_threshold: 50,
    allow_guest_checkout: true,
    require_phone: false
  });
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [storeRes, taxRes, emailRes, checkoutRes, zonesRes, ratesRes] = await Promise.all([
        fetch('/api/settings/store_info', { headers: { 'Authorization': 'Bearer admin-token' } }),
        fetch('/api/settings/tax_settings', { headers: { 'Authorization': 'Bearer admin-token' } }),
        fetch('/api/settings/email_settings', { headers: { 'Authorization': 'Bearer admin-token' } }),
        fetch('/api/settings/checkout_settings', { headers: { 'Authorization': 'Bearer admin-token' } }),
        fetch('/api/shipping/zones', { headers: { 'Authorization': 'Bearer admin-token' } }),
        fetch('/api/shipping/rates', { headers: { 'Authorization': 'Bearer admin-token' } })
      ]);

      const [storeData, taxData, emailData, checkoutData, zonesData, ratesData] = await Promise.all([
        storeRes.json(),
        taxRes.json(),
        emailRes.json(),
        checkoutRes.json(),
        zonesRes.json(),
        ratesRes.json()
      ]);

      if (storeData.value) setStoreInfo(storeData.value);
      if (taxData.value) setTaxSettings(taxData.value);
      if (emailData.value) setEmailSettings(emailData.value);
      if (checkoutData.value) setCheckoutSettings(checkoutData.value);
      if (zonesData.zones) setShippingZones(zonesData.zones);
      if (ratesData.rates) setShippingRates(ratesData.rates);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (key: string, value: any) => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ value })
      });

      if (response.ok) {
        setSuccessMessage('Settings saved successfully!');
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

  const tabs = [
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'taxes', label: 'Taxes', icon: Receipt },
    { id: 'email', label: 'Email', icon: Mail }
  ];

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your store settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-pink-600 border-pink-600'
                : 'text-gray-600 border-transparent hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Store Info Tab */}
      {activeTab === 'store' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-pink-600" />
            Store Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Store Name</label>
              <input
                type="text"
                value={storeInfo.name}
                onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tagline</label>
              <input
                type="text"
                value={storeInfo.tagline}
                onChange={(e) => setStoreInfo({ ...storeInfo, tagline: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={storeInfo.email}
                  onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={storeInfo.phone}
                  onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Logo URL</label>
            <input
              type="url"
              value={storeInfo.logo_url}
              onChange={(e) => setStoreInfo({ ...storeInfo, logo_url: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://..."
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Business Address
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={storeInfo.address.line1}
                  onChange={(e) => setStoreInfo({ 
                    ...storeInfo, 
                    address: { ...storeInfo.address, line1: e.target.value } 
                  })}
                  placeholder="Address Line 1"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={storeInfo.address.line2}
                  onChange={(e) => setStoreInfo({ 
                    ...storeInfo, 
                    address: { ...storeInfo.address, line2: e.target.value } 
                  })}
                  placeholder="Address Line 2 (optional)"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={storeInfo.address.city}
                  onChange={(e) => setStoreInfo({ 
                    ...storeInfo, 
                    address: { ...storeInfo.address, city: e.target.value } 
                  })}
                  placeholder="City"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={storeInfo.address.state}
                  onChange={(e) => setStoreInfo({ 
                    ...storeInfo, 
                    address: { ...storeInfo.address, state: e.target.value } 
                  })}
                  placeholder="State"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={storeInfo.address.postal_code}
                  onChange={(e) => setStoreInfo({ 
                    ...storeInfo, 
                    address: { ...storeInfo.address, postal_code: e.target.value } 
                  })}
                  placeholder="ZIP Code"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t dark:border-gray-700">
            <button
              onClick={() => saveSettings('store_info', storeInfo)}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === 'shipping' && (
        <div className="space-y-6">
          {/* Checkout Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Truck className="h-5 w-5 text-blue-600" />
              Shipping Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Free Shipping Threshold</label>
                <div className="relative max-w-xs">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={checkoutSettings.free_shipping_threshold}
                    onChange={(e) => setCheckoutSettings({ 
                      ...checkoutSettings, 
                      free_shipping_threshold: parseFloat(e.target.value) || 0 
                    })}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Orders over this amount qualify for free shipping
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Allow Guest Checkout</p>
                  <p className="text-sm text-gray-500">Customers can checkout without creating an account</p>
                </div>
                <button
                  onClick={() => setCheckoutSettings({ 
                    ...checkoutSettings, 
                    allow_guest_checkout: !checkoutSettings.allow_guest_checkout 
                  })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    checkoutSettings.allow_guest_checkout ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    checkoutSettings.allow_guest_checkout ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">Require Phone Number</p>
                  <p className="text-sm text-gray-500">Phone number is required at checkout</p>
                </div>
                <button
                  onClick={() => setCheckoutSettings({ 
                    ...checkoutSettings, 
                    require_phone: !checkoutSettings.require_phone 
                  })}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    checkoutSettings.require_phone ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    checkoutSettings.require_phone ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
              <button
                onClick={() => saveSettings('checkout_settings', checkoutSettings)}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Shipping Zones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                Shipping Zones
              </h3>
            </div>

            <div className="space-y-4">
              {shippingZones.map((zone) => (
                <div key={zone.id} className="p-4 border dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{zone.name}</h4>
                  </div>
                  <p className="text-sm text-gray-500">
                    Countries: {zone.countries.join(', ')}
                  </p>
                  <div className="mt-3 space-y-2">
                    {shippingRates
                      .filter(rate => rate.zone_id === zone.id)
                      .map((rate) => (
                        <div key={rate.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span>{rate.name}</span>
                          <span className="font-semibold">
                            {rate.price === 0 ? 'FREE' : `$${rate.price.toFixed(2)}`}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
              {shippingZones.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No shipping zones configured. Run the database schema to add defaults.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Taxes Tab */}
      {activeTab === 'taxes' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-600" />
            Tax Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Tax Rate</label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={(taxSettings.default_rate * 100).toFixed(2)}
                  onChange={(e) => setTaxSettings({ 
                    ...taxSettings, 
                    default_rate: (parseFloat(e.target.value) || 0) / 100 
                  })}
                  className="w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Applied to all orders (Maryland default: 6%)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium">Tax Inclusive Pricing</p>
                <p className="text-sm text-gray-500">Product prices already include tax</p>
              </div>
              <button
                onClick={() => setTaxSettings({ 
                  ...taxSettings, 
                  tax_inclusive: !taxSettings.tax_inclusive 
                })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  taxSettings.tax_inclusive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  taxSettings.tax_inclusive ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium">Tax Shipping</p>
                <p className="text-sm text-gray-500">Apply tax to shipping costs</p>
              </div>
              <button
                onClick={() => setTaxSettings({ 
                  ...taxSettings, 
                  tax_shipping: !taxSettings.tax_shipping 
                })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  taxSettings.tax_shipping ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  taxSettings.tax_shipping ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t dark:border-gray-700">
            <button
              onClick={() => saveSettings('tax_settings', taxSettings)}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            Email Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">From Name</label>
              <input
                type="text"
                value={emailSettings.from_name}
                onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="My Kind Kandles"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">From Email</label>
              <input
                type="email"
                value={emailSettings.from_email}
                onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="orders@kindkandlesboutique.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                This email must be verified in your Resend account
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Admin Notification Email</label>
              <input
                type="email"
                value={emailSettings.admin_email}
                onChange={(e) => setEmailSettings({ ...emailSettings, admin_email: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="admin@kindkandlesboutique.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                Receives new order notifications and alerts
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Email Templates</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Email templates are currently configured in the codebase. Template editing UI coming soon.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t dark:border-gray-700">
            <button
              onClick={() => saveSettings('email_settings', emailSettings)}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

