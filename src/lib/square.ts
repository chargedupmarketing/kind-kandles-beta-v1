import { SquareClient, SquareEnvironment } from 'square';

// Initialize Square client - only on server side
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

// Helper to check if Square is configured
export const isSquareConfigured = () => {
  return !!(
    process.env.SQUARE_ACCESS_TOKEN && 
    process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID &&
    process.env.SQUARE_LOCATION_ID
  );
};

// Get Square environment
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
