import { SquareClient, SquareEnvironment } from 'square';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

// Cache for database settings (refreshed every 60 seconds)
let cachedDbSettings: {
  application_id: string;
  access_token: string;
  location_id: string;
  webhook_signature_key: string;
  mode: 'sandbox' | 'production';
} | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 60 seconds

// Fetch Square settings from database
async function fetchDbSettings() {
  const now = Date.now();
  if (cachedDbSettings && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedDbSettings;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'square_settings')
      .single();

    if (error || !data?.value) {
      return null;
    }

    cachedDbSettings = data.value;
    cacheTimestamp = now;
    return cachedDbSettings;
  } catch (error) {
    console.error('Error fetching Square settings from DB:', error);
    return null;
  }
}

// Get effective Square configuration (DB settings take priority over env vars)
export async function getSquareConfig() {
  const dbSettings = await fetchDbSettings();
  
  // Database settings take priority if they have values
  const applicationId = dbSettings?.application_id || process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '';
  const accessToken = dbSettings?.access_token || process.env.SQUARE_ACCESS_TOKEN || '';
  const locationId = dbSettings?.location_id || process.env.SQUARE_LOCATION_ID || '';
  const webhookSignatureKey = dbSettings?.webhook_signature_key || process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';
  
  // For mode: DB setting takes priority, then env var, default to sandbox
  let mode: 'sandbox' | 'production' = 'sandbox';
  if (dbSettings?.mode) {
    mode = dbSettings.mode;
  } else if (process.env.SQUARE_ENVIRONMENT === 'production') {
    mode = 'production';
  }

  return {
    applicationId,
    accessToken,
    locationId,
    webhookSignatureKey,
    mode,
    environment: mode === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  };
}

// Create Square client dynamically with current settings
export async function createSquareClient() {
  const config = await getSquareConfig();
  
  if (!config.accessToken) {
    return null;
  }

  return new SquareClient({
    token: config.accessToken,
    environment: config.environment,
  });
}

// Legacy sync functions for backward compatibility (use env vars only)
const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareEnvironment = process.env.SQUARE_ENVIRONMENT === 'production' 
  ? SquareEnvironment.Production 
  : SquareEnvironment.Sandbox;

export const squareClient = squareAccessToken 
  ? new SquareClient({
      token: squareAccessToken,
      environment: squareEnvironment,
    })
  : null;

// Get the Square application ID for client-side use
export const getSquareApplicationId = () => {
  return process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '';
};

// Get the Square location ID
export const getSquareLocationId = () => {
  return process.env.SQUARE_LOCATION_ID || '';
};

// Helper to check if Square is configured (sync version - env vars only)
export const isSquareConfigured = () => {
  return !!(
    process.env.SQUARE_ACCESS_TOKEN && 
    process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID &&
    process.env.SQUARE_LOCATION_ID
  );
};

// Async version that checks both DB and env vars
export async function isSquareConfiguredAsync() {
  const config = await getSquareConfig();
  return !!(config.accessToken && config.applicationId && config.locationId);
}

// Get Square environment (sync - env vars only)
export const getSquareEnvironment = () => {
  return process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
};

// Convert amount to Square's smallest currency unit (cents)
export const toSquareAmount = (amount: number): bigint => {
  return BigInt(Math.round(amount * 100));
};

// Convert from Square's smallest currency unit back to dollars
export const fromSquareAmount = (amount: bigint | number): number => {
  return Number(amount) / 100;
};

// Generate idempotency key for Square API calls
export const generateIdempotencyKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Type for Square payment result
export interface SquarePaymentResult {
  success: boolean;
  paymentId?: string;
  receiptUrl?: string;
  error?: string;
}

// Type for Square order
export interface SquareOrderItem {
  name: string;
  quantity: number;
  basePriceMoney: {
    amount: bigint;
    currency: string;
  };
  variationName?: string;
}
