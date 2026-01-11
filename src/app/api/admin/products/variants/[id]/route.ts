import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { inventory_quantity } = body;

    if (inventory_quantity === undefined || inventory_quantity === null) {
      return NextResponse.json(
        { error: 'inventory_quantity is required' },
        { status: 400 }
      );
    }

    // Update the variant's inventory quantity
    const { data, error } = await supabase
      .from('product_variants')
      .update({
        inventory_quantity: parseInt(inventory_quantity),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating variant inventory:', error);
      return NextResponse.json(
        { error: 'Failed to update variant inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      variant: data
    });
  } catch (error) {
    console.error('Error in variant update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

