import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/products/types - Get all unique product types
export async function GET(request: NextRequest) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('product_type')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching product types:', error);
      return NextResponse.json({ error: 'Failed to fetch product types' }, { status: 500 });
    }

    // Get unique product types and count
    const typeCounts: Record<string, number> = {};
    products?.forEach(product => {
      const type = product.product_type || 'null';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Sort by count
    const sortedTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count }));

    return NextResponse.json({
      total_products: products?.length || 0,
      unique_types: Object.keys(typeCounts).length,
      types: sortedTypes,
    });
  } catch (error) {
    console.error('Product types API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
