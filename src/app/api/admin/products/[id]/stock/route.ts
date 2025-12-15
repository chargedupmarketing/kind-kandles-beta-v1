import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// PATCH /api/admin/products/[id]/stock - Update product inventory
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    const { inventory_quantity } = body;

    if (inventory_quantity === undefined || inventory_quantity < 0) {
      return NextResponse.json({ error: 'Invalid inventory quantity' }, { status: 400 });
    }

    // First, get the product's default variant
    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (variantError) {
      console.error('Error fetching variant:', variantError);
      return NextResponse.json({ error: 'Failed to fetch product variant' }, { status: 500 });
    }

    if (!variants || variants.length === 0) {
      // If no variant exists, create one
      const { error: createError } = await supabase
        .from('product_variants')
        .insert({
          product_id: id,
          title: 'Default Title',
          inventory_quantity: inventory_quantity,
          available_for_sale: inventory_quantity > 0
        });

      if (createError) {
        console.error('Error creating variant:', createError);
        return NextResponse.json({ error: 'Failed to create product variant' }, { status: 500 });
      }
    } else {
      // Update the existing variant
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ 
          inventory_quantity: inventory_quantity,
          available_for_sale: inventory_quantity > 0
        })
        .eq('id', variants[0].id);

      if (updateError) {
        console.error('Error updating variant:', updateError);
        return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: 'Inventory updated successfully',
      inventory_quantity: inventory_quantity 
    });
  } catch (error) {
    console.error('Update stock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/products/[id]/stock - Get product inventory
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('inventory_quantity, available_for_sale')
      .eq('product_id', id)
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    return NextResponse.json({ 
      inventory_quantity: variants?.inventory_quantity || 0,
      available_for_sale: variants?.available_for_sale || false
    });
  } catch (error) {
    console.error('Get stock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

