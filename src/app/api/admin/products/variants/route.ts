import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/admin/products/variants - Create a new variant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const serverClient = createServerClient();
    
    const {
      product_id,
      title,
      sku,
      price,
      compare_at_price,
      inventory_quantity,
      weight,
      weight_unit,
      option1_name,
      option1_value,
      option2_name,
      option2_value,
      option3_name,
      option3_value,
      available_for_sale
    } = body;

    if (!product_id || !title || price === undefined) {
      return NextResponse.json(
        { error: 'product_id, title, and price are required' },
        { status: 400 }
      );
    }

    // Create the variant
    const { data, error } = await serverClient
      .from('product_variants')
      .insert({
        product_id,
        title,
        sku: sku || null,
        price: parseFloat(price),
        compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
        inventory_quantity: parseInt(inventory_quantity) || 0,
        weight: weight ? parseFloat(weight) : null,
        weight_unit: weight_unit || 'oz',
        option1_name: option1_name || null,
        option1_value: option1_value || null,
        option2_name: option2_name || null,
        option2_value: option2_value || null,
        option3_name: option3_name || null,
        option3_value: option3_value || null,
        available_for_sale: available_for_sale !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating variant:', error);
      return NextResponse.json(
        { error: 'Failed to create variant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      variant: data
    }, { status: 201 });
  } catch (error) {
    console.error('Error in variant creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

