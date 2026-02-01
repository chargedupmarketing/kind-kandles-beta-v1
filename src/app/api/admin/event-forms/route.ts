import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/admin/event-forms - List all forms
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const formType = searchParams.get('type');
    const isActive = searchParams.get('active');

    let query = supabase
      .from('event_forms')
      .select('*, event:events(id, title)')
      .order('created_at', { ascending: false });

    if (formType && formType !== 'all') {
      query = query.eq('form_type', formType);
    }

    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: forms, error } = await query;

    if (error) {
      console.error('Error fetching event forms:', error);
      return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
    }

    return NextResponse.json({ forms: forms || [] });
  } catch (error) {
    console.error('Event forms API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/event-forms - Create new form
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    const {
      title,
      slug,
      description,
      formType,
      formFields,
      headerText,
      footerText,
      submitButtonText,
      successMessage,
      primaryColor,
      logoUrl,
      backgroundImageUrl,
      isActive,
      requireEventCode,
      allowMultipleSubmissions,
      collectEmail,
      sendConfirmationEmail,
      eventId,
    } = body;

    // Validate required fields
    if (!title || !slug || !formType || !formFields) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, formType, formFields' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { data: form, error } = await supabase
      .from('event_forms')
      .insert({
        title,
        slug,
        description,
        form_type: formType,
        form_fields: formFields,
        header_text: headerText,
        footer_text: footerText,
        submit_button_text: submitButtonText || 'Submit',
        success_message: successMessage || 'Thank you for your submission!',
        primary_color: primaryColor || '#ec4899',
        logo_url: logoUrl,
        background_image_url: backgroundImageUrl,
        is_active: isActive !== undefined ? isActive : true,
        require_event_code: requireEventCode || false,
        allow_multiple_submissions: allowMultipleSubmissions || false,
        collect_email: collectEmail !== undefined ? collectEmail : true,
        send_confirmation_email: sendConfirmationEmail || false,
        event_id: eventId || null,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event form:', error);
      return NextResponse.json(
        { error: 'Failed to create form', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      form,
    });

  } catch (error) {
    console.error('Error in POST /api/admin/event-forms:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
