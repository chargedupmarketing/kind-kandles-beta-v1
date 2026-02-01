import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/admin/event-forms/[id] - Get single form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: form, error } = await supabase
      .from('event_forms')
      .select('*, event:events(id, title), submissions:event_form_submissions(count)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching form:', error);
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Get form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/event-forms/[id] - Update form
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const body = await request.json();

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.formType !== undefined) updateData.form_type = body.formType;
    if (body.formFields !== undefined) updateData.form_fields = body.formFields;
    if (body.headerText !== undefined) updateData.header_text = body.headerText;
    if (body.footerText !== undefined) updateData.footer_text = body.footerText;
    if (body.submitButtonText !== undefined) updateData.submit_button_text = body.submitButtonText;
    if (body.successMessage !== undefined) updateData.success_message = body.successMessage;
    if (body.primaryColor !== undefined) updateData.primary_color = body.primaryColor;
    if (body.logoUrl !== undefined) updateData.logo_url = body.logoUrl;
    if (body.backgroundImageUrl !== undefined) updateData.background_image_url = body.backgroundImageUrl;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.requireEventCode !== undefined) updateData.require_event_code = body.requireEventCode;
    if (body.allowMultipleSubmissions !== undefined) updateData.allow_multiple_submissions = body.allowMultipleSubmissions;
    if (body.collectEmail !== undefined) updateData.collect_email = body.collectEmail;
    if (body.sendConfirmationEmail !== undefined) updateData.send_confirmation_email = body.sendConfirmationEmail;
    if (body.eventId !== undefined) updateData.event_id = body.eventId;
    if (body.qrCodeUrl !== undefined) updateData.qr_code_url = body.qrCodeUrl;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event_forms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating form:', error);
      return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Form updated successfully',
      form: data 
    });
  } catch (error) {
    console.error('Update form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/event-forms/[id] - Delete form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from('event_forms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting form:', error);
      return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Form deleted successfully'
    });
  } catch (error) {
    console.error('Delete form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
