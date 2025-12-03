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
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(numAmount);
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

