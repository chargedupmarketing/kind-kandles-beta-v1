import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/admin/product-inquiries/[id] - Get single inquiry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: inquiry, error } = await supabase
      .from('product_inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching inquiry:', error);
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error('Get inquiry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/product-inquiries/[id] - Update inquiry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const body = await request.json();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'in_review' || body.status === 'approved' || body.status === 'rejected') {
        updateData.reviewed_by = user?.id;
        updateData.reviewed_at = new Date().toISOString();
      }
    }
    
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.productId !== undefined) updateData.product_id = body.productId;
    if (body.suggestedTitle !== undefined) updateData.suggested_title = body.suggestedTitle;
    if (body.suggestedPrice !== undefined) updateData.suggested_price = body.suggestedPrice;
    if (body.suggestedDescription !== undefined) updateData.suggested_description = body.suggestedDescription;
    if (body.suggestedProductType !== undefined) updateData.suggested_product_type = body.suggestedProductType;
    if (body.suggestedTags !== undefined) updateData.suggested_tags = body.suggestedTags;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('product_inquiries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inquiry:', error);
      return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Inquiry updated successfully',
      inquiry: data 
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/product-inquiries/[id] - Delete inquiry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('product_inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inquiry:', error);
      return NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Inquiry deleted successfully'
    });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
