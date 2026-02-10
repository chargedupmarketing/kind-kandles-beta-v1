import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function convertToCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (!data || data.length === 0) return '';
  
  const keys = headers || Object.keys(data[0]);
  const csvRows = [];
  
  // Header row
  csvRows.push(keys.join(','));
  
  // Data rows
  for (const row of data) {
    const values = keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return String(value);
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    let data: Record<string, unknown>[] = [];
    let filename = '';

    switch (type) {
      case 'products': {
        const { data: products } = await supabase
          .from('products')
          .select('id, title, handle, description, price, compare_at_price, product_type, vendor, tags, status, featured, created_at');
        data = (products || []) as Record<string, unknown>[];
        filename = 'products';
        break;
      }
      case 'orders': {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number, customer_email, customer_name, total, subtotal, tax, shipping, status, payment_status, shipping_status, created_at');
        data = (orders || []) as Record<string, unknown>[];
        filename = 'orders';
        break;
      }
      case 'customers': {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, email, first_name, last_name, phone, total_orders, total_spent, created_at');
        data = (customers || []) as Record<string, unknown>[];
        filename = 'customers';
        break;
      }
      case 'contacts': {
        const { data: contacts } = await supabase
          .from('contact_submissions')
          .select('id, name, email, subject, message, status, created_at');
        data = (contacts || []) as Record<string, unknown>[];
        filename = 'contact_submissions';
        break;
      }
      case 'stories': {
        const { data: stories } = await supabase
          .from('customer_stories')
          .select('id, author, email, content, products, status, created_at');
        data = ((stories || []) as Record<string, unknown>[]).map((row) => ({
          id: row.id,
          name: row.author,
          email: row.email,
          story: row.content,
          product_purchased: row.products,
          status: row.status,
          created_at: row.created_at,
        }));
        filename = 'customer_stories';
        break;
      }
      case 'surveys': {
        const { data: surveys } = await supabase
          .from('survey_responses')
          .select('id, email, responses, newsletter_opt_in, created_at');
        data = (surveys || []) as Record<string, unknown>[];
        filename = 'survey_responses';
        break;
      }
      case 'all': {
        // Export all tables
        const [products, orders, customers, contacts, stories, surveys] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('orders').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('contact_submissions').select('*'),
          supabase.from('customer_stories').select('*'),
          supabase.from('survey_responses').select('*')
        ]);

        // Create a combined export with sections
        const sections = [
          { name: 'PRODUCTS', data: products.data || [] },
          { name: 'ORDERS', data: orders.data || [] },
          { name: 'CUSTOMERS', data: customers.data || [] },
          { name: 'CONTACT_SUBMISSIONS', data: contacts.data || [] },
          { name: 'CUSTOMER_STORIES', data: stories.data || [] },
          { name: 'SURVEY_RESPONSES', data: surveys.data || [] }
        ];

        let csvContent = '';
        for (const section of sections) {
          csvContent += `\n\n=== ${section.name} ===\n`;
          if (section.data.length > 0) {
            csvContent += convertToCSV(section.data as Record<string, unknown>[]);
          } else {
            csvContent += 'No data';
          }
        }

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="full_backup_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      }
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const csv = convertToCSV(data);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

