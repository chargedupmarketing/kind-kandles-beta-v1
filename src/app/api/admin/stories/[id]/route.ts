import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { notifyCustomerStoryApproved } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

function dbRowToStory(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    email: row.email,
    content: row.content,
    submittedAt: row.created_at,
    status: row.status,
    isStarred: row.is_starred === true,
    category: row.category,
    publishedAt: row.published_at ? new Date(row.published_at as string) : undefined,
    adminNotes: row.admin_notes,
  };
}

// GET /api/admin/stories/[id] - Get single story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: row, error } = await supabase
      .from('customer_stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json({ story: dbRowToStory(row) });
  } catch (error) {
    console.error('Get story error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/stories/[id] - Update story (status, star, edit content, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isStarred !== undefined) updateData.is_starred = body.isStarred;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.author !== undefined) updateData.author = body.author;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.adminNotes !== undefined) updateData.admin_notes = body.adminNotes;

    if (body.status === 'published') {
      const { data: existing } = await supabase.from('customer_stories').select('published_at').eq('id', id).single();
      if (existing && !(existing as Record<string, unknown>).published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Get the current story to check status change
    const { data: currentStory } = await supabase
      .from('customer_stories')
      .select('status, title, author, email')
      .eq('id', id)
      .single();

    const { data: row, error } = await supabase
      .from('customer_stories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating story:', error);
      return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
    }

    // Send notification if story was just approved/published
    const wasNotPublished = currentStory && currentStory.status !== 'published' && currentStory.status !== 'approved';
    const isNowPublished = body.status === 'published' || body.status === 'approved';
    
    if (wasNotPublished && isNowPublished && row) {
      const storyData = row as Record<string, unknown>;
      notifyCustomerStoryApproved({
        id: id,
        title: (storyData.title as string) || 'Your Story',
        author: (storyData.author as string) || 'Author',
        email: (storyData.email as string) || '',
      }).catch(err => {
        console.error('Failed to send story approved notification:', err);
      });
    }

    return NextResponse.json({ story: dbRowToStory(row as Record<string, unknown>) });
  } catch (error) {
    console.error('Update story error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/stories/[id] - Delete story
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase.from('customer_stories').delete().eq('id', id);

    if (error) {
      console.error('Error deleting story:', error);
      return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
