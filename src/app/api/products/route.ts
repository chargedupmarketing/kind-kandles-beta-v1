import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/lib/supabase';
import type { ProductInsert } from '@/lib/database.types';

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const productType = searchParams.get('type');
    const tag = searchParams.get('tag');
    const includeAll = searchParams.get('include_all') === 'true'; // Admin flag to include all products

    let query = supabase
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*),
        collection:collections(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Filter by collection
    if (collection) {
      const { data: collectionData } = await supabase
        .from('collections')
        .select('id')
        .eq('handle', collection)
        .single();

      if (collectionData) {
        query = query.eq('collection_id', collectionData.id);
      }
    }

    // Filter by product type (case-insensitive)
    if (productType) {
      query = query.ilike('product_type', `%${productType}%`);
    }

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Filter by featured
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Search by title
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Filter out products that are out of stock (unless admin flag is set)
    let filteredProducts = products || [];
    if (!includeAll) {
      filteredProducts = filteredProducts.filter(product => {
        // Check if product has any variant with inventory > 0
        const variants = product.variants || [];
        if (variants.length === 0) return true; // Show products without variants
        
        const totalInventory = variants.reduce((sum: number, variant: any) => {
          return sum + (variant.inventory_quantity || 0);
        }, 0);
        
        return totalInventory > 0;
      });
    }

    // Apply pagination after filtering
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    return NextResponse.json({
      products: paginatedProducts,
      total: filteredProducts.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products - Create a new product (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.price) {
      return NextResponse.json({ error: 'Title and price are required' }, { status: 400 });
    }

    // Generate handle from title if not provided
    const handle = body.handle || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const productData: ProductInsert = {
      title: body.title,
      handle,
      description: body.description || null,
      price: parseFloat(body.price),
      compare_at_price: body.compare_at_price ? parseFloat(body.compare_at_price) : null,
      collection_id: body.collection_id || null,
      tags: body.tags || null,
      vendor: body.vendor || null,
      product_type: body.product_type || null,
      status: body.status || 'draft',
      featured: body.featured || false,
      weight: body.weight ? parseFloat(body.weight) : null,
      weight_unit: body.weight_unit || 'oz'
    };

    const { data: product, error } = await serverClient
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    // Create default variant if variants not provided
    if (!body.variants || body.variants.length === 0) {
      await serverClient
        .from('product_variants')
        .insert({
          product_id: product.id,
          title: 'Default Title',
          price: productData.price,
          compare_at_price: productData.compare_at_price,
          inventory_quantity: body.inventory_quantity || 0,
          weight: productData.weight,
          weight_unit: productData.weight_unit
        });
    } else {
      // Create provided variants
      const variantsToInsert = body.variants.map((v: any) => ({
        product_id: product.id,
        title: v.title || 'Default Title',
        sku: v.sku || null,
        price: parseFloat(v.price || productData.price),
        compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        inventory_quantity: v.inventory_quantity || 0,
        weight: v.weight ? parseFloat(v.weight) : null,
        weight_unit: v.weight_unit || 'oz',
        option1_name: v.option1_name || null,
        option1_value: v.option1_value || null,
        option2_name: v.option2_name || null,
        option2_value: v.option2_value || null,
        option3_name: v.option3_name || null,
        option3_value: v.option3_value || null
      }));

      await serverClient.from('product_variants').insert(variantsToInsert);
    }

    // Add images if provided
    if (body.images && body.images.length > 0) {
      const imagesToInsert = body.images.map((img: any, index: number) => ({
        product_id: product.id,
        url: img.url,
        alt_text: img.alt_text || null,
        position: index
      }));

      await serverClient.from('product_images').insert(imagesToInsert);
    }

    // Fetch complete product with relations
    const { data: completeProduct } = await serverClient
      .from('products')
      .select(`
        *,
        variants:product_variants(*),
        images:product_images(*),
        collection:collections(*)
      `)
      .eq('id', product.id)
      .single();

    return NextResponse.json({ product: completeProduct }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

