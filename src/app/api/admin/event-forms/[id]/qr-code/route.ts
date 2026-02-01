import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/admin/event-forms/[id]/qr-code - Generate QR code for form
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // Get the form
    const { data: form, error: formError } = await supabase
      .from('event_forms')
      .select('slug')
      .eq('id', id)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Generate QR code URL using a free QR code API
    const formUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kindkandlesboutique.com'}/forms/${form.slug}`;
    
    // Using QR Server API (free, no API key required)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(formUrl)}&format=png`;

    // Update form with QR code URL
    const { data: updatedForm, error: updateError } = await supabase
      .from('event_forms')
      .update({ qr_code_url: qrCodeUrl })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating form with QR code:', updateError);
      return NextResponse.json({ error: 'Failed to save QR code' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      qrCodeUrl,
      formUrl,
      form: updatedForm,
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/event-forms/[id]/qr-code - Get existing QR code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: form, error } = await supabase
      .from('event_forms')
      .select('slug, qr_code_url')
      .eq('id', id)
      .single();

    if (error || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const formUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kindkandlesboutique.com'}/forms/${form.slug}`;

    return NextResponse.json({
      qrCodeUrl: form.qr_code_url,
      formUrl,
    });

  } catch (error) {
    console.error('Error getting QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
