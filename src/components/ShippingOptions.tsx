'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Clock, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface ShippingRate {
  id: string;
  carrier: string;
  carrierLogo?: string;
  service: string;
  price: number;
  estimatedDays: number;
  estimatedDelivery: string;
}

interface ShippingOptionsProps {
  address: ShippingAddress;
  itemCount: number;
  subtotal: number;
  freeShippingThreshold?: number;
  onSelectRate: (rate: ShippingRate | null) => void;
  selectedRateId?: string;
}

export default function ShippingOptions({
  address,
  itemCount,
  subtotal,
  freeShippingThreshold = 50,
  onSelectRate,
  selectedRateId,
}: ShippingOptionsProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shipmentId, setShipmentId] = useState<string | null>(null);

  // Check if eligible for free shipping
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold;
  const amountToFreeShipping = freeShippingThreshold - subtotal;

  useEffect(() => {
    if (address.street1 && address.city && address.state && address.zip) {
      fetchRates();
    }
  }, [address.street1, address.city, address.state, address.zip, address.country]);

  const fetchRates = async () => {
    setLoading(true);
    setError('');
    setRates([]);
    
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationAddress: address,
          itemCount,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get shipping rates');
      }

      setShipmentId(data.shipmentId);
      
      // Set rates directly without free shipping logic
      const allRates = data.rates || [];
      setRates(allRates);
      
      // Auto-select first rate if none selected
      if (allRates.length > 0 && !selectedRateId) {
        onSelectRate(allRates[0]);
      }
    } catch (err: any) {
      console.error('Error fetching rates:', err);
      setError(err.message || 'Unable to calculate shipping rates');
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryDate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSelectRate = (rate: ShippingRate) => {
    onSelectRate(rate);
  };

  if (!address.street1 || !address.city || !address.state || !address.zip) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
          <Truck className="h-5 w-5" />
          <span>Enter your shipping address to see delivery options</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Free Shipping Progress */}
      {!qualifiesForFreeShipping && freeShippingThreshold > 0 && (
        <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-800">
          <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
            <Package className="h-5 w-5" />
            <span className="font-medium">
              Add ${amountToFreeShipping.toFixed(2)} more for FREE shipping!
            </span>
          </div>
          <div className="mt-2 h-2 bg-teal-200 dark:bg-teal-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${(subtotal / freeShippingThreshold) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Shipping Options Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Shipping Method</span>
        </h3>
        {!loading && rates.length > 0 && (
          <button
            onClick={fetchRates}
            className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 text-teal-600 animate-spin" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">Calculating shipping rates...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRates}
            className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Shipping Rates */}
      {!loading && !error && rates.length > 0 && (
        <div className="space-y-3">
          {rates.map((rate) => (
            <button
              key={rate.id}
              onClick={() => handleSelectRate(rate)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                selectedRateId === rate.id
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedRateId === rate.id ? (
                    <CheckCircle className="h-5 w-5 text-teal-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                  )}
                  <div className="text-left">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {rate.carrier} - {rate.service}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Est. delivery: {rate.estimatedDelivery}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {rate.price === 0 ? (
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                  ) : (
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      ${rate.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Rates Available */}
      {!loading && !error && rates.length === 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <AlertCircle className="h-5 w-5" />
            <span>No shipping options available for this address</span>
          </div>
        </div>
      )}
    </div>
  );
}

