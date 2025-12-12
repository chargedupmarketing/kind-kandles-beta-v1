/**
 * Shippo Shipping Integration
 * 
 * Multi-carrier shipping with USPS, UPS, FedEx, and DHL
 * Features: Rate shopping, label generation, tracking
 */

const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || '';
const SHIPPO_API_URL = 'https://api.goshippo.com';

// Types
export interface ShippoAddress {
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
  is_residential?: boolean;
}

export interface ShippoParcel {
  length: number;
  width: number;
  height: number;
  distance_unit: 'in' | 'cm';
  weight: number;
  mass_unit: 'lb' | 'oz' | 'kg' | 'g';
}

export interface ShippoRate {
  object_id: string;
  provider: string;
  provider_image_75: string;
  provider_image_200: string;
  servicelevel: {
    name: string;
    token: string;
    terms: string;
  };
  amount: string;
  currency: string;
  estimated_days: number;
  duration_terms: string;
  attributes: string[];
}

export interface ShippoShipment {
  object_id: string;
  object_created: string;
  status: string;
  address_from: ShippoAddress;
  address_to: ShippoAddress;
  parcels: ShippoParcel[];
  rates: ShippoRate[];
}

export interface ShippoTransaction {
  object_id: string;
  object_state: string;
  status: string;
  tracking_number: string;
  tracking_url_provider: string;
  label_url: string;
  commercial_invoice_url?: string;
  rate: string;
  messages: Array<{ source: string; code: string; text: string }>;
}

export interface ShippoTrackingStatus {
  object_id: string;
  status: string;
  status_details: string;
  status_date: string;
  substatus?: {
    code: string;
    text: string;
  };
  location?: {
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  tracking_history: Array<{
    object_id: string;
    status: string;
    status_details: string;
    status_date: string;
    location?: {
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  }>;
  tracking_number: string;
  carrier: string;
  eta?: string;
  original_eta?: string;
  servicelevel?: {
    name: string;
    token: string;
  };
  address_from?: ShippoAddress;
  address_to?: ShippoAddress;
}

// Helper to make API requests
async function shippoRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  if (!SHIPPO_API_KEY) {
    throw new Error('Shippo API key not configured. Add SHIPPO_API_KEY to environment variables.');
  }

  const response = await fetch(`${SHIPPO_API_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Shippo API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Validate an address with Shippo
 */
export async function validateAddress(address: ShippoAddress): Promise<{
  is_valid: boolean;
  validation_results: {
    is_valid: boolean;
    messages: Array<{ source: string; code: string; text: string }>;
  };
  object_id: string;
}> {
  const result = await shippoRequest<{
    object_id: string;
    is_complete: boolean;
    validation_results: {
      is_valid: boolean;
      messages: Array<{ source: string; code: string; text: string }>;
    };
  }>('/addresses', 'POST', {
    ...address,
    validate: true,
  });

  return {
    is_valid: result.validation_results?.is_valid ?? result.is_complete,
    validation_results: result.validation_results || { is_valid: result.is_complete, messages: [] },
    object_id: result.object_id,
  };
}

/**
 * Get shipping rates for a shipment
 */
export async function getShippingRates(
  fromAddress: ShippoAddress,
  toAddress: ShippoAddress,
  parcel: ShippoParcel
): Promise<{ shipment_id: string; rates: ShippoRate[] }> {
  const shipment = await shippoRequest<ShippoShipment>('/shipments', 'POST', {
    address_from: fromAddress,
    address_to: toAddress,
    parcels: [parcel],
    async: false,
  });

  // Sort rates by price
  const sortedRates = shipment.rates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

  return {
    shipment_id: shipment.object_id,
    rates: sortedRates,
  };
}

/**
 * Purchase a shipping label
 */
export async function purchaseLabel(
  rateId: string,
  labelFormat: 'PDF' | 'PNG' | 'PDF_4x6' | 'ZPLII' = 'PDF_4x6'
): Promise<ShippoTransaction> {
  const transaction = await shippoRequest<ShippoTransaction>('/transactions', 'POST', {
    rate: rateId,
    label_file_type: labelFormat,
    async: false,
  });

  if (transaction.status !== 'SUCCESS') {
    const errorMessages = transaction.messages.map(m => m.text).join(', ');
    throw new Error(`Label purchase failed: ${errorMessages || 'Unknown error'}`);
  }

  return transaction;
}

/**
 * Get tracking information for a shipment
 */
export async function getTrackingInfo(
  carrier: string,
  trackingNumber: string
): Promise<ShippoTrackingStatus> {
  const tracking = await shippoRequest<ShippoTrackingStatus>(
    `/tracks/${carrier}/${trackingNumber}`
  );
  return tracking;
}

/**
 * Register a tracking webhook for a shipment
 */
export async function registerTrackingWebhook(
  carrier: string,
  trackingNumber: string,
  metadata?: string
): Promise<{ carrier: string; tracking_number: string }> {
  const result = await shippoRequest<{ carrier: string; tracking_number: string }>(
    '/tracks',
    'POST',
    {
      carrier,
      tracking_number: trackingNumber,
      metadata,
    }
  );
  return result;
}

/**
 * Get default store address (from address for all shipments)
 */
export function getStoreAddress(): ShippoAddress {
  return {
    name: process.env.STORE_NAME || 'My Kind Kandles & Boutique',
    company: 'My Kind Kandles & Boutique',
    street1: process.env.STORE_ADDRESS_LINE1 || '',
    street2: process.env.STORE_ADDRESS_LINE2 || '',
    city: process.env.STORE_CITY || '',
    state: process.env.STORE_STATE || 'MD',
    zip: process.env.STORE_ZIP || '',
    country: process.env.STORE_COUNTRY || 'US',
    phone: process.env.STORE_PHONE || '',
    email: process.env.STORE_EMAIL || 'info@kindkandlesboutique.com',
    is_residential: false,
  };
}

/**
 * Create a parcel from product dimensions
 */
export function createParcel(
  weight: number,
  length: number = 8,
  width: number = 6,
  height: number = 4
): ShippoParcel {
  return {
    length,
    width,
    height,
    distance_unit: 'in',
    weight,
    mass_unit: 'oz',
  };
}

/**
 * Map carrier codes to display names
 */
export const CARRIER_NAMES: Record<string, string> = {
  usps: 'USPS',
  ups: 'UPS',
  fedex: 'FedEx',
  dhl_express: 'DHL Express',
  dhl_ecommerce: 'DHL eCommerce',
};

/**
 * Map tracking status to order status
 */
export function mapTrackingStatusToOrderStatus(trackingStatus: string): string {
  const statusMap: Record<string, string> = {
    PRE_TRANSIT: 'processing',
    TRANSIT: 'shipped',
    DELIVERED: 'delivered',
    RETURNED: 'returned',
    FAILURE: 'delivery_failed',
    UNKNOWN: 'shipped',
  };
  return statusMap[trackingStatus] || 'shipped';
}

/**
 * Check if Shippo is configured
 */
export function isShippoConfigured(): boolean {
  return !!SHIPPO_API_KEY && SHIPPO_API_KEY.length > 0;
}

/**
 * Verify Shippo webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Shippo uses HMAC-SHA256 for webhook signatures
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

