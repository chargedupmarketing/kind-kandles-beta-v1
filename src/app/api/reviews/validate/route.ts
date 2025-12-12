import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Validate a review token and return product info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get token data
    const { data: reviewToken, error: tokenError } = await supabase
      .from('review_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !reviewToken) {
      return NextResponse.json({ error: 'Invalid review link' }, { status: 400 });
    }

    // Check if token is expired
    if (new Date(reviewToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This review link has expired' }, { status: 400 });
    }

    // Check if token has already been used
    if (reviewToken.used_at) {
      return NextResponse.json({ error: 'This review link has already been used' }, { status: 400 });
    }

    // Get product details
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, images')
      .in('id', reviewToken.product_ids);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      valid: true,
      tokenData: {
        customer_name: reviewToken.customer_name,
        customer_email: reviewToken.customer_email,
        product_ids: reviewToken.product_ids,
        expires_at: reviewToken.expires_at,
        used_at: reviewToken.used_at,
      },
      products: products || [],
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

