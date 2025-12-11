import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    switch (type) {
      case 'products': {
        // Delete related data first (foreign key constraints)
        await supabase.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'orders': {
        // Delete order items first
        await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'customers': {
        const { error } = await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'contacts': {
        const { error } = await supabase.from('contact_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'stories': {
        const { error } = await supabase.from('customer_stories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      case 'surveys': {
        const { error } = await supabase.from('survey_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${type} data deleted successfully` });
  } catch (error) {
    console.error('Wipe error:', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}

