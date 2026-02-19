import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface OrderItem {
  product_id?: string;
  variant_id?: string;
  quantity: number;
  title: string;
  weight?: number;
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

// Default weight per item in ounces (for candles without weight data)
const DEFAULT_ITEM_WEIGHT_OZ = 12;
// Packaging weight in ounces (box, padding, etc.)
const PACKAGING_WEIGHT_OZ = 4;

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderIds, format = 'pirateship', includeInventory = false } = body;

    const supabase = createServerClient();

    // Fetch orders
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // If specific order IDs provided, filter by them
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      query = query.in('id', orderIds);
    } else {
      // Otherwise, export only pending/processing/paid orders
      query = query.in('status', ['pending', 'processing', 'paid']);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch orders from database',
        details: error.message 
      }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ 
        error: 'No orders found to export. Make sure you have orders with status: pending, processing, or paid.',
        orderCount: 0
      }, { status: 400 });
    }

    console.log(`Exporting ${orders.length} orders to CSV (format: ${format})`);

    // Collect all product and variant IDs for weight lookup
    const productIds = new Set<string>();
    const variantIds = new Set<string>();

    for (const order of orders) {
      const items = parseOrderItems(order.items);
      for (const item of items) {
        if (item.product_id) productIds.add(item.product_id);
        if (item.variant_id) variantIds.add(item.variant_id);
      }
    }

    // Fetch product weights
    let productWeights = new Map<string, number>();
    if (productIds.size > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, weight')
        .in('id', Array.from(productIds));
      
      if (products) {
        for (const p of products as ProductWeight[]) {
          if (p.weight !== null) {
            productWeights.set(p.id, p.weight);
          }
        }
      }
    }

    // Fetch variant weights
    let variantWeights = new Map<string, { weight: number; product_id: string }>();
    if (variantIds.size > 0) {
      const { data: variants } = await supabase
        .from('product_variants')
        .select('id, product_id, weight')
        .in('id', Array.from(variantIds));
      
      if (variants) {
        for (const v of variants as VariantWeight[]) {
          if (v.weight !== null) {
            variantWeights.set(v.id, { weight: v.weight, product_id: v.product_id });
          }
        }
      }
    }

    // Optionally fetch inventory data
    let inventoryData = new Map<string, number>();
    if (includeInventory) {
      if (productIds.size > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, inventory_quantity')
          .in('id', Array.from(productIds));
        
        if (products) {
          for (const p of products) {
            inventoryData.set(p.id, p.inventory_quantity || 0);
          }
        }
      }

      if (variantIds.size > 0) {
        const { data: variants } = await supabase
          .from('product_variants')
          .select('id, inventory_quantity')
          .in('id', Array.from(variantIds));
        
        if (variants) {
          for (const v of variants) {
            inventoryData.set(v.id, v.inventory_quantity || 0);
          }
        }
      }
    }

    // Generate CSV based on format
    let csvContent: string;
    let filename: string;

    if (format === 'pirateship') {
      csvContent = generatePirateShipCSV(orders, productWeights, variantWeights);
      filename = `pirateship-orders-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (format === 'detailed') {
      csvContent = generateDetailedCSV(orders, productWeights, variantWeights, inventoryData);
      filename = `orders-detailed-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      csvContent = generatePirateShipCSV(orders, productWeights, variantWeights);
      filename = `pirateship-orders-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate Pirate Ship compatible CSV
function generatePirateShipCSV(
  orders: any[],
  productWeights: Map<string, number>,
  variantWeights: Map<string, { weight: number; product_id: string }>
): string {
  // Pirate Ship CSV format
  // Required columns: Name, Address 1, Address 2, City, State, Zip, Country, Email, Phone, Order Number, Weight (oz)
  const csvRows = [
    // Header row
    [
      'Name',
      'Company',
      'Address 1',
      'Address 2',
      'City',
      'State',
      'Zip',
      'Country',
      'Email',
      'Phone',
      'Order Number',
      'Weight (oz)',
      'Value',
      'Contents',
      'Notes'
    ].join(',')
  ];

  // Data rows
  for (const order of orders) {
    const items = parseOrderItems(order.items);
    const weightOz = calculateOrderWeightOz(items, productWeights, variantWeights);
    const contents = items.map(i => `${i.quantity}x ${i.title}`).join('; ');

    const row = [
      escapeCSV(order.customer_name || order.shipping_name || ''),
      escapeCSV(''), // Company
      escapeCSV(order.shipping_address_line1 || order.shipping_line1 || ''),
      escapeCSV(order.shipping_address_line2 || order.shipping_line2 || ''),
      escapeCSV(order.shipping_city || ''),
      escapeCSV(order.shipping_state || ''),
      escapeCSV(order.shipping_postal_code || ''),
      escapeCSV(order.shipping_country || 'US'),
      escapeCSV(order.customer_email || ''),
      escapeCSV(order.customer_phone || ''),
      escapeCSV(order.order_number || order.id),
      escapeCSV(weightOz.toFixed(1)),
      escapeCSV((order.total || 0).toFixed(2)),
      escapeCSV(contents),
      escapeCSV(order.notes || '')
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

// Generate detailed CSV with more information
function generateDetailedCSV(
  orders: any[],
  productWeights: Map<string, number>,
  variantWeights: Map<string, { weight: number; product_id: string }>,
  inventoryData: Map<string, number>
): string {
  const csvRows = [
    // Header row
    [
      'Order Number',
      'Order Date',
      'Status',
      'Customer Name',
      'Email',
      'Phone',
      'Address 1',
      'Address 2',
      'City',
      'State',
      'Zip',
      'Country',
      'Items',
      'Item Count',
      'Weight (oz)',
      'Weight Source',
      'Subtotal',
      'Tax',
      'Shipping',
      'Total',
      'Payment Status',
      'Inventory Alerts',
      'Notes'
    ].join(',')
  ];

  for (const order of orders) {
    const items = parseOrderItems(order.items);
    const { weight: weightOz, source: weightSource } = calculateOrderWeightWithSource(items, productWeights, variantWeights);
    const contents = items.map(i => `${i.quantity}x ${i.title}`).join('; ');
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    // Check inventory alerts
    const inventoryAlerts: string[] = [];
    for (const item of items) {
      const stockKey = item.variant_id || item.product_id;
      if (stockKey && inventoryData.has(stockKey)) {
        const stock = inventoryData.get(stockKey)!;
        if (stock < item.quantity) {
          inventoryAlerts.push(`${item.title}: need ${item.quantity}, have ${stock}`);
        } else if (stock <= 5) {
          inventoryAlerts.push(`${item.title}: low stock (${stock})`);
        }
      }
    }

    const row = [
      escapeCSV(order.order_number || order.id),
      escapeCSV(order.created_at ? new Date(order.created_at).toLocaleDateString() : ''),
      escapeCSV(order.status || ''),
      escapeCSV(order.customer_name || order.shipping_name || ''),
      escapeCSV(order.customer_email || ''),
      escapeCSV(order.customer_phone || ''),
      escapeCSV(order.shipping_address_line1 || order.shipping_line1 || ''),
      escapeCSV(order.shipping_address_line2 || order.shipping_line2 || ''),
      escapeCSV(order.shipping_city || ''),
      escapeCSV(order.shipping_state || ''),
      escapeCSV(order.shipping_postal_code || ''),
      escapeCSV(order.shipping_country || 'US'),
      escapeCSV(contents),
      escapeCSV(itemCount.toString()),
      escapeCSV(weightOz.toFixed(1)),
      escapeCSV(weightSource),
      escapeCSV((order.subtotal || 0).toFixed(2)),
      escapeCSV((order.tax || 0).toFixed(2)),
      escapeCSV((order.shipping_cost || 0).toFixed(2)),
      escapeCSV((order.total || 0).toFixed(2)),
      escapeCSV(order.payment_status || ''),
      escapeCSV(inventoryAlerts.join('; ')),
      escapeCSV(order.notes || '')
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

// Parse order items from various formats
function parseOrderItems(items: any): OrderItem[] {
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

// Calculate order weight in ounces from product data
function calculateOrderWeightOz(
  items: OrderItem[],
  productWeights: Map<string, number>,
  variantWeights: Map<string, { weight: number; product_id: string }>
): number {
  let totalWeight = PACKAGING_WEIGHT_OZ;

  for (const item of items) {
    let itemWeight = DEFAULT_ITEM_WEIGHT_OZ;

    // Try to get weight from variant first
    if (item.variant_id && variantWeights.has(item.variant_id)) {
      const variantData = variantWeights.get(item.variant_id)!;
      // Weight is stored in pounds, convert to ounces
      itemWeight = variantData.weight * 16;
    } else if (item.product_id && productWeights.has(item.product_id)) {
      // Fall back to product weight
      // Weight is stored in pounds, convert to ounces
      itemWeight = productWeights.get(item.product_id)! * 16;
    } else if (item.weight) {
      // Use weight from order item if available
      itemWeight = item.weight;
    }

    totalWeight += itemWeight * item.quantity;
  }

  return totalWeight;
}

// Calculate order weight with source information
function calculateOrderWeightWithSource(
  items: OrderItem[],
  productWeights: Map<string, number>,
  variantWeights: Map<string, { weight: number; product_id: string }>
): { weight: number; source: string } {
  let totalWeight = PACKAGING_WEIGHT_OZ;
  let sources: string[] = [];
  let hasProductData = false;
  let hasDefault = false;

  for (const item of items) {
    let itemWeight = DEFAULT_ITEM_WEIGHT_OZ;
    let source = 'default';

    if (item.variant_id && variantWeights.has(item.variant_id)) {
      const variantData = variantWeights.get(item.variant_id)!;
      itemWeight = variantData.weight * 16;
      source = 'variant';
      hasProductData = true;
    } else if (item.product_id && productWeights.has(item.product_id)) {
      itemWeight = productWeights.get(item.product_id)! * 16;
      source = 'product';
      hasProductData = true;
    } else if (item.weight) {
      itemWeight = item.weight;
      source = 'order';
      hasProductData = true;
    } else {
      hasDefault = true;
    }

    if (!sources.includes(source)) {
      sources.push(source);
    }

    totalWeight += itemWeight * item.quantity;
  }

  let sourceDescription: string;
  if (hasProductData && hasDefault) {
    sourceDescription = 'mixed (some estimated)';
  } else if (hasDefault) {
    sourceDescription = 'estimated';
  } else {
    sourceDescription = 'from product data';
  }

  return { weight: totalWeight, source: sourceDescription };
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // Convert to string if not already
  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

