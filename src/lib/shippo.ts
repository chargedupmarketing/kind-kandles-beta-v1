import Shippo from 'shippo';

// Initialize Shippo client
const shippoApiKey = process.env.SHIPPO_API_KEY || '';

let shippoClient: Shippo | null = null;

export function getShippoClient(): Shippo | null {
  if (!shippoApiKey) {
    console.warn('Shippo API key not configured');
    return null;
  }
  
  if (!shippoClient) {
    shippoClient = new Shippo({ apiKeyHeader: shippoApiKey });
  }
  
  return shippoClient;
}

// Check if Shippo is configured
export function isShippoConfigured(): boolean {
  return !!shippoApiKey;
}

// Address interface
export interface ShippingAddress {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

// Parcel dimensions interface
export interface ParcelDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
  massUnit?: 'lb' | 'oz' | 'kg' | 'g';
  distanceUnit?: 'in' | 'cm' | 'ft' | 'm';
}

// Shipping rate interface
export interface ShippingRate {
  id: string;
  carrier: string;
  carrierAccount: string;
  serviceName: string;
  serviceToken: string;
  amount: string;
  currency: string;
  estimatedDays: number;
  durationTerms?: string;
  provider: string;
  providerImage75?: string;
  providerImage200?: string;
}

// Shipping label interface
export interface ShippingLabel {
  objectId: string;
  trackingNumber: string;
  trackingUrlProvider: string;
  labelUrl: string;
  commercialInvoiceUrl?: string;
  carrier: string;
  serviceName: string;
  rate: string;
  createdAt: string;
}

// Tracking info interface
export interface TrackingInfo {
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
  trackingHistory: Array<{
    status: string;
    statusDetails: string;
    statusDate: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  }>;
  eta?: string;
  originalEta?: string;
}

// Default store address (from settings or env)
export function getStoreAddress(): ShippingAddress {
  return {
    name: process.env.STORE_NAME || 'Kind Kandles',
    company: 'My Kind Kandles & Boutique',
    street1: process.env.STORE_ADDRESS_STREET || '42 2nd Ave',
    street2: process.env.STORE_ADDRESS_STREET2 || 'Unit 29',
    city: process.env.STORE_ADDRESS_CITY || 'North Attleboro',
    state: process.env.STORE_ADDRESS_STATE || 'MA',
    zip: process.env.STORE_ADDRESS_ZIP || '02760',
    country: process.env.STORE_ADDRESS_COUNTRY || 'US',
    phone: process.env.STORE_PHONE || '',
    email: process.env.STORE_EMAIL || 'orders@kindkandlesboutique.com',
  };
}

// Default parcel sizes for candles
export const DEFAULT_PARCEL_SIZES = {
  small: {
    name: 'Small (1-2 candles)',
    length: 6,
    width: 6,
    height: 4,
    weight: 1,
    massUnit: 'lb' as const,
    distanceUnit: 'in' as const,
  },
  medium: {
    name: 'Medium (3-4 candles)',
    length: 10,
    width: 8,
    height: 6,
    weight: 3,
    massUnit: 'lb' as const,
    distanceUnit: 'in' as const,
  },
  large: {
    name: 'Large (5+ candles)',
    length: 14,
    width: 10,
    height: 8,
    weight: 6,
    massUnit: 'lb' as const,
    distanceUnit: 'in' as const,
  },
};

// Carrier display names and logos
export const CARRIER_INFO: Record<string, { name: string; logo: string }> = {
  usps: { name: 'USPS', logo: '/carriers/usps.png' },
  ups: { name: 'UPS', logo: '/carriers/ups.png' },
  fedex: { name: 'FedEx', logo: '/carriers/fedex.png' },
  dhl_express: { name: 'DHL Express', logo: '/carriers/dhl.png' },
  dhl_ecommerce: { name: 'DHL eCommerce', logo: '/carriers/dhl.png' },
};

// Format carrier name for display
export function formatCarrierName(carrier: string): string {
  return CARRIER_INFO[carrier.toLowerCase()]?.name || carrier.toUpperCase();
}

// Calculate estimated parcel size based on items
export function estimateParcelSize(itemCount: number, totalWeight?: number): ParcelDimensions {
  if (itemCount <= 2) {
    return { ...DEFAULT_PARCEL_SIZES.small, weight: totalWeight || DEFAULT_PARCEL_SIZES.small.weight };
  } else if (itemCount <= 4) {
    return { ...DEFAULT_PARCEL_SIZES.medium, weight: totalWeight || DEFAULT_PARCEL_SIZES.medium.weight };
  } else {
    return { ...DEFAULT_PARCEL_SIZES.large, weight: totalWeight || DEFAULT_PARCEL_SIZES.large.weight };
  }
}

// Format shipping rate for display
export function formatShippingRate(rate: ShippingRate): {
  id: string;
  carrier: string;
  carrierLogo?: string;
  service: string;
  price: number;
  estimatedDays: number;
  estimatedDelivery: string;
} {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + rate.estimatedDays);
  
  return {
    id: rate.id,
    carrier: formatCarrierName(rate.carrier),
    carrierLogo: CARRIER_INFO[rate.carrier.toLowerCase()]?.logo,
    service: rate.serviceName,
    price: parseFloat(rate.amount),
    estimatedDays: rate.estimatedDays,
    estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
  };
}

// Validate address format
export function validateAddress(address: ShippingAddress): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!address.name || address.name.length < 2) {
    errors.push('Name is required');
  }
  if (!address.street1 || address.street1.length < 3) {
    errors.push('Street address is required');
  }
  if (!address.city || address.city.length < 2) {
    errors.push('City is required');
  }
  if (!address.state || address.state.length < 2) {
    errors.push('State is required');
  }
  if (!address.zip || !/^\d{5}(-\d{4})?$/.test(address.zip)) {
    errors.push('Valid ZIP code is required');
  }
  if (!address.country || address.country.length !== 2) {
    errors.push('Country code is required (2 letters)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
