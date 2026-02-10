import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/stories - Public: list approved/published stories for the Write Your Story page
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: rows, error } = await supabase
      .from('customer_stories')
      .select('id, title, author, content, category, is_starred, created_at, published_at')
      .in('status', ['approved', 'published'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public stories:', error);
      return NextResponse.json({ stories: [] });
    }

    const stories = (rows || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      content: row.content,
      category: row.category,
      isStarred: row.is_starred === true,
      submittedAt: row.created_at,
      publishedAt: row.published_at || row.created_at,
    }));
    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Public stories fetch error:', error);
    return NextResponse.json({ stories: [] });
  }
}

// POST /api/stories - Public submission from Write Your Story form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      storyType,
      products,
      storyTitle,
      story,
      canFeature,
      newsletter,
    } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !storyType || !storyTitle?.trim() || !story?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, storyType, storyTitle, story' },
        { status: 400 }
      );
    }

    if (story.trim().length < 100) {
      return NextResponse.json(
        { error: 'Story must be at least 100 characters' },
        { status: 400 }
      );
    }

    const category = mapStoryTypeToCategory(storyType);
    const author = `${firstName.trim()} ${lastName.trim()}`;
    const adminNotes = products?.trim()
      ? `Featured products: ${products.trim()}${canFeature ? ' | Can feature.' : ''}${newsletter ? ' | Newsletter opt-in.' : ''}`
      : `${canFeature ? 'Can feature.' : ''}${newsletter ? ' Newsletter opt-in.' : ''}`.trim() || undefined;

    const supabase = createServerClient();
    const { data: row, error } = await supabase
      .from('customer_stories')
      .insert({
        title: storyTitle.trim(),
        author,
        email: email.trim(),
        content: story.trim(),
        products: products?.trim() || null,
        status: 'pending',
        is_starred: false,
        category,
        admin_notes: adminNotes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving story submission:', error);
      return NextResponse.json(
        { error: 'Failed to save your story. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for sharing your story!',
      id: row.id,
    });
  } catch (error) {
    console.error('Story submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function mapStoryTypeToCategory(storyType: string): string {
  switch (storyType) {
    case 'love-story':
      return 'kindness-story';
    case 'transformation':
      return 'life-moment';
    case 'community':
      return 'kindness-story';
    default:
      return 'other';
  }
}
