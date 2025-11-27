import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Check if environment variables are available
const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

// Development-only logging
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    console.log('Shopify Config:', {
      storeDomain: storeDomain ? 'Set' : 'Missing',
      accessToken: accessToken ? 'Set' : 'Missing',
    });
  }
}

// Create client only if environment variables are available
const client = storeDomain && accessToken ? createStorefrontApiClient({
  storeDomain,
  apiVersion: 'unstable', // Use unstable to ensure API is available
  publicAccessToken: accessToken,
}) : null;

export default client;

// Helper function to format Shopify money
export function formatPrice(amount: string, currencyCode: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

// Helper function to get Shopify image URL with transformations
export function getShopifyImageUrl(url: string, width?: number, height?: number): string {
  if (!url) return '';
  
  const imageUrl = new URL(url);
  
  if (width) {
    imageUrl.searchParams.set('width', width.toString());
  }
  
  if (height) {
    imageUrl.searchParams.set('height', height.toString());
  }
  
  return imageUrl.toString();
}
