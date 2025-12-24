/**
 * Pirate Ship API Integration
 * 
 * Pirate Ship offers the cheapest USPS and UPS rates with no markup.
 * API Documentation: https://api.pirateship.com/docs
 */

// Pirate Ship API configuration
const PIRATE_SHIP_API_KEY = process.env.PIRATE_SHIP_API_KEY || '';
const PIRATE_SHIP_API_URL = 'https://api.pirateship.com/v1';

// Check if Pirate Ship is configured
export function isPirateShipConfigured(): boolean {
  return !!PIRATE_SHIP_API_KEY && !PIRATE_SHIP_API_KEY.includes('placeholder');
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
  distanceUnit?: 'in' | 'cm';
}

// Shipping rate interface
export interface ShippingRate {
  id: string;
  carrier: string;
  serviceName: string;
  amount: string;
  currency: string;
  estimatedDays: number;
  provider: string;
}

// Shipping label interface
export interface ShippingLabel {
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  carrier: string;
  serviceName: string;
  rate: string;
  createdAt: string;
}

// Tracking info interface
export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: string;
  statusDetails: string;
  statusDate: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
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
}

// Default store address
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

// Carrier display names
export const CARRIER_INFO: Record<string, { name: string; logo: string }> = {
  usps: { name: 'USPS', logo: '/carriers/usps.png' },
  ups: { name: 'UPS', logo: '/carriers/ups.png' },
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

// Helper function to make API requests to Pirate Ship
async function pirateShipRequest(endpoint: string, method: string = 'GET', body?: any) {
  if (!isPirateShipConfigured()) {
    throw new Error('Pirate Ship API key not configured');
  }

  const url = `${PIRATE_SHIP_API_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PIRATE_SHIP_API_KEY}`,
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Pirate Ship API error: ${errorData.error || response.statusText}`);
  }

  return response.json();
}

// Get shipping rates from Pirate Ship
export async function getShippingRates(
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  parcel: ParcelDimensions
): Promise<ShippingRate[]> {
  try {
    const response = await pirateShipRequest('/rates', 'POST', {
      from_address: {
        name: fromAddress.name,
        company: fromAddress.company,
        street1: fromAddress.street1,
        street2: fromAddress.street2,
        city: fromAddress.city,
        state: fromAddress.state,
        zip: fromAddress.zip,
        country: fromAddress.country,
        phone: fromAddress.phone,
        email: fromAddress.email,
      },
      to_address: {
        name: toAddress.name,
        company: toAddress.company,
        street1: toAddress.street1,
        street2: toAddress.street2,
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country,
        phone: toAddress.phone,
        email: toAddress.email,
      },
      parcel: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight: parcel.weight,
        weight_unit: parcel.massUnit || 'lb',
        dimension_unit: parcel.distanceUnit || 'in',
      },
    });

    return response.rates.map((rate: any) => ({
      id: rate.id,
      carrier: rate.carrier,
      serviceName: rate.service_name,
      amount: rate.amount,
      currency: rate.currency || 'USD',
      estimatedDays: rate.estimated_days || 3,
      provider: 'pirateship',
    }));
  } catch (error) {
    console.error('Error getting Pirate Ship rates:', error);
    throw error;
  }
}

// Create shipping label with Pirate Ship
export async function createShippingLabel(
  fromAddress: ShippingAddress,
  toAddress: ShippingAddress,
  parcel: ParcelDimensions,
  rateId: string
): Promise<ShippingLabel> {
  try {
    const response = await pirateShipRequest('/labels', 'POST', {
      rate_id: rateId,
      from_address: {
        name: fromAddress.name,
        company: fromAddress.company,
        street1: fromAddress.street1,
        street2: fromAddress.street2,
        city: fromAddress.city,
        state: fromAddress.state,
        zip: fromAddress.zip,
        country: fromAddress.country,
        phone: fromAddress.phone,
        email: fromAddress.email,
      },
      to_address: {
        name: toAddress.name,
        company: toAddress.company,
        street1: toAddress.street1,
        street2: toAddress.street2,
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country,
        phone: toAddress.phone,
        email: toAddress.email,
      },
      parcel: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight: parcel.weight,
        weight_unit: parcel.massUnit || 'lb',
        dimension_unit: parcel.distanceUnit || 'in',
      },
    });

    return {
      trackingNumber: response.tracking_number,
      trackingUrl: response.tracking_url,
      labelUrl: response.label_url,
      carrier: response.carrier,
      serviceName: response.service_name,
      rate: response.rate,
      createdAt: response.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating Pirate Ship label:', error);
    throw error;
  }
}

// Get tracking information
export async function getTrackingInfo(carrier: string, trackingNumber: string): Promise<TrackingInfo> {
  try {
    const response = await pirateShipRequest(`/tracking/${carrier}/${trackingNumber}`);

    return {
      carrier: response.carrier,
      trackingNumber: response.tracking_number,
      status: response.status || 'UNKNOWN',
      statusDetails: response.status_details || '',
      statusDate: response.status_date || new Date().toISOString(),
      location: response.location ? {
        city: response.location.city,
        state: response.location.state,
        country: response.location.country,
      } : undefined,
      trackingHistory: (response.tracking_history || []).map((event: any) => ({
        status: event.status || 'UNKNOWN',
        statusDetails: event.status_details || '',
        statusDate: event.status_date || new Date().toISOString(),
        location: event.location ? {
          city: event.location.city,
          state: event.location.state,
          country: event.location.country,
        } : undefined,
      })),
      eta: response.eta || undefined,
    };
  } catch (error) {
    console.error('Error getting Pirate Ship tracking info:', error);
    throw error;
  }
}

// Map tracking status to order status
export function mapTrackingStatusToOrderStatus(trackingStatus: string): string {
  const statusMap: Record<string, string> = {
    'PRE_TRANSIT': 'processing',
    'TRANSIT': 'shipped',
    'OUT_FOR_DELIVERY': 'shipped',
    'DELIVERED': 'delivered',
    'RETURNED': 'returned',
    'FAILURE': 'failed',
    'UNKNOWN': 'processing',
  };

  return statusMap[trackingStatus.toUpperCase()] || 'processing';
}

// Verify webhook signature (Pirate Ship uses HMAC SHA256)
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature) {
    return false;
  }

  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

