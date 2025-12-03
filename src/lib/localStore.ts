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

// Get products by collection (returns mock data for now)
export function getProductsByCollection(collection: string): LocalProduct[] {
  // Mock data for featured products
  const mockProducts: LocalProduct[] = [
    {
      id: '1',
      title: 'Calm Down Girl Candle',
      handle: 'calm-down-girl-candle',
      description: 'A soothing blend of lavender and vanilla to help you unwind.',
      price: 24.99,
      compareAtPrice: 29.99,
      image: '/api/placeholder/300/300',
      images: ['/api/placeholder/300/300'],
      availableForSale: true,
      inventory: 15,
      category: 'Candles',
      badge: 'Sale',
      inventoryQuantity: 15,
      isCandle: true,
      burnTime: '45 hours',
    },
    {
      id: '2',
      title: 'Whipped Body Butter',
      handle: 'whipped-body-butter',
      description: 'Luxuriously rich and creamy body butter for silky smooth skin.',
      price: 18.99,
      image: '/api/placeholder/300/300',
      images: ['/api/placeholder/300/300'],
      availableForSale: true,
      inventory: 20,
      category: 'Skincare',
      inventoryQuantity: 20,
      isCandle: false,
    },
    {
      id: '3',
      title: 'Rosemary Body Oil',
      handle: 'rosemary-body-oil',
      description: 'Invigorating rosemary and peppermint body oil.',
      price: 19.99,
      image: '/api/placeholder/300/300',
      images: ['/api/placeholder/300/300'],
      availableForSale: true,
      inventory: 12,
      category: 'Body Oils',
      inventoryQuantity: 12,
      isCandle: false,
    },
  ];

  // Filter by collection if needed
  if (collection === 'candles') {
    return mockProducts.filter(p => p.isCandle);
  } else if (collection === 'skincare') {
    return mockProducts.filter(p => p.category === 'Skincare');
  } else if (collection === 'body-oils') {
    return mockProducts.filter(p => p.category === 'Body Oils');
  }
  
  return mockProducts;
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

