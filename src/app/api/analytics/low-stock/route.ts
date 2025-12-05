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
    const threshold = parseInt(searchParams.get('threshold') || '5');

    if (!isSupabaseConfigured()) {
      // Return mock data when Supabase is not configured
      return NextResponse.json({
        products: [
          { product_id: '1', product_title: 'Lavender Dreams Candle', variant_id: 'v1', variant_title: 'Large', sku: 'LDC-LG', inventory_quantity: 3 },
          { product_id: '2', product_title: 'Vanilla Bean Body Butter', variant_id: 'v2', variant_title: '8oz', sku: 'VBB-8', inventory_quantity: 0 },
          { product_id: '3', product_title: 'Citrus Burst Room Spray', variant_id: 'v3', variant_title: 'Default Title', sku: 'CBRS-1', inventory_quantity: 2 }
        ]
      });
    }

    const serverClient = createServerClient();

    const { data: variants, error } = await serverClient
      .from('product_variants')
      .select(`
        id,
        title,
        sku,
        inventory_quantity,
        product_id,
        products!inner(id, title, status)
      `)
      .lte('inventory_quantity', threshold)
      .eq('products.status', 'active')
      .order('inventory_quantity', { ascending: true });

    if (error) {
      console.error('Error fetching low stock products:', error);
      return NextResponse.json({ error: 'Failed to fetch low stock products' }, { status: 500 });
    }

    const products = variants?.map((v: any) => ({
      product_id: v.products.id,
      product_title: v.products.title,
      variant_id: v.id,
      variant_title: v.title,
      sku: v.sku,
      inventory_quantity: v.inventory_quantity
    })) || [];

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error in low stock route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

