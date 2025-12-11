import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/admin/products - List all products (admin view)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*),
        collection:collections(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('Admin products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/products - Bulk update products
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    
    if (!body.updates || !Array.isArray(body.updates)) {
      return NextResponse.json({ error: 'Updates array is required' }, { status: 400 });
    }

    const results = [];
    
    for (const update of body.updates) {
      if (!update.id) continue;
      
      const { id, ...updateData } = update;
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating product ${id}:`, error);
        results.push({ id, success: false, error: error.message });
      } else {
        results.push({ id, success: true, data });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

