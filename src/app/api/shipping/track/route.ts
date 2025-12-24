import { NextRequest, NextResponse } from 'next/server';
import { getTrackingInfo, isPirateShipConfigured } from '@/lib/pirateship';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/shipping/track - Get tracking information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tracking_number = searchParams.get('tracking_number');
    const carrier = searchParams.get('carrier');
    const shipment_id = searchParams.get('shipment_id');

    // If shipment_id provided, get tracking info from database first
    if (shipment_id && isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data: shipment } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipment_id)
        .single();

      if (shipment) {
        // If we have cached tracking history, return it
        if (shipment.tracking_history && shipment.tracking_history.length > 0) {
          return NextResponse.json({
            success: true,
            tracking_number: shipment.tracking_number,
            carrier: shipment.carrier,
            status: shipment.status,
            tracking_history: shipment.tracking_history,
            estimated_delivery: shipment.estimated_delivery,
            delivered_date: shipment.delivered_date,
          });
        }

        // Otherwise, use the shipment's tracking number and carrier
        if (shipment.tracking_number && shipment.carrier) {
          const trackingInfo = await fetchAndCacheTracking(
            shipment.carrier,
            shipment.tracking_number,
            shipment_id
          );
          return NextResponse.json(trackingInfo);
        }
      }
    }

    // Direct tracking lookup
    if (!tracking_number || !carrier) {
      return NextResponse.json({ 
        error: 'Tracking number and carrier are required' 
      }, { status: 400 });
    }

    if (!isPirateShipConfigured()) {
      return NextResponse.json({ 
        error: 'Shipping service not configured' 
      }, { status: 400 });
    }

    const trackingInfo = await getTrackingInfo(carrier, tracking_number);

    return NextResponse.json({
      success: true,
      tracking_number: trackingInfo.tracking_number,
      carrier: trackingInfo.carrier,
      status: trackingInfo.status,
      status_details: trackingInfo.status_details,
      status_date: trackingInfo.status_date,
      location: trackingInfo.location,
      eta: trackingInfo.eta,
      tracking_history: trackingInfo.tracking_history.map(event => ({
        status: event.status,
        status_details: event.status_details,
        status_date: event.status_date,
        location: event.location,
      })),
    });
  } catch (error) {
    console.error('Error getting tracking info:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get tracking info' 
    }, { status: 500 });
  }
}

// Helper to fetch and cache tracking info
async function fetchAndCacheTracking(
  carrier: string,
  trackingNumber: string,
  shipmentId: string
) {
    if (!isPirateShipConfigured()) {
      return {
        success: false,
        error: 'Shipping service not configured',
      };
    }

  try {
    const trackingInfo = await getTrackingInfo(carrier, trackingNumber);

    // Update database with latest tracking info
    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      
      const updateData: Record<string, unknown> = {
        status: trackingInfo.status.toLowerCase(),
        tracking_history: trackingInfo.tracking_history,
        updated_at: new Date().toISOString(),
      };

      if (trackingInfo.eta) {
        updateData.estimated_delivery = trackingInfo.eta;
      }

      if (trackingInfo.status === 'DELIVERED') {
        updateData.delivered_date = trackingInfo.status_date;
      }

      await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);
    }

    return {
      success: true,
      tracking_number: trackingInfo.tracking_number,
      carrier: trackingInfo.carrier,
      status: trackingInfo.status,
      status_details: trackingInfo.status_details,
      status_date: trackingInfo.status_date,
      location: trackingInfo.location,
      eta: trackingInfo.eta,
      tracking_history: trackingInfo.tracking_history.map(event => ({
        status: event.status,
        status_details: event.status_details,
        status_date: event.status_date,
        location: event.location,
      })),
    };
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tracking',
    };
  }
}

