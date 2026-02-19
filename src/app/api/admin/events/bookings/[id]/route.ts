import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Resend } from 'resend';
import { notifyCustomerEventConfirmed } from '@/lib/notifications';

const resend = new Resend(process.env.RESEND_API_KEY);

// PATCH - Update booking status, add notes, confirm/cancel - Admin only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      payment_status,
      admin_notes,
      send_confirmation_email,
    } = body;

    const serverClient = createServerClient();

    // Fetch current booking with event details
    const { data: currentBooking, error: fetchError } = await serverClient
      .from('event_bookings')
      .select(`
        *,
        event:events(*),
        occurrence:event_occurrences(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    // If confirming booking, set confirmation timestamp
    if (status === 'confirmed' && currentBooking.status !== 'confirmed') {
      updateData.confirmation_sent_at = new Date().toISOString();
    }

    // Update booking
    const { data: booking, error: updateError } = await serverClient
      .from('event_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking', details: updateError },
        { status: 500 }
      );
    }

    // If status changed to cancelled and there's an occurrence, decrement bookings
    if (
      status === 'cancelled' &&
      currentBooking.status !== 'cancelled' &&
      currentBooking.occurrence_id
    ) {
      const { data: occurrence } = await serverClient
        .from('event_occurrences')
        .select('current_bookings, max_participants')
        .eq('id', currentBooking.occurrence_id)
        .single();

      if (occurrence) {
        const newBookingCount = Math.max(
          0,
          occurrence.current_bookings - currentBooking.num_participants
        );

        await serverClient
          .from('event_occurrences')
          .update({
            current_bookings: newBookingCount,
            status: 'available', // Reopen if it was full
          })
          .eq('id', currentBooking.occurrence_id);
      }
    }

    // Send confirmation email if requested
    if (send_confirmation_email && status === 'confirmed') {
      try {
        const event = currentBooking.event;
        const occurrence = currentBooking.occurrence;

        // Format occurrence date/time if available
        let eventDateTime = 'Custom date as discussed';
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
        } else if (currentBooking.requested_date) {
          eventDateTime = `${currentBooking.requested_date}${currentBooking.requested_time ? ` at ${currentBooking.requested_time}` : ''}`;
        }

        // Format location
        let locationInfo = 'To be confirmed';
        if (occurrence?.location_address) {
          locationInfo = occurrence.location_address;
        } else if (
          currentBooking.location_preference === 'mobile' &&
          currentBooking.requested_address
        ) {
          locationInfo = `Mobile event at: ${currentBooking.requested_address}`;
        } else if (
          currentBooking.location_preference === 'fixed' &&
          event.fixed_location_address
        ) {
          locationInfo = event.fixed_location_address;
        }

        const confirmationEmailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .field { margin-bottom: 20px; }
                .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                .value { margin-top: 5px; padding: 12px; background: white; border-left: 3px solid #16a34a; border-radius: 4px; }
                .success-box { background: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Your event is all set</p>
                </div>
                <div class="content">
                  <div class="success-box">
                    <h2 style="margin: 0 0 10px 0; color: #16a34a;">🎉 We're Excited to See You!</h2>
                    <p style="margin: 0; color: #15803d;">Your booking has been confirmed and we're looking forward to creating this experience with you.</p>
                  </div>

                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Hi ${currentBooking.customer_name.split(' ')[0]},
                  </p>
                  <p style="margin-bottom: 20px;">
                    Great news! Your booking for <strong>${event.title}</strong> has been confirmed.
                  </p>

                  <div class="field">
                    <div class="label">Event</div>
                    <div class="value">${event.title}</div>
                  </div>

                  <div class="field">
                    <div class="label">Date & Time</div>
                    <div class="value">${eventDateTime}</div>
                  </div>

                  <div class="field">
                    <div class="label">Location</div>
                    <div class="value">${locationInfo}</div>
                  </div>

                  <div class="field">
                    <div class="label">Participants</div>
                    <div class="value">${currentBooking.num_participants} ${currentBooking.num_participants === 1 ? 'person' : 'people'}</div>
                  </div>

                  ${currentBooking.total_price ? `
                  <div class="field">
                    <div class="label">Total Price</div>
                    <div class="value" style="font-size: 20px; font-weight: bold; color: #16a34a;">$${currentBooking.total_price.toFixed(2)}</div>
                  </div>
                  ` : ''}

                  ${event.includes && event.includes.length > 0 ? `
                  <div class="field">
                    <div class="label">What's Included</div>
                    <div class="value">
                      <ul style="margin: 0; padding-left: 20px;">
                        ${event.includes.map((item: string) => `<li>${item}</li>`).join('')}
                      </ul>
                    </div>
                  </div>
                  ` : ''}

                  ${event.requirements && event.requirements.length > 0 ? `
                  <div class="field">
                    <div class="label">Please Note</div>
                    <div class="value">
                      <ul style="margin: 0; padding-left: 20px;">
                        ${event.requirements.map((item: string) => `<li>${item}</li>`).join('')}
                      </ul>
                    </div>
                  </div>
                  ` : ''}

                  <p style="margin-top: 30px;">
                    If you have any questions or need to make changes, please contact us at 
                    <a href="mailto:k@kindkandlesboutique.com" style="color: #16a34a;">k@kindkandlesboutique.com</a> 
                    or call us at your convenience.
                  </p>

                  <p style="margin-top: 20px;">
                    We can't wait to see you! ✨
                  </p>

                  <p style="margin-top: 20px;">
                    Warm regards,<br>
                    <strong>The Kind Kandles Team</strong>
                  </p>
                </div>
                <div class="footer">
                  <p>Kind Kandles & Boutique<br>
                  Handcrafted with love and kindness</p>
                </div>
              </div>
            </body>
          </html>
        `;

        await resend.emails.send({
          from: 'Kind Kandles Events <noreply@kindkandlesboutique.com>',
          to: currentBooking.customer_email,
          subject: `Booking Confirmed: ${event.title}`,
          html: confirmationEmailHtml,
        });

        // Also send via notification service for logging and potential SMS
        notifyCustomerEventConfirmed({
          id: currentBooking.id,
          event_name: event.title,
          event_date: eventDateTime,
          customer_name: currentBooking.customer_name,
          customer_email: currentBooking.customer_email,
          customer_phone: currentBooking.customer_phone,
        }).catch(err => {
          console.error('Failed to log event confirmation notification:', err);
        });

        console.log('✅ Booking confirmation email sent successfully');
      } catch (emailError) {
        console.error('❌ Error sending confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove booking - Admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serverClient = createServerClient();

    // Fetch booking to get occurrence info
    const { data: booking } = await serverClient
      .from('event_bookings')
      .select('occurrence_id, num_participants, status')
      .eq('id', id)
      .single();

    // If booking was confirmed and had an occurrence, decrement count
    if (
      booking &&
      booking.status === 'confirmed' &&
      booking.occurrence_id
    ) {
      const { data: occurrence } = await serverClient
        .from('event_occurrences')
        .select('current_bookings')
        .eq('id', booking.occurrence_id)
        .single();

      if (occurrence) {
        const newBookingCount = Math.max(
          0,
          occurrence.current_bookings - booking.num_participants
        );

        await serverClient
          .from('event_occurrences')
          .update({
            current_bookings: newBookingCount,
            status: 'available',
          })
          .eq('id', booking.occurrence_id);
      }
    }

    // Delete booking
    const { error } = await serverClient
      .from('event_bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json(
        { error: 'Failed to delete booking', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    console.error('Booking deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
