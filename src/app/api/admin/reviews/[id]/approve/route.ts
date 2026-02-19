import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { notifyCustomerReviewApproved } from '@/lib/notifications';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Verify admin from cookie
async function verifyAdmin(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secure-jwt-secret-at-least-32-characters-long');
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// POST - Approve a review and notify the customer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication
    const admin = await verifyAdmin();
    if (!admin || !admin.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get the review with product info
    const { data: review, error: fetchError } = await supabase
      .from('product_reviews')
      .select(`
        *,
        product:products(id, title)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if already approved
    if (review.status === 'approved') {
      return NextResponse.json({ 
        success: true, 
        message: 'Review is already approved',
        review 
      });
    }

    // Update review status to approved
    const { data: updatedReview, error: updateError } = await supabase
      .from('product_reviews')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        product:products(id, title)
      `)
      .single();

    if (updateError) {
      console.error('Error approving review:', updateError);
      return NextResponse.json({ error: 'Failed to approve review' }, { status: 500 });
    }

    // Send notification to customer
    const productName = updatedReview.product?.title || 'your product';
    
    notifyCustomerReviewApproved({
      id: updatedReview.id,
      product_name: productName,
      customer_name: updatedReview.customer_name || 'Valued Customer',
      customer_email: updatedReview.customer_email,
    }).catch(err => {
      console.error('Failed to send review approved notification:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Review approved and customer notified',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/reviews/[id]/approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
