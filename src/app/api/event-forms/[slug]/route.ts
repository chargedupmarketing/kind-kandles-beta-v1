import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/event-forms/[slug] - Get public form by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();

    const { data: form, error } = await supabase
      .from('event_forms')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching form:', error);
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Increment view count
    await supabase
      .from('event_forms')
      .update({ view_count: (form.view_count || 0) + 1 })
      .eq('id', form.id);

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
