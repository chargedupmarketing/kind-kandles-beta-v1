import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface OrderItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  title: string;
}

interface InventoryAlert {
  product_id: string;
  variant_id?: string;
  product_title: string;
  variant_title?: string;
  current_stock: number;
  ordered_quantity: number;
  status: 'critical' | 'low' | 'ok';
}

interface InventoryCheckRequest {
  order_id?: string;
  items?: OrderItem[];
}

// Thresholds for inventory status
const LOW_STOCK_THRESHOLD = 5;
const CRITICAL_STOCK_THRESHOLD = 0;

// POST - Check inventory for order items
export async function POST(request: NextRequest) {
  try {
    const body: InventoryCheckRequest = await request.json();
    const { order_id, items } = body;

    const supabase = createServerClient();
    let orderItems: OrderItem[] = [];

    // If order_id is provided, fetch items from the order
    if (order_id) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('items')
        .eq('id', order_id)
        .single();

      if (orderError) {
        console.error('Error fetching order:', orderError);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Parse order items - they may be stored as JSON
      if (order?.items) {
        if (typeof order.items === 'string') {
          try {
            orderItems = JSON.parse(order.items);
          } catch {
            orderItems = [];
          }
        } else if (Array.isArray(order.items)) {
          orderItems = order.items;
        }
      }
    } else if (items && Array.isArray(items)) {
      // Use provided items directly
      orderItems = items;
    } else {
      return NextResponse.json({ 
        error: 'Either order_id or items array is required' 
      }, { status: 400 });
    }

    if (orderItems.length === 0) {
      return NextResponse.json({ alerts: [], summary: { total: 0, critical: 0, low: 0, ok: 0 } });
    }

    // Extract unique product IDs and variant IDs
    const productIds = [...new Set(orderItems.map(item => item.product_id).filter(Boolean))];
    const variantIds = [...new Set(orderItems.map(item => item.variant_id).filter(Boolean))];

    // Fetch product inventory data
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, inventory_quantity')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch product inventory' }, { status: 500 });
    }

    // Fetch variant inventory data if there are variants
    let variants: any[] = [];
    if (variantIds.length > 0) {
      const { data: variantData, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, product_id, title, inventory_quantity, option1_value, option2_value')
        .in('id', variantIds);

      if (!variantsError && variantData) {
        variants = variantData;
      }
    }

    // Build inventory map for quick lookup
    const productInventory = new Map(
      (products || []).map(p => [p.id, { title: p.title, stock: p.inventory_quantity || 0 }])
    );

    const variantInventory = new Map(
      variants.map(v => [v.id, { 
        title: v.title || `${v.option1_value || ''}${v.option2_value ? ' / ' + v.option2_value : ''}`,
        stock: v.inventory_quantity || 0,
        product_id: v.product_id
      }])
    );

    // Check inventory for each order item
    const alerts: InventoryAlert[] = [];

    for (const item of orderItems) {
      let currentStock = 0;
      let productTitle = item.title || 'Unknown Product';
      let variantTitle: string | undefined;

      if (item.variant_id && variantInventory.has(item.variant_id)) {
        // Check variant inventory
        const variant = variantInventory.get(item.variant_id)!;
        currentStock = variant.stock;
        variantTitle = variant.title;
        
        // Get product title if available
        if (productInventory.has(item.product_id)) {
          productTitle = productInventory.get(item.product_id)!.title;
        }
      } else if (item.product_id && productInventory.has(item.product_id)) {
        // Check product inventory
        const product = productInventory.get(item.product_id)!;
        currentStock = product.stock;
        productTitle = product.title;
      }

      // Determine status based on stock vs ordered quantity
      let status: 'critical' | 'low' | 'ok';
      const remainingStock = currentStock - item.quantity;

      if (currentStock <= CRITICAL_STOCK_THRESHOLD || remainingStock < 0) {
        status = 'critical';
      } else if (currentStock <= LOW_STOCK_THRESHOLD || remainingStock <= LOW_STOCK_THRESHOLD) {
        status = 'low';
      } else {
        status = 'ok';
      }

      alerts.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_title: productTitle,
        variant_title: variantTitle,
        current_stock: currentStock,
        ordered_quantity: item.quantity,
        status,
      });
    }

    // Calculate summary
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.status === 'critical').length,
      low: alerts.filter(a => a.status === 'low').length,
      ok: alerts.filter(a => a.status === 'ok').length,
    };

    return NextResponse.json({ 
      alerts,
      summary,
      thresholds: {
        low: LOW_STOCK_THRESHOLD,
        critical: CRITICAL_STOCK_THRESHOLD,
      }
    });
  } catch (error) {
    console.error('Error in POST /api/admin/orders/inventory-check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check inventory for multiple orders (batch check)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderIds = searchParams.get('order_ids')?.split(',').filter(Boolean) || [];

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'order_ids parameter is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, items')
      .in('id', orderIds);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Collect all unique product and variant IDs
    const allProductIds = new Set<string>();
    const allVariantIds = new Set<string>();

    for (const order of orders || []) {
      let items: OrderItem[] = [];
      if (order.items) {
        if (typeof order.items === 'string') {
          try {
            items = JSON.parse(order.items);
          } catch {
            items = [];
          }
        } else if (Array.isArray(order.items)) {
          items = order.items;
        }
      }

      for (const item of items) {
        if (item.product_id) allProductIds.add(item.product_id);
        if (item.variant_id) allVariantIds.add(item.variant_id);
      }
    }

    // Fetch all product inventory
    const { data: products } = await supabase
      .from('products')
      .select('id, title, inventory_quantity')
      .in('id', Array.from(allProductIds));

    // Fetch all variant inventory
    let variants: any[] = [];
    if (allVariantIds.size > 0) {
      const { data: variantData } = await supabase
        .from('product_variants')
        .select('id, product_id, title, inventory_quantity, option1_value, option2_value')
        .in('id', Array.from(allVariantIds));
      variants = variantData || [];
    }

    // Build inventory maps
    const productInventory = new Map(
      (products || []).map(p => [p.id, { title: p.title, stock: p.inventory_quantity || 0 }])
    );

    const variantInventory = new Map(
      variants.map(v => [v.id, { 
        title: v.title || `${v.option1_value || ''}${v.option2_value ? ' / ' + v.option2_value : ''}`,
        stock: v.inventory_quantity || 0,
        product_id: v.product_id
      }])
    );

    // Check each order
    const orderAlerts: Record<string, { order_number: string; alerts: InventoryAlert[]; has_issues: boolean }> = {};

    for (const order of orders || []) {
      let items: OrderItem[] = [];
      if (order.items) {
        if (typeof order.items === 'string') {
          try {
            items = JSON.parse(order.items);
          } catch {
            items = [];
          }
        } else if (Array.isArray(order.items)) {
          items = order.items;
        }
      }

      const alerts: InventoryAlert[] = [];

      for (const item of items) {
        let currentStock = 0;
        let productTitle = item.title || 'Unknown Product';
        let variantTitle: string | undefined;

        if (item.variant_id && variantInventory.has(item.variant_id)) {
          const variant = variantInventory.get(item.variant_id)!;
          currentStock = variant.stock;
          variantTitle = variant.title;
          if (productInventory.has(item.product_id)) {
            productTitle = productInventory.get(item.product_id)!.title;
          }
        } else if (item.product_id && productInventory.has(item.product_id)) {
          const product = productInventory.get(item.product_id)!;
          currentStock = product.stock;
          productTitle = product.title;
        }

        let status: 'critical' | 'low' | 'ok';
        const remainingStock = currentStock - item.quantity;

        if (currentStock <= CRITICAL_STOCK_THRESHOLD || remainingStock < 0) {
          status = 'critical';
        } else if (currentStock <= LOW_STOCK_THRESHOLD || remainingStock <= LOW_STOCK_THRESHOLD) {
          status = 'low';
        } else {
          status = 'ok';
        }

        if (status !== 'ok') {
          alerts.push({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_title: productTitle,
            variant_title: variantTitle,
            current_stock: currentStock,
            ordered_quantity: item.quantity,
            status,
          });
        }
      }

      orderAlerts[order.id] = {
        order_number: order.order_number || order.id,
        alerts,
        has_issues: alerts.length > 0,
      };
    }

    // Calculate overall summary
    const allAlerts = Object.values(orderAlerts).flatMap(o => o.alerts);
    const summary = {
      total_orders: orders?.length || 0,
      orders_with_issues: Object.values(orderAlerts).filter(o => o.has_issues).length,
      total_alerts: allAlerts.length,
      critical: allAlerts.filter(a => a.status === 'critical').length,
      low: allAlerts.filter(a => a.status === 'low').length,
    };

    return NextResponse.json({ 
      orders: orderAlerts,
      summary,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/orders/inventory-check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
