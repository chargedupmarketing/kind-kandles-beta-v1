import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/admin/product-inquiries/[id]/convert - Convert inquiry to product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const body = await request.json();
    
    const {
      title,
      productType,
      price,
      compareAtPrice,
      description,
      tags,
      weight,
      weightUnit,
      inventoryQuantity,
      sku,
      featured,
      collectionId,
    } = body;

    // Validate required fields
    if (!title || !productType || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: title, productType, price' },
        { status: 400 }
      );
    }

    // Get the inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('product_inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
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
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        status: 'active',
        featured: featured || false,
        vendor: 'My Kind Kandles',
        tags: tags || [productType.toLowerCase()],
        weight: weight || 8,
        weight_unit: weightUnit || 'oz',
        collection_id: collectionId || null,
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
        sku: sku || `${handle}-default`.toUpperCase(),
        price: parseFloat(price),
        compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
        inventory_quantity: inventoryQuantity || 0,
        weight: weight || 8,
        weight_unit: weightUnit || 'oz',
        available_for_sale: true,
      });

    if (variantError) {
      console.error('Error creating variant:', variantError);
    }

    // Assign image to product
    if (inquiry.image_url) {
      const { error: imageError } = await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          url: inquiry.image_url,
          alt_text: inquiry.image_alt_text || title,
          position: 1,
        });

      if (imageError) {
        console.error('Error assigning image:', imageError);
      }
    }

    // Update inquiry status
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error: updateError } = await supabase
      .from('product_inquiries')
      .update({
        status: 'completed',
        product_id: product.id,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating inquiry:', updateError);
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product created successfully from inquiry',
    });

  } catch (error) {
    console.error('Error in POST /api/admin/product-inquiries/[id]/convert:', error);
    
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
