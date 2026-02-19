import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch all reviews for admin
export async function GET(request: NextRequest) {

  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const productId = searchParams.get('product_id');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        products:product_id (
          id,
          title,
          handle
        )
      `, { count: 'exact' });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by product
    if (productId) {
      query = query.eq('product_id', productId);
    }

    // Search in content or customer name
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,content.ilike.%${search}%,title.ilike.%${search}%`);
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        // Return empty data if table doesn't exist yet
        return NextResponse.json({
          reviews: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          stats: {
            pending: 0,
            approved: 0,
            rejected: 0,
          },
          message: 'Reviews table not yet created. Create the product_reviews table in Supabase to enable this feature.'
        });
      }
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Get stats - use count from response metadata
    const { count: pendingCount } = await supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedCount } = await supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedCount } = await supabase
      .from('product_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected');

    return NextResponse.json({
      reviews: reviews || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: {
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
      },
    });
  } catch (error) {
    console.error('Admin reviews fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update review status or add admin response
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, admin_response } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = status;
    }

    if (admin_response !== undefined) {
      updates.admin_response = admin_response;
    }

    const { data: review, error } = await supabase
      .from('product_reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted',
    });
  } catch (error) {
    console.error('Review delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

