import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    
    const { title, productType, price, description, imageUrl, imageAltText } = body;

    // Validate required fields
    if (!title || !productType || !price || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, productType, price, imageUrl' },
        { status: 400 }
      );
    }

    // Generate handle from title
    const handle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title,
        handle,
        description: description || '',
        product_type: productType,
        price: parseFloat(price),
        compare_at_price: null,
        status: 'active',
        featured: false,
        vendor: 'My Kind Kandles',
        tags: [productType.toLowerCase()],
        weight: 8,
        weight_unit: 'oz',
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return NextResponse.json(
        { error: 'Failed to create product', details: productError.message },
        { status: 500 }
      );
    }

    // Create default variant
    const { error: variantError } = await supabase
      .from('product_variants')
      .insert({
        product_id: product.id,
        title: 'Default',
        sku: `${handle}-default`.toUpperCase(),
        price: parseFloat(price),
        compare_at_price: null,
        inventory_quantity: 0,
        weight: 8,
        weight_unit: 'oz',
        available_for_sale: true,
      });

    if (variantError) {
      console.error('Error creating variant:', variantError);
      // Don't fail the whole request, just log it
    }

    // Assign image to product
    const { error: imageError } = await supabase
      .from('product_images')
      .insert({
        product_id: product.id,
        url: imageUrl,
        alt_text: imageAltText || title,
        position: 1,
      });

    if (imageError) {
      console.error('Error assigning image:', imageError);
      return NextResponse.json(
        {
          product,
          imageAssigned: false,
          warning: 'Product created but image assignment failed',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      imageAssigned: true,
    });

  } catch (error) {
    console.error('Error in POST /api/admin/products/create-with-image:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
