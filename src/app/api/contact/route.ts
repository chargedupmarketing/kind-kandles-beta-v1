import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { notifyAdminsNewContact } from '@/lib/notifications';

// POST - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, subject, message } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const fullName = `${firstName} ${lastName}`;

    // Create Supabase client (allows anonymous inserts)
    const serverClient = createServerClient();

    // Insert into database
    const { data: submission, error: dbError } = await serverClient
      .from('contact_submissions')
      .insert({
        name: fullName,
        email,
        phone: phone || null,
        subject,
        message,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving contact submission:', dbError);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Send notification to admins via the notification service (respects preferences)
    notifyAdminsNewContact({
      id: submission.id,
      name: fullName,
      email,
      subject,
      message,
    }).catch(err => {
      console.error('Failed to send admin notification for contact form:', err);
      // Don't fail the request if notification fails - submission is still saved
    });

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      submissionId: submission.id,
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch all contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const serverClient = createServerClient();

    // Check if table exists first by trying to count
    const { count, error: countError } = await serverClient
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true });

    // If table doesn't exist, return empty array
    if (countError && countError.code === 'PGRST205') {
      console.warn('⚠️ contact_submissions table does not exist yet');
      return NextResponse.json({ 
        submissions: [],
        tableExists: false,
        message: 'Table not created yet. Please run the migration.'
      });
    }

    const { data: submissions, error } = await serverClient
      .from('contact_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      submissions: submissions || [],
      tableExists: true 
    });

  } catch (error) {
    console.error('Error in GET /api/contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

