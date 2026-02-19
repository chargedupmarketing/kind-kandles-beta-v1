import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Resend } from 'resend';
import type { Event, EventOccurrence, PriceTier } from '@/lib/types';
import { notifyAdminsNewEventBooking } from '@/lib/notifications';

const resend = new Resend(process.env.RESEND_API_KEY);

// Calculate price based on event pricing model
function calculatePrice(
  event: Event,
  numParticipants: number
): number | null {
  if (event.pricing_model === 'custom_quote') {
    return null;
  }

  if (event.pricing_model === 'per_person' && event.base_price) {
    return event.base_price * numParticipants;
  }

  if (event.pricing_model === 'flat_rate' && event.base_price) {
    return event.base_price;
  }

  if (event.pricing_model === 'tiered' && event.price_tiers) {
    const tier = event.price_tiers.find(
      (t: PriceTier) => numParticipants >= t.min && numParticipants <= t.max
    );
    return tier ? tier.price : null;
  }

  return null;
}

// POST - Submit event booking request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_id,
      occurrence_id,
      customer_name,
      customer_email,
      customer_phone,
      num_participants,
      location_preference,
      requested_address,
      requested_date,
      requested_time,
      special_requests,
    } = body;

    // Validate required fields
    if (!event_id || !customer_name || !customer_email || !num_participants) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get IP address and user agent
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'Unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const serverClient = createServerClient();

    // Fetch event details
    const { data: event, error: eventError } = await serverClient
      .from('events')
      .select('*')
      .eq('id', event_id)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found or inactive' },
        { status: 404 }
      );
    }

    // Validate participant count
    if (num_participants < event.min_participants) {
      return NextResponse.json(
        {
          error: `Minimum ${event.min_participants} participants required`,
        },
        { status: 400 }
      );
    }

    if (num_participants > event.max_participants) {
      return NextResponse.json(
        {
          error: `Maximum ${event.max_participants} participants allowed`,
        },
        { status: 400 }
      );
    }

    // If occurrence_id provided, validate availability
    let occurrence: EventOccurrence | null = null;
    if (occurrence_id) {
      const { data: occData, error: occError } = await serverClient
        .from('event_occurrences')
        .select('*')
        .eq('id', occurrence_id)
        .eq('event_id', event_id)
        .single();

      if (occError || !occData) {
        return NextResponse.json(
          { error: 'Occurrence not found' },
          { status: 404 }
        );
      }

      occurrence = occData;

      // Check if occurrence is available
      if (occData.status !== 'available') {
        return NextResponse.json(
          { error: 'This occurrence is no longer available' },
          { status: 400 }
        );
      }

      // Check capacity
      const maxCapacity = occData.max_participants || event.max_participants;
      if (occData.current_bookings + num_participants > maxCapacity) {
        return NextResponse.json(
          { error: 'Not enough spots available for this occurrence' },
          { status: 400 }
        );
      }
    }

    // Calculate price
    const totalPrice = calculatePrice(event, num_participants);

    // Insert booking
    const { data: booking, error: bookingError } = await serverClient
      .from('event_bookings')
      .insert({
        event_id,
        occurrence_id: occurrence_id || null,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        num_participants,
        location_preference: location_preference || null,
        requested_address: requested_address || null,
        requested_date: requested_date || null,
        requested_time: requested_time || null,
        special_requests: special_requests || null,
        total_price: totalPrice,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // If booking for specific occurrence, increment current_bookings
    if (occurrence_id) {
      await serverClient
        .from('event_occurrences')
        .update({
          current_bookings: (occurrence?.current_bookings || 0) + num_participants,
        })
        .eq('id', occurrence_id);

      // Check if occurrence is now full
      const maxCapacity = occurrence?.max_participants || event.max_participants;
      if ((occurrence?.current_bookings || 0) + num_participants >= maxCapacity) {
        await serverClient
          .from('event_occurrences')
          .update({ status: 'full' })
          .eq('id', occurrence_id);
      }
    }

    // Send email notifications
    try {
      // Format occurrence date/time if available
      let eventDateTime = 'Custom date requested';
      if (occurrence) {
        const startDate = new Date(occurrence.start_datetime);
        eventDateTime = startDate.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        });
      } else if (requested_date) {
        eventDateTime = `Requested: ${requested_date}${requested_time ? ` at ${requested_time}` : ''}`;
      }

      // Format location
      let locationInfo = 'To be determined';
      if (occurrence?.location_address) {
        locationInfo = occurrence.location_address;
      } else if (location_preference === 'mobile' && requested_address) {
        locationInfo = `Mobile event at: ${requested_address}`;
      } else if (location_preference === 'fixed' && event.fixed_location_address) {
        locationInfo = event.fixed_location_address;
      }

      // Admin notification email
      const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .field { margin-bottom: 20px; }
              .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
              .value { margin-top: 5px; padding: 12px; background: white; border-left: 3px solid #14b8a6; border-radius: 4px; }
              .price-box { background: #dcfce7; border: 2px solid #16a34a; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .price { font-size: 24px; font-weight: bold; color: #16a34a; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
              .meta { font-size: 11px; color: #9ca3af; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🎨 New Event Booking!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Kind Kandles & Boutique</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Event</div>
                  <div class="value">${event.title}</div>
                </div>

                <div class="field">
                  <div class="label">Customer</div>
                  <div class="value">${customer_name}</div>
                </div>
                
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value">
                    <a href="mailto:${customer_email}" style="color: #14b8a6; text-decoration: none;">${customer_email}</a>
                  </div>
                </div>
                
                ${customer_phone ? `
                <div class="field">
                  <div class="label">Phone</div>
                  <div class="value">
                    <a href="tel:${customer_phone}" style="color: #14b8a6; text-decoration: none;">${customer_phone}</a>
                  </div>
                </div>
                ` : ''}
                
                <div class="field">
                  <div class="label">Number of Participants</div>
                  <div class="value">${num_participants}</div>
                </div>

                <div class="field">
                  <div class="label">Date & Time</div>
                  <div class="value">${eventDateTime}</div>
                </div>

                <div class="field">
                  <div class="label">Location</div>
                  <div class="value">${locationInfo}</div>
                </div>
                
                ${special_requests ? `
                <div class="field">
                  <div class="label">Special Requests</div>
                  <div class="value">${special_requests}</div>
                </div>
                ` : ''}

                ${totalPrice !== null ? `
                <div class="price-box">
                  <div class="label" style="color: #16a34a;">Total Price</div>
                  <div class="price">$${totalPrice.toFixed(2)}</div>
                </div>
                ` : `
                <div class="price-box" style="background: #fef3c7; border-color: #f59e0b;">
                  <div class="label" style="color: #f59e0b;">Pricing</div>
                  <div style="font-size: 16px; font-weight: bold; color: #f59e0b;">Custom Quote Required</div>
                </div>
                `}

                <div class="meta">
                  <strong>Booking ID:</strong> ${booking.id}<br>
                  <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
                  <strong>Status:</strong> Pending Confirmation
                </div>
              </div>
              <div class="footer">
                <p>View this booking in your <a href="https://www.kindkandlesboutique.com/restricted/admin" style="color: #14b8a6;">admin dashboard</a></p>
                <p style="margin-top: 10px;">This is an automated notification from Kind Kandles & Boutique</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Customer confirmation email
      const customerEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .field { margin-bottom: 20px; }
              .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
              .value { margin-top: 5px; padding: 12px; background: white; border-left: 3px solid #14b8a6; border-radius: 4px; }
              .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">✨ Booking Request Received!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your interest</p>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hi ${customer_name.split(' ')[0]},
                </p>
                <p style="margin-bottom: 20px;">
                  Thank you for your interest in <strong>${event.title}</strong>! We've received your booking request and will review it shortly.
                </p>

                <div class="info-box">
                  <strong>📋 What happens next?</strong><br>
                  Our team will review your request and confirm availability. You'll receive a confirmation email within 24 hours with final details and payment instructions.
                </div>

                <div class="field">
                  <div class="label">Your Booking Details</div>
                </div>

                <div class="field">
                  <div class="label">Event</div>
                  <div class="value">${event.title}</div>
                </div>

                <div class="field">
                  <div class="label">Participants</div>
                  <div class="value">${num_participants} ${num_participants === 1 ? 'person' : 'people'}</div>
                </div>

                <div class="field">
                  <div class="label">Date & Time</div>
                  <div class="value">${eventDateTime}</div>
                </div>

                <div class="field">
                  <div class="label">Location</div>
                  <div class="value">${locationInfo}</div>
                </div>

                ${totalPrice !== null ? `
                <div class="field">
                  <div class="label">Estimated Price</div>
                  <div class="value" style="font-size: 18px; font-weight: bold; color: #16a34a;">$${totalPrice.toFixed(2)}</div>
                </div>
                ` : ''}

                <p style="margin-top: 30px;">
                  If you have any questions or need to make changes, please don't hesitate to contact us at 
                  <a href="mailto:k@kindkandlesboutique.com" style="color: #14b8a6;">k@kindkandlesboutique.com</a>.
                </p>

                <p style="margin-top: 20px;">
                  We're excited to create this experience with you! ✨
                </p>

                <p style="margin-top: 20px;">
                  Warm regards,<br>
                  <strong>The Kind Kandles Team</strong>
                </p>
              </div>
              <div class="footer">
                <p>Kind Kandles & Boutique<br>
                Handcrafted with love and kindness</p>
                <p style="margin-top: 10px;">
                  <a href="https://www.kindkandlesboutique.com" style="color: #14b8a6;">Visit our website</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Send customer confirmation email directly (not via notification service)
      await resend.emails.send({
        from: 'Kind Kandles Events <noreply@kindkandlesboutique.com>',
        to: customer_email,
        subject: `Booking Request Received: ${event.title}`,
        html: customerEmailHtml,
      });

      console.log('✅ Event booking customer confirmation email sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending customer confirmation email:', emailError);
      // Don't fail the request if email fails - booking is still saved
    }

    // Send admin notifications via the notification service (respects preferences)
    notifyAdminsNewEventBooking({
      id: booking.id,
      event_name: event.title,
      customer_name,
      customer_email,
      num_participants,
    }).catch(err => {
      console.error('Failed to send admin notification for event booking:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Booking request submitted successfully',
      booking: {
        id: booking.id,
        status: booking.status,
        total_price: totalPrice,
      },
    });
  } catch (error) {
    console.error('Event booking submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
