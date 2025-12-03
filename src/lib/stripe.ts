import Stripe from 'stripe';
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Server-side Stripe instance - only initialize if key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    })
  : null as unknown as Stripe;

// Client-side Stripe promise
let stripePromise: Promise<StripeClient | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey) {
      stripePromise = loadStripe(publishableKey);
    } else {
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
};

// Helper to check if Stripe is configured
export const isStripeConfigured = () => {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};

