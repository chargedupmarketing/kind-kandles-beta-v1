import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get counts from each table
    const [
      { count: productsCount },
      { count: ordersCount },
      { count: customersCount },
      { count: contactsCount },
      { count: storiesCount },
      { count: surveysCount }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
      supabase.from('customer_stories').select('*', { count: 'exact', head: true }),
      supabase.from('survey_responses').select('*', { count: 'exact', head: true })
    ]);

    return NextResponse.json({
      products: productsCount || 0,
      orders: ordersCount || 0,
      customers: customersCount || 0,
      contacts: contactsCount || 0,
      stories: storiesCount || 0,
      surveys: surveysCount || 0
    });
  } catch (error) {
    console.error('Database stats error:', error);
    // Return zeros if tables don't exist
    return NextResponse.json({
      products: 0,
      orders: 0,
      customers: 0,
      contacts: 0,
      stories: 0,
      surveys: 0
    });
  }
}

