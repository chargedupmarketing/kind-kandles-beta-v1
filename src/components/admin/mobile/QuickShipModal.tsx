'use client';

import { useState } from 'react';
import { X, Truck, Package, CheckCircle, Loader2 } from 'lucide-react';
import { hapticSuccess, hapticError } from '@/lib/haptics';

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
  const [error, setError] = useState('');

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

      // Update order status
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'shipped',
          tracking_number: labelData.tracking_number,
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div 
        className="bg-slate-800 w-full max-h-[85vh] rounded-t-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Quick Ship</h2>
            <p className="text-sm text-slate-400">Order #{order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[60vh]">
          {step === 'rates' && (
            <div className="space-y-4">
              {/* Shipping To */}
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Shipping to</p>
                <p className="text-sm text-white font-medium">{order.customer_name}</p>
                {order.shipping_address && (
                  <p className="text-sm text-slate-300">
                    {[
                      order.shipping_address.line1,
                      order.shipping_address.city,
                      order.shipping_address.state,
                      order.shipping_address.postal_code
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {/* Rate Selection */}
              <div>
                <p className="text-sm font-medium text-white mb-3">Select shipping method</p>
                <div className="space-y-2">
                  {rates.map((rate) => (
                    <button
                      key={rate.id}
                      onClick={() => handleSelectRate(rate)}
                      className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-600 rounded-lg">
                          <Truck className="h-5 w-5 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{rate.carrier}</p>
                          <p className="text-xs text-slate-400">{rate.service}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{formatCurrency(rate.price)}</p>
                        <p className="text-xs text-slate-400">{rate.estimated_days} days</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedRate && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Carrier</span>
                  <span className="text-sm text-white font-medium">{selectedRate.carrier}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Service</span>
                  <span className="text-sm text-white font-medium">{selectedRate.service}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Delivery</span>
                  <span className="text-sm text-white font-medium">{selectedRate.estimated_days} business days</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                  <span className="text-sm font-medium text-white">Shipping Cost</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(selectedRate.price)}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('rates')}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmShip}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4" />
                      <span>Create Label</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Label Created!</h3>
              <p className="text-sm text-slate-400 mb-4">
                Tracking: {trackingNumber}
              </p>
              <p className="text-sm text-slate-400 mb-6">
                The customer will receive a shipping notification email.
              </p>
              <button
                onClick={onSuccess}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

