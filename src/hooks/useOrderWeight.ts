'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface OrderItem {
  product_id?: string;
  variant_id?: string;
  quantity: number;
  title: string;
  weight?: number;
}

interface Order {
  id: string;
  items: OrderItem[] | string;
  weight_oz?: number;
  weight_lb?: number;
}

interface ProductWeight {
  id: string;
  weight: number | null;
}

interface VariantWeight {
  id: string;
  product_id: string;
  weight: number | null;
}

interface WeightResult {
  weightOz: number;
  weightLb: number;
  source: 'product' | 'variant' | 'order' | 'estimated' | 'mixed';
  hasUnknownWeights: boolean;
  itemCount: number;
}

// Default weight per item in ounces (for candles without weight data)
const DEFAULT_ITEM_WEIGHT_OZ = 12;
// Packaging weight in ounces (box, padding, etc.)
const PACKAGING_WEIGHT_OZ = 4;

// Parse order items from various formats
function parseOrderItems(items: OrderItem[] | string | null | undefined): OrderItem[] {
  if (!items) return [];
  
  if (typeof items === 'string') {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  
  if (Array.isArray(items)) {
    return items;
  }
  
  return [];
}

// Calculate weight for a single order
export function calculateOrderWeight(
  order: Order,
  productWeights: Map<string, number>,
  variantWeights: Map<string, { weight: number; product_id: string }>
): WeightResult {
  // Check if order already has weight data
  if (order.weight_oz) {
    return {
      weightOz: order.weight_oz,
      weightLb: order.weight_oz / 16,
      source: 'order',
      hasUnknownWeights: false,
      itemCount: parseOrderItems(order.items).reduce((sum, i) => sum + i.quantity, 0),
    };
  }
  
  if (order.weight_lb) {
    return {
      weightOz: order.weight_lb * 16,
      weightLb: order.weight_lb,
      source: 'order',
      hasUnknownWeights: false,
      itemCount: parseOrderItems(order.items).reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  const items = parseOrderItems(order.items);
  let totalWeight = PACKAGING_WEIGHT_OZ;
  let hasProductData = false;
  let hasEstimated = false;
  let itemCount = 0;

  for (const item of items) {
    let itemWeight = DEFAULT_ITEM_WEIGHT_OZ;
    itemCount += item.quantity;

    // Try to get weight from variant first
    if (item.variant_id && variantWeights.has(item.variant_id)) {
      const variantData = variantWeights.get(item.variant_id)!;
      // Weight is stored in pounds, convert to ounces
      itemWeight = variantData.weight * 16;
      hasProductData = true;
    } else if (item.product_id && productWeights.has(item.product_id)) {
      // Fall back to product weight
      // Weight is stored in pounds, convert to ounces
      itemWeight = productWeights.get(item.product_id)! * 16;
      hasProductData = true;
    } else if (item.weight) {
      // Use weight from order item if available
      itemWeight = item.weight;
      hasProductData = true;
    } else {
      hasEstimated = true;
    }

    totalWeight += itemWeight * item.quantity;
  }

  let source: WeightResult['source'];
  if (hasProductData && hasEstimated) {
    source = 'mixed';
  } else if (hasEstimated) {
    source = 'estimated';
  } else if (variantWeights.size > 0) {
    source = 'variant';
  } else {
    source = 'product';
  }

  return {
    weightOz: totalWeight,
    weightLb: totalWeight / 16,
    source,
    hasUnknownWeights: hasEstimated,
    itemCount,
  };
}

// Hook to fetch and calculate weights for orders
export function useOrderWeights(orders: Order[]) {
  const [productWeights, setProductWeights] = useState<Map<string, number>>(new Map());
  const [variantWeights, setVariantWeights] = useState<Map<string, { weight: number; product_id: string }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract unique product and variant IDs
  const { productIds, variantIds } = useMemo(() => {
    const productIds = new Set<string>();
    const variantIds = new Set<string>();

    for (const order of orders) {
      const items = parseOrderItems(order.items);
      for (const item of items) {
        if (item.product_id) productIds.add(item.product_id);
        if (item.variant_id) variantIds.add(item.variant_id);
      }
    }

    return { 
      productIds: Array.from(productIds), 
      variantIds: Array.from(variantIds) 
    };
  }, [orders]);

  // Fetch weight data
  const fetchWeights = useCallback(async () => {
    if (productIds.length === 0 && variantIds.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch product weights
      if (productIds.length > 0) {
        const response = await fetch('/api/products?' + new URLSearchParams({
          ids: productIds.join(','),
          fields: 'id,weight',
        }));

        if (response.ok) {
          const data = await response.json();
          const products = data.products || data || [];
          const weights = new Map<string, number>();
          
          for (const p of products) {
            if (p.weight !== null && p.weight !== undefined) {
              weights.set(p.id, p.weight);
            }
          }
          
          setProductWeights(weights);
        }
      }

      // Fetch variant weights
      if (variantIds.length > 0) {
        const response = await fetch('/api/products/variants?' + new URLSearchParams({
          ids: variantIds.join(','),
          fields: 'id,product_id,weight',
        }));

        if (response.ok) {
          const data = await response.json();
          const variants = data.variants || data || [];
          const weights = new Map<string, { weight: number; product_id: string }>();
          
          for (const v of variants) {
            if (v.weight !== null && v.weight !== undefined) {
              weights.set(v.id, { weight: v.weight, product_id: v.product_id });
            }
          }
          
          setVariantWeights(weights);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weights');
    } finally {
      setLoading(false);
    }
  }, [productIds, variantIds]);

  useEffect(() => {
    fetchWeights();
  }, [fetchWeights]);

  // Calculate weights for all orders
  const orderWeights = useMemo(() => {
    const weights = new Map<string, WeightResult>();
    
    for (const order of orders) {
      weights.set(order.id, calculateOrderWeight(order, productWeights, variantWeights));
    }
    
    return weights;
  }, [orders, productWeights, variantWeights]);

  // Get weight for a specific order
  const getOrderWeight = useCallback((orderId: string): WeightResult | null => {
    return orderWeights.get(orderId) || null;
  }, [orderWeights]);

  return {
    orderWeights,
    getOrderWeight,
    loading,
    error,
    refetch: fetchWeights,
  };
}

// Format weight for display
export function formatWeight(weightOz: number, unit: 'oz' | 'lb' | 'auto' = 'auto'): string {
  if (unit === 'oz' || (unit === 'auto' && weightOz < 16)) {
    return `${weightOz.toFixed(1)} oz`;
  }
  const weightLb = weightOz / 16;
  return `${weightLb.toFixed(2)} lb`;
}

// Get weight source label
export function getWeightSourceLabel(source: WeightResult['source']): string {
  switch (source) {
    case 'product':
      return 'From product data';
    case 'variant':
      return 'From variant data';
    case 'order':
      return 'From order';
    case 'estimated':
      return 'Estimated';
    case 'mixed':
      return 'Partially estimated';
    default:
      return 'Unknown';
  }
}
