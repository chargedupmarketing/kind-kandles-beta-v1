import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/lib/supabase';

// Map collection handles to product_type patterns
const COLLECTION_PRODUCT_TYPE_MAP: Record<string, string[]> = {
  'candles': ['soy candle', 'Soy Candle', 'Soy Blend Candle', 'candle'],
  'skincare': ['Luxury Whipped Body Butter', 'Body mist', 'Lotion', 'Bar Soap', 'Soap/Body Scrub', 'lotion', 'body butter', 'scrub', 'soap'],
  'body-oils': ['herbal hair oil', 'body oil', 'oil'],
  'room-sprays': ['ROOM SPRAY', 'Room Spray', 'room spray'],
  'clothing-accessories': ['T-Shirt', 'Dress', 't-shirt', 'dress', 'clothing', 'accessories'],
  'calm-down-girl': [], // Will use title matching
};

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

    // Get all active products first
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('status', 'active');

    if (allProductsError) {
      console.error('Error fetching products:', allProductsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Filter products based on collection handle
    let filteredProducts = allProducts || [];
    
    if (handle !== 'all') {
      const productTypes = COLLECTION_PRODUCT_TYPE_MAP[handle] || [];
      
      if (handle === 'calm-down-girl') {
        // Special case: filter by title containing "Calm Down Girl"
        filteredProducts = filteredProducts.filter(p => 
          p.title?.toLowerCase().includes('calm down girl')
        );
      } else if (productTypes.length > 0) {
        // Filter by product_type (case-insensitive)
        filteredProducts = filteredProducts.filter(p => {
          if (!p.product_type) return false;
          const productTypeLower = p.product_type.toLowerCase();
          return productTypes.some(type => productTypeLower.includes(type.toLowerCase()));
        });
      } else {
        // Try to match by collection_id as fallback
        filteredProducts = filteredProducts.filter(p => 
          p.collection_id === (collection as any).id
        );
      }
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    filteredProducts.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return ascending ? comparison : -comparison;
    });

    // Apply pagination
    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    return NextResponse.json({
      collection,
      products: paginatedProducts,
      total,
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

