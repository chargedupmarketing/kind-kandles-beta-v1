import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/admin/product-inquiries - List all product inquiries
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    
    let query = supabase
      .from('product_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error('Error fetching product inquiries:', error);
      return NextResponse.json({ error: 'Failed to fetch product inquiries' }, { status: 500 });
    }

    return NextResponse.json({ inquiries: inquiries || [] });
  } catch (error) {
    console.error('Product inquiries API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/product-inquiries - Create new product inquiry
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    
    const {
      aiProductName,
      aiScentName,
      aiProductType,
      aiColors,
      aiContainerType,
      aiSize,
      imageUrl,
      imageAltText,
      suggestedTitle,
      suggestedPrice,
      suggestedDescription,
      suggestedProductType,
      suggestedTags,
      priority = 'normal',
    } = body;

    // Validate required fields
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { data: inquiry, error } = await supabase
      .from('product_inquiries')
      .insert({
        ai_product_name: aiProductName,
        ai_scent_name: aiScentName,
        ai_product_type: aiProductType,
        ai_colors: aiColors,
        ai_container_type: aiContainerType,
        ai_size: aiSize,
        image_url: imageUrl,
        image_alt_text: imageAltText,
        suggested_title: suggestedTitle,
        suggested_price: suggestedPrice,
        suggested_description: suggestedDescription,
        suggested_product_type: suggestedProductType,
        suggested_tags: suggestedTags,
        priority: priority,
        status: 'pending',
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product inquiry:', error);
      return NextResponse.json(
        { error: 'Failed to create product inquiry', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inquiry,
    });

  } catch (error) {
    console.error('Error in POST /api/admin/product-inquiries:', error);
    
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
