// Local store utilities for product data
// This file provides helper functions for working with product data

import type { DisplayProduct } from './types';

export interface LocalProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images?: string[];
  variants?: LocalProductVariant[];
  tags?: string[];
  availableForSale: boolean;
  inventory?: number;
  category?: string;
  badge?: string;
  inventoryQuantity?: number;
  isCandle?: boolean;
  burnTime?: string;
}

export interface LocalProductVariant {
  id: string;
  title: string;
  price: number;
  availableForSale: boolean;
  quantityAvailable?: number;
}

// Format price helper
export function formatPrice(amount: number | string, currencyCode: string = 'USD'): string {
  // Handle already formatted price strings (e.g., "$17.00")
  if (typeof amount === 'string') {
    // Remove currency symbol and any non-numeric characters except decimal point
    const cleanedAmount = amount.replace(/[^0-9.-]/g, '');
    const numAmount = parseFloat(cleanedAmount);
    if (isNaN(numAmount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(numAmount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

// Get products by collection (returns empty array - products come from database)
export function getProductsByCollection(collection: string): LocalProduct[] {
  // Products are now fetched from the database
  // This function returns empty array as a fallback
  return [];
}

// Calculate discount percentage
export function calculateDiscount(price: number, compareAtPrice: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

// Check if product is on sale
export function isOnSale(price: number, compareAtPrice?: number): boolean {
  return !!compareAtPrice && compareAtPrice > price;
}

// Strip HTML tags from string (for excerpts/previews)
export function stripHtml(html: string): string {
  if (!html) return '';
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Truncate text to a specific length
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Get clean excerpt from HTML description
export function getExcerpt(html: string, maxLength: number = 150): string {
  return truncateText(stripHtml(html), maxLength);
}

