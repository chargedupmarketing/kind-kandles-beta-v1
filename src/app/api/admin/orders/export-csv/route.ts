import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderIds } = body;

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
      // Otherwise, export only pending/processing orders
      query = query.in('status', ['pending', 'processing', 'paid']);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'No orders to export' }, { status: 400 });
    }

    // Format for Pirate Ship CSV
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
        'Notes'
      ].join(',')
    ];

    // Data rows
    for (const order of orders) {
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
        escapeCSV(calculateWeightInOz(order).toString()),
        escapeCSV(order.notes || '')
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="pirateship-orders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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

// Helper function to calculate weight in ounces
function calculateWeightInOz(order: any): number {
  // Try to get weight from order data
  if (order.weight_oz) return order.weight_oz;
  if (order.weight_lb) return order.weight_lb * 16;
  
  // Default weight based on order total (rough estimate)
  // Assume average candle is 12 oz
  const itemCount = order.items?.length || 1;
  return itemCount * 12;
}

