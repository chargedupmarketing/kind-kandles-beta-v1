import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const serverClient = createServerClient();

    // Build update object dynamically based on what's provided
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.sku !== undefined) updateData.sku = body.sku || null;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.compare_at_price !== undefined) {
      updateData.compare_at_price = body.compare_at_price ? parseFloat(body.compare_at_price) : null;
    }
    if (body.inventory_quantity !== undefined) {
      updateData.inventory_quantity = parseInt(body.inventory_quantity);
    }
    if (body.weight !== undefined) {
      updateData.weight = body.weight ? parseFloat(body.weight) : null;
    }
    if (body.weight_unit !== undefined) updateData.weight_unit = body.weight_unit;
    if (body.option1_name !== undefined) updateData.option1_name = body.option1_name || null;
    if (body.option1_value !== undefined) updateData.option1_value = body.option1_value || null;
    if (body.option2_name !== undefined) updateData.option2_name = body.option2_name || null;
    if (body.option2_value !== undefined) updateData.option2_value = body.option2_value || null;
    if (body.option3_name !== undefined) updateData.option3_name = body.option3_name || null;
    if (body.option3_value !== undefined) updateData.option3_value = body.option3_value || null;
    if (body.available_for_sale !== undefined) updateData.available_for_sale = body.available_for_sale;

    // Update the variant
    const { data, error } = await serverClient
      .from('product_variants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating variant:', error);
      return NextResponse.json(
        { error: 'Failed to update variant' },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serverClient = createServerClient();

    // Check if this is the last variant for the product
    const { data: variant } = await serverClient
      .from('product_variants')
      .select('product_id')
      .eq('id', id)
      .single();

    if (variant) {
      const { count } = await serverClient
        .from('product_variants')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', variant.product_id);

      if (count === 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last variant. Products must have at least one variant.' },
          { status: 400 }
        );
      }
    }

    // Delete the variant
    const { error } = await serverClient
      .from('product_variants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting variant:', error);
      return NextResponse.json(
        { error: 'Failed to delete variant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error in variant deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

