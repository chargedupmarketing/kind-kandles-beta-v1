'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Package,
  Truck,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Scale,
  Ruler,
} from 'lucide-react';

interface ShippingRate {
  id: string;
  carrier: string;
  carrier_image: string;
  service: string;
  service_token: string;
  price: number;
  currency: string;
  estimated_days: number;
  delivery_estimate: string;
  attributes: string[];
}

interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface PackageDimensions {
  weight: number;
  length: number;
  width: number;
  height: number;
}

interface ShippingRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRate: (rate: ShippingRate, shipmentId: string) => void;
  toAddress: ShippingAddress;
  orderNumber?: string;
}

const DEFAULT_PACKAGE: PackageDimensions = {
  weight: 16, // oz
  length: 8,
  width: 6,
  height: 4,
};

const CARRIER_COLORS: Record<string, string> = {
  usps: 'bg-blue-100 text-blue-800 border-blue-200',
  ups: 'bg-amber-100 text-amber-800 border-amber-200',
  fedex: 'bg-purple-100 text-purple-800 border-purple-200',
  dhl_express: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export default function ShippingRateModal({
  isOpen,
  onClose,
  onSelectRate,
  toAddress,
  orderNumber,
}: ShippingRateModalProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [shipmentId, setShipmentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'speed'>('price');
  const [packageDims, setPackageDims] = useState<PackageDimensions>(DEFAULT_PACKAGE);
  const [showPackageEditor, setShowPackageEditor] = useState(false);

  useEffect(() => {
    if (isOpen && toAddress) {
      fetchRates();
    }
  }, [isOpen, toAddress, packageDims]);

  const fetchRates = async () => {
    setIsLoading(true);
    setError(null);
    setRates([]);

    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_address: toAddress,
          parcel: {
            weight: packageDims.weight,
            length: packageDims.length,
            width: packageDims.width,
            height: packageDims.height,
            mass_unit: 'oz',
            distance_unit: 'in',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get shipping rates');
      }

      setRates(data.rates || []);
      setShipmentId(data.shipment_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get shipping rates');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedRates = [...rates].sort((a, b) => {
    if (sortBy === 'price') {
      return a.price - b.price;
    }
    return a.estimated_days - b.estimated_days;
  });

  const handleSelectRate = (rate: ShippingRate) => {
    setSelectedRateId(rate.id);
    onSelectRate(rate, shipmentId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Truck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Shipping Rate
              </h2>
              {orderNumber && (
                <p className="text-sm text-gray-500">Order {orderNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Destination Address */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ship to: {toAddress.name}
              </p>
              <p className="text-sm text-gray-500">
                {toAddress.street1}
                {toAddress.street2 && `, ${toAddress.street2}`}, {toAddress.city},{' '}
                {toAddress.state} {toAddress.zip}
              </p>
            </div>
            <button
              onClick={() => setShowPackageEditor(!showPackageEditor)}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <Package className="h-4 w-4" />
              Edit Package
            </button>
          </div>

          {/* Package Editor */}
          {showPackageEditor && (
            <div className="mt-3 pt-3 border-t dark:border-slate-700">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Scale className="h-3 w-3 inline mr-1" />
                    Weight (oz)
                  </label>
                  <input
                    type="number"
                    value={packageDims.weight}
                    onChange={(e) =>
                      setPackageDims({ ...packageDims, weight: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded dark:bg-slate-800 dark:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Ruler className="h-3 w-3 inline mr-1" />
                    Length (in)
                  </label>
                  <input
                    type="number"
                    value={packageDims.length}
                    onChange={(e) =>
                      setPackageDims({ ...packageDims, length: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded dark:bg-slate-800 dark:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width (in)</label>
                  <input
                    type="number"
                    value={packageDims.width}
                    onChange={(e) =>
                      setPackageDims({ ...packageDims, width: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded dark:bg-slate-800 dark:border-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height (in)</label>
                  <input
                    type="number"
                    value={packageDims.height}
                    onChange={(e) =>
                      setPackageDims({ ...packageDims, height: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded dark:bg-slate-800 dark:border-slate-600"
                  />
                </div>
              </div>
              <button
                onClick={fetchRates}
                className="mt-2 text-sm text-teal-600 hover:text-teal-700"
              >
                Refresh Rates
              </button>
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div className="px-4 py-2 flex items-center gap-4 border-b dark:border-slate-700">
          <span className="text-sm text-gray-500">Sort by:</span>
          <button
            onClick={() => setSortBy('price')}
            className={`text-sm px-3 py-1 rounded-full ${
              sortBy === 'price'
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <DollarSign className="h-3 w-3 inline mr-1" />
            Price
          </button>
          <button
            onClick={() => setSortBy('speed')}
            className={`text-sm px-3 py-1 rounded-full ${
              sortBy === 'speed'
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="h-3 w-3 inline mr-1" />
            Speed
          </button>
        </div>

        {/* Rates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-teal-600 mb-3" />
              <p className="text-gray-500">Getting shipping rates...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
              <p className="text-red-600 text-center">{error}</p>
              <button
                onClick={fetchRates}
                className="mt-4 text-teal-600 hover:text-teal-700"
              >
                Try Again
              </button>
            </div>
          ) : sortedRates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-8 w-8 text-gray-400 mb-3" />
              <p className="text-gray-500">No shipping rates available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRates.map((rate) => (
                <button
                  key={rate.id}
                  onClick={() => handleSelectRate(rate)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedRateId === rate.id
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {rate.carrier_image ? (
                        <img
                          src={rate.carrier_image}
                          alt={rate.carrier}
                          className="h-8 w-auto"
                        />
                      ) : (
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            CARRIER_COLORS[rate.carrier.toLowerCase()] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rate.carrier.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {rate.service}
                        </p>
                        <p className="text-sm text-gray-500">{rate.delivery_estimate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${rate.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {rate.estimated_days} day{rate.estimated_days !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {rate.attributes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rate.attributes.map((attr) => (
                        <span
                          key={attr}
                          className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded"
                        >
                          {attr.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedRateId === rate.id && (
                    <div className="mt-2 flex items-center gap-1 text-teal-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

