import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/lib/supabase';

// GET /api/collections/[handle] - Get collection with products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort') || 'created_at';
    const sortOrder = searchParams.get('order') || 'desc';

    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('handle', handle)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Get products in collection
    let productsQuery = supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `, { count: 'exact' })
      .eq('status', 'active')
      .range(offset, offset + limit - 1);

    // Handle 'all' collection specially
    if (handle !== 'all' && collection) {
      productsQuery = productsQuery.eq('collection_id', (collection as any).id);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    switch (sortBy) {
      case 'price':
        productsQuery = productsQuery.order('price', { ascending });
        break;
      case 'title':
        productsQuery = productsQuery.order('title', { ascending });
        break;
      case 'created_at':
      default:
        productsQuery = productsQuery.order('created_at', { ascending });
        break;
    }

    const { data: products, error: productsError, count } = await productsQuery;

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      collection,
      products: products || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/collections/[handle] - Update collection (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.position !== undefined) updateData.position = body.position;

    const { data: collection, error } = await serverClient
      .from('collections')
      .update(updateData as any)
      .eq('handle', handle)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection:', error);
      return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
    }

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Update collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/collections/[handle] - Delete collection (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();

    const { error } = await serverClient
      .from('collections')
      .delete()
      .eq('handle', handle);

    if (error) {
      console.error('Error deleting collection:', error);
      return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

