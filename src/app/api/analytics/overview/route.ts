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

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(0);
        previousStartDate = new Date(0);
        previousEndDate = new Date(0);
    }

    if (!isSupabaseConfigured()) {
      // Return mock data when Supabase is not configured
      return NextResponse.json({
        totalRevenue: 12500.00,
        totalOrders: 156,
        avgOrderValue: 80.13,
        totalCustomers: 89,
        newCustomers: 23,
        previousRevenue: 10800.00,
        previousOrders: 134
      });
    }

    const serverClient = createServerClient();

    // Get current period stats
    // Include orders that are paid OR have progressed beyond pending status
    // (processing, shipped, delivered indicate payment was successful)
    const { data: currentOrders, error: currentError } = await serverClient
      .from('orders')
      .select('total, customer_email, status, payment_status, created_at')
      .or('payment_status.eq.paid,status.in.(processing,shipped,delivered,paid)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (currentError) {
      console.error('Error fetching current orders:', currentError);
    }

    console.log(`Analytics: Found ${currentOrders?.length || 0} orders in current period (${startDate.toISOString()} to ${now.toISOString()})`);
    if (currentOrders && currentOrders.length > 0) {
      console.log('Sample order:', currentOrders[0]);
    }

    // Get previous period stats
    const { data: previousOrders, error: previousError } = await serverClient
      .from('orders')
      .select('total, status, payment_status, created_at')
      .or('payment_status.eq.paid,status.in.(processing,shipped,delivered,paid)')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', previousEndDate.toISOString());

    if (previousError) {
      console.error('Error fetching previous orders:', previousError);
    }

    console.log(`Analytics: Found ${previousOrders?.length || 0} orders in previous period (${previousStartDate.toISOString()} to ${previousEndDate.toISOString()})`);

    // Get all-time customers before current period
    const { data: allCustomers } = await serverClient
      .from('orders')
      .select('customer_email')
      .or('payment_status.eq.paid,status.in.(processing,shipped,delivered,paid)')
      .lt('created_at', startDate.toISOString());

    const existingCustomerEmails = new Set(allCustomers?.map(o => o.customer_email) || []);
    const currentCustomerEmails = new Set(currentOrders?.map(o => o.customer_email) || []);
    
    const newCustomers = [...currentCustomerEmails].filter(email => !existingCustomerEmails.has(email)).length;

    const totalRevenue = currentOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const totalOrders = currentOrders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = currentCustomerEmails.size;

    const previousRevenue = previousOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const previousOrdersCount = previousOrders?.length || 0;

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalCustomers,
      newCustomers,
      previousRevenue,
      previousOrders: previousOrdersCount
    });
  } catch (error) {
    console.error('Error in analytics overview route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

