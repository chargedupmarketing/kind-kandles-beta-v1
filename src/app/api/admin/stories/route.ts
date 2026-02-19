import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/admin/stories - List all story submissions
export async function GET(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-key') {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Admin cannot load stories.');
      return NextResponse.json(
        { error: 'Server is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local' },
        { status: 503 }
      );
    }

    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const search = searchParams.get('search');

    let query = supabase
      .from('customer_stories')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter && filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching stories:', error);
      // Table may not exist yet (migration not run)
      if (error.code === 'PGRST205' || (error.message && String(error.message).includes('does not exist'))) {
        return NextResponse.json({ stories: [] });
      }
      const message = error.message || 'Failed to fetch stories';
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    let stories = (rows || []).map((row: Record<string, unknown>) => dbRowToStory(row));

    if (search?.trim()) {
      const term = search.toLowerCase();
      stories = stories.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.author.toLowerCase().includes(term) ||
          s.content.toLowerCase().includes(term) ||
          s.category.toLowerCase().includes(term)
      );
    }

    return NextResponse.json(
      { stories },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Admin stories API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface AdminStoryResponse {
  id: string;
  title: string;
  author: string;
  email: string;
  content: string;
  submittedAt: string;
  status: string;
  isStarred: boolean;
  category: string;
  publishedAt?: string;
  adminNotes?: string;
}

function dbRowToStory(row: Record<string, unknown>): AdminStoryResponse {
  return {
    id: String(row.id),
    title: String(row.title),
    author: String(row.author),
    email: String(row.email ?? ''),
    content: String(row.content),
    submittedAt: String(row.created_at),
    status: String(row.status ?? 'pending'),
    isStarred: row.is_starred === true,
    category: String(row.category ?? 'other'),
    publishedAt: row.published_at ? String(row.published_at) : undefined,
    adminNotes: row.admin_notes != null ? String(row.admin_notes) : undefined,
  };
}
