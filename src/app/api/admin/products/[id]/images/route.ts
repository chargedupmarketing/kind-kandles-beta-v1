import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();
    const { imageUrl, altText } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if image URL already exists for this product
    const { data: existingImages } = await supabase
      .from('product_images')
      .select('id, url')
      .eq('product_id', productId)
      .eq('url', imageUrl);

    if (existingImages && existingImages.length > 0) {
      return NextResponse.json(
        { error: 'This image is already assigned to this product' },
        { status: 409 }
      );
    }

    // Get the highest position number for this product
    const { data: positionData } = await supabase
      .from('product_images')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = positionData && positionData.length > 0 
      ? (positionData[0].position || 0) + 1 
      : 0;

    // Insert the new image
    const { data: newImage, error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: imageUrl,
        alt_text: altText || null,
        position: nextPosition,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting image:', insertError);
      return NextResponse.json(
        { error: 'Failed to add image to product' },
        { status: 500 }
      );
    }

    // Fetch updated product with all images
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        images:product_images(*)
      `)
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching updated product:', productError);
      return NextResponse.json(
        { error: 'Image added but failed to fetch updated product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: newImage,
      product: product,
    });

  } catch (error) {
    console.error('Error in POST /api/admin/products/[id]/images:', error);
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
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Delete the image
    const { error: deleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Error deleting image:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/products/[id]/images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
