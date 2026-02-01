import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/event-forms/[slug]/submit - Submit form response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createServerClient();
    const body = await request.json();

    const { submissionData, eventCode } = body;

    if (!submissionData) {
      return NextResponse.json(
        { error: 'Submission data is required' },
        { status: 400 }
      );
    }

    // Get the form
    const { data: form, error: formError } = await supabase
      .from('event_forms')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
    }

    // Check if event code is required
    if (form.require_event_code && !eventCode) {
      return NextResponse.json(
        { error: 'Event code is required for this form' },
        { status: 400 }
      );
    }

    // Get user email from submission data if available
    const userEmail = submissionData.email || null;

    // Check for duplicate submissions if not allowed
    if (!form.allow_multiple_submissions && userEmail) {
      const { data: existingSubmission } = await supabase
        .from('event_form_submissions')
        .select('id')
        .eq('form_id', form.id)
        .eq('user_email', userEmail)
        .single();

      if (existingSubmission) {
        return NextResponse.json(
          { error: 'You have already submitted this form' },
          { status: 400 }
        );
      }
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('event_form_submissions')
      .insert({
        form_id: form.id,
        submission_data: submissionData,
        user_email: userEmail,
        event_code: eventCode || null,
        event_id: form.event_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'submitted',
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to submit form', details: submissionError.message },
        { status: 500 }
      );
    }

    // Increment submission count
    await supabase
      .from('event_forms')
      .update({ submission_count: (form.submission_count || 0) + 1 })
      .eq('id', form.id);

    return NextResponse.json({
      success: true,
      message: form.success_message || 'Thank you for your submission!',
      submission,
    });

  } catch (error) {
    console.error('Error in POST /api/event-forms/[slug]/submit:', error);
    
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
