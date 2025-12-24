'use client';

import { useState, useEffect } from 'react';
import { X, Truck, Package, CheckCircle, Loader2, MapPin, Mail, Phone } from 'lucide-react';
import { hapticSuccess, hapticError, hapticLight } from '@/lib/haptics';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address?: {
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  total: number;
}

interface QuickShipModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  price: number;
  estimated_days: number;
}

export default function QuickShipModal({ order, onClose, onSuccess }: QuickShipModalProps) {
  const [step, setStep] = useState<'rates' | 'confirm' | 'success'>('rates');
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [error, setError] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Mock rates for demo - in production, fetch from /api/shipping/rates
  useState(() => {
    setRates([
      { id: '1', carrier: 'USPS', service: 'Priority Mail', price: 8.95, estimated_days: 2 },
      { id: '2', carrier: 'USPS', service: 'First Class', price: 4.50, estimated_days: 5 },
      { id: '3', carrier: 'UPS', service: 'Ground', price: 12.99, estimated_days: 3 },
      { id: '4', carrier: 'FedEx', service: 'Home Delivery', price: 14.50, estimated_days: 2 },
    ]);
  });

  const handleSelectRate = (rate: ShippingRate) => {
    setSelectedRate(rate);
    setStep('confirm');
  };

  const handleConfirmShip = async () => {
    if (!selectedRate) return;
    
    setLoading(true);
    setError('');

    try {
      // Create shipping label
      const labelResponse = await fetch('/api/shipping/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          rate_id: selectedRate.id,
          carrier: selectedRate.carrier,
          service: selectedRate.service,
        }),
      });

      if (!labelResponse.ok) {
        throw new Error('Failed to create shipping label');
      }

      const labelData = await labelResponse.json();
      setTrackingNumber(labelData.tracking_number || 'TRACK123456');
      setTrackingUrl(labelData.tracking_url || '');

      // Update order status
      await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          status: 'shipped',
          tracking_number: labelData.tracking_number,
          tracking_url: labelData.tracking_url,
        }),
      });

      hapticSuccess();
      setStep('success');
    } catch (err) {
      console.error('Shipping error:', err);
      setError('Failed to create shipping label. Please try again.');
      hapticError();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => {
              hapticLight();
              onClose();
            }}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          {step === 'confirm' && (
            <button
              onClick={() => {
                hapticLight();
                setStep('rates');
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Ship</h2>
          <p className="text-xs text-gray-500">Order #{order.order_number}</p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto p-5 pb-12 space-y-8"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          minHeight: 0
        }}
      >
          {step === 'rates' && (
            <>
              {/* Customer & Address Info */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Shipping To</h3>
                <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-900 font-medium">{order.customer_name}</span>
                  </div>
                  {order.customer_email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a 
                        href={`mailto:${order.customer_email}`}
                        className="text-sm text-teal-600 hover:text-teal-700"
                      >
                        {order.customer_email}
                      </a>
                    </div>
                  )}
                  {order.shipping_address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-900 space-y-0.5">
                        {order.shipping_address.line1 && <div>{order.shipping_address.line1}</div>}
                        <div>
                          {[
                            order.shipping_address.city,
                            order.shipping_address.state,
                            order.shipping_address.postal_code
                          ].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rate Selection */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Select Shipping Method</h3>
                <div className="space-y-3">
                  {rates.map((rate) => (
                    <button
                      key={rate.id}
                      onClick={() => {
                        hapticLight();
                        handleSelectRate(rate);
                      }}
                      className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                          <Truck className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900">{rate.carrier}</p>
                          <p className="text-sm text-gray-500">{rate.service}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-gray-900">{formatCurrency(rate.price)}</p>
                        <p className="text-sm text-gray-500">{rate.estimated_days} days</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 'confirm' && selectedRate && (
            <>
              {/* Shipping Summary */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Shipping Summary</h3>
                <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Carrier</span>
                    <span className="text-base text-gray-900 font-medium">{selectedRate.carrier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Service</span>
                    <span className="text-base text-gray-900 font-medium">{selectedRate.service}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Estimated Delivery</span>
                    <span className="text-base text-gray-900 font-medium">{selectedRate.estimated_days} business days</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-base font-medium text-gray-900">Shipping Cost</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(selectedRate.price)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Create Label Button */}
              <button
                onClick={handleConfirmShip}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-base font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Label...</span>
                  </>
                ) : (
                  <>
                    <Package className="h-5 w-5" />
                    <span>Create Shipping Label</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Label Created!</h3>
              <div className="bg-gray-50 rounded-lg p-5 mb-6 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                  <p className="text-base font-mono text-gray-900 font-medium">{trackingNumber}</p>
                </div>
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-teal-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    Track Package
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-8">
                The customer will receive a shipping notification email with tracking information.
              </p>
              <button
                onClick={() => {
                  hapticSuccess();
                  onSuccess();
                }}
                className="w-full py-4 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-base font-medium"
              >
                Done
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
