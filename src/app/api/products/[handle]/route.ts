import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/lib/supabase';

// GET /api/products/[handle] - Get single product by handle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('handle', handle)
      .eq('status', 'active')
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Sort images by position
    if (product.images) {
      product.images.sort((a: any, b: any) => a.position - b.position);
    }

    // Sort variants
    if (product.variants) {
      product.variants.sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/products/[handle] - Update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();
    const body = await request.json();

    // Get existing product
    const { data: existingProduct } = await serverClient
      .from('products')
      .select('id')
      .eq('handle', handle)
      .single();

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.compare_at_price !== undefined) updateData.compare_at_price = body.compare_at_price ? parseFloat(body.compare_at_price) : null;
    if (body.collection_id !== undefined) updateData.collection_id = body.collection_id;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.vendor !== undefined) updateData.vendor = body.vendor;
    if (body.product_type !== undefined) updateData.product_type = body.product_type;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.weight !== undefined) updateData.weight = body.weight ? parseFloat(body.weight) : null;
    if (body.weight_unit !== undefined) updateData.weight_unit = body.weight_unit;

    // Generate new handle if title changed
    if (body.title && body.title !== handle) {
      updateData.handle = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const { data: product, error } = await serverClient
      .from('products')
      .update(updateData)
      .eq('id', existingProduct.id)
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*),
        collection:collections(*)
      `)
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/[handle] - Delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();

    const { error } = await serverClient
      .from('products')
      .delete()
      .eq('handle', handle);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

