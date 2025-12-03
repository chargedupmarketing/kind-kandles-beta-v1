import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/lib/supabase';

// GET /api/collections - List all collections
export async function GET() {
  try {
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
    }

    return NextResponse.json({ collections: collections || [] });
  } catch (error) {
    console.error('Collections API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collections - Create a new collection (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const handle = body.handle || body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data: collection, error } = await serverClient
      .from('collections')
      .insert({
        title: body.title,
        handle,
        description: body.description || null,
        image_url: body.image_url || null,
        parent_id: body.parent_id || null,
        position: body.position || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
    }

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

