// Shopify client - currently disabled as we're using Supabase
// This file is kept for backwards compatibility with existing pages

// Mock client that returns null - pages should use Supabase instead
const client = null;

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

