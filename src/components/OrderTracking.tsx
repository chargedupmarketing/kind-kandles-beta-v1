'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Box,
  Home,
} from 'lucide-react';

interface TrackingEvent {
  status: string;
  statusDetails: string;
  statusDate: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingStatus: {
    status: string;
    statusDetails: string;
    statusDate: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  trackingHistory: TrackingEvent[];
  eta?: string;
  originalEta?: string;
}

interface OrderTrackingProps {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}

const STATUS_STEPS = [
  { key: 'PRE_TRANSIT', label: 'Label Created', icon: Box },
  { key: 'TRANSIT', label: 'In Transit', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: MapPin },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
];

const STATUS_COLORS: Record<string, string> = {
  PRE_TRANSIT: 'text-blue-600 bg-blue-100',
  TRANSIT: 'text-purple-600 bg-purple-100',
  OUT_FOR_DELIVERY: 'text-orange-600 bg-orange-100',
  DELIVERED: 'text-green-600 bg-green-100',
  RETURNED: 'text-red-600 bg-red-100',
  FAILURE: 'text-red-600 bg-red-100',
  UNKNOWN: 'text-slate-600 bg-slate-100',
};

export default function OrderTracking({ carrier, trackingNumber, trackingUrl }: OrderTrackingProps) {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTracking();
  }, [carrier, trackingNumber]);

  const fetchTracking = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/shipping/tracking?carrier=${encodeURIComponent(carrier)}&trackingNumber=${encodeURIComponent(trackingNumber)}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get tracking info');
      }

      setTracking(data.tracking);
    } catch (err: any) {
      console.error('Error fetching tracking:', err);
      setError(err.message || 'Unable to get tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = (): number => {
    if (!tracking) return 0;
    const status = tracking.trackingStatus.status.toUpperCase();
    
    if (status === 'DELIVERED') return 3;
    if (status === 'OUT_FOR_DELIVERY') return 2;
    if (status === 'TRANSIT' || status === 'IN_TRANSIT') return 1;
    return 0;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatLocation = (location?: { city?: string; state?: string; country?: string }): string => {
    if (!location) return '';
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 text-teal-600 animate-spin" />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Loading tracking info...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchTracking}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const currentStep = getCurrentStep();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {tracking?.carrier || carrier} Tracking
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {trackingNumber}
            </span>
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-700"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        <button
          onClick={fetchTracking}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Current Status */}
      {tracking && (
        <div className={`p-4 rounded-lg ${STATUS_COLORS[tracking.trackingStatus.status.toUpperCase()] || STATUS_COLORS.UNKNOWN}`}>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6" />
            <div>
              <div className="font-semibold">{tracking.trackingStatus.statusDetails || tracking.trackingStatus.status}</div>
              {tracking.trackingStatus.location && (
                <div className="text-sm opacity-80">
                  {formatLocation(tracking.trackingStatus.location)}
                </div>
              )}
              <div className="text-sm opacity-80">
                {formatDate(tracking.trackingStatus.statusDate)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-teal-200 dark:ring-teal-800' : ''}`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  isCompleted ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Progress Line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0">
          <div
            className="h-full bg-teal-600 transition-all duration-500"
            style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* ETA */}
      {tracking?.eta && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-teal-600" />
            <span className="font-medium text-slate-900 dark:text-white">
              Estimated Delivery: {formatDate(tracking.eta)}
            </span>
          </div>
        </div>
      )}

      {/* Tracking History */}
      {tracking?.trackingHistory && tracking.trackingHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-white">Tracking History</h4>
          <div className="space-y-4">
            {tracking.trackingHistory.map((event, index) => (
              <div key={index} className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`} />
                  {index < tracking.trackingHistory.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {event.statusDetails || event.status}
                  </div>
                  {event.location && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {formatLocation(event.location)}
                    </div>
                  )}
                  <div className="text-sm text-slate-400">
                    {formatDate(event.statusDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

