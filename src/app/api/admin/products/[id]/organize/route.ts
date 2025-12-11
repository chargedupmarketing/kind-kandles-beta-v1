import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// PATCH /api/admin/products/[id]/organize - Update product type and tags
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    
    if (body.product_type !== undefined) {
      updateData.product_type = body.product_type;
    }
    
    if (body.tags !== undefined) {
      updateData.tags = body.tags;
    }
    
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    
    if (body.collection_id !== undefined) {
      updateData.collection_id = body.collection_id;
    }
    
    if (body.featured !== undefined) {
      updateData.featured = body.featured;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update the product
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Product updated successfully',
      product: data 
    });
  } catch (error) {
    console.error('Organize product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/products/[id]/organize - Get product organization info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('id, title, product_type, tags, status, collection_id, featured')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

