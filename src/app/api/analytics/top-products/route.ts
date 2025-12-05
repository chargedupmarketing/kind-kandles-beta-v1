import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    if (!isSupabaseConfigured()) {
      // Return mock data when Supabase is not configured
      return NextResponse.json({
        products: [
          { product_id: '1', product_title: 'Lavender Dreams Candle', total_quantity: 45, total_revenue: 1125.00 },
          { product_id: '2', product_title: 'Vanilla Bean Body Butter', total_quantity: 38, total_revenue: 760.00 },
          { product_id: '3', product_title: 'Citrus Burst Room Spray', total_quantity: 32, total_revenue: 480.00 },
          { product_id: '4', product_title: 'Rose Garden Soap', total_quantity: 28, total_revenue: 280.00 },
          { product_id: '5', product_title: 'Eucalyptus Mint Lotion', total_quantity: 24, total_revenue: 360.00 }
        ]
      });
    }

    const serverClient = createServerClient();

    // Get orders in date range
    const { data: orders } = await serverClient
      .from('orders')
      .select('id')
      .eq('payment_status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (!orders || orders.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const orderIds = orders.map(o => o.id);

    // Get order items for those orders
    const { data: orderItems } = await serverClient
      .from('order_items')
      .select('product_id, title, quantity, total')
      .in('order_id', orderIds);

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Aggregate by product
    const productMap = new Map<string, { product_id: string; product_title: string; total_quantity: number; total_revenue: number }>();
    
    for (const item of orderItems) {
      const existing = productMap.get(item.product_id);
      if (existing) {
        existing.total_quantity += item.quantity;
        existing.total_revenue += item.total;
      } else {
        productMap.set(item.product_id, {
          product_id: item.product_id,
          product_title: item.title,
          total_quantity: item.quantity,
          total_revenue: item.total
        });
      }
    }

    // Sort by revenue and limit
    const products = Array.from(productMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error in top products route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

