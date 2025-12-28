import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    // Parse CSV header
    const header = parseCSVLine(lines[0]);
    
    // Find column indices
    const orderNumberIndex = findColumnIndex(header, ['Order Number', 'Order ID', 'order_number', 'order_id']);
    const trackingNumberIndex = findColumnIndex(header, ['Tracking Number', 'Tracking', 'tracking_number', 'tracking']);
    const trackingUrlIndex = findColumnIndex(header, ['Tracking URL', 'Tracking Link', 'tracking_url', 'tracking_link']);
    const carrierIndex = findColumnIndex(header, ['Carrier', 'Shipping Carrier', 'carrier']);

    if (orderNumberIndex === -1 || trackingNumberIndex === -1) {
      return NextResponse.json({ 
        error: 'CSV must contain "Order Number" and "Tracking Number" columns' 
      }, { status: 400 });
    }

    const supabase = createServerClient();
    const updates: any[] = [];
    const errors: string[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVLine(lines[i]);
        
        if (row.length < 2) continue; // Skip empty rows

        const orderNumber = row[orderNumberIndex]?.trim();
        const trackingNumber = row[trackingNumberIndex]?.trim();
        const trackingUrl = trackingUrlIndex !== -1 ? row[trackingUrlIndex]?.trim() : '';
        const carrier = carrierIndex !== -1 ? row[carrierIndex]?.trim() : '';

        if (!orderNumber || !trackingNumber) {
          errors.push(`Row ${i + 1}: Missing order number or tracking number`);
          continue;
        }

        // Find order by order_number or id
        const { data: order, error: findError } = await supabase
          .from('orders')
          .select('id, order_number')
          .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`)
          .single();

        if (findError || !order) {
          errors.push(`Row ${i + 1}: Order "${orderNumber}" not found`);
          continue;
        }

        // Update order with tracking info
        const updateData: any = {
          tracking_number: trackingNumber,
          status: 'shipped',
          shipped_at: new Date().toISOString(),
        };

        if (trackingUrl) {
          updateData.tracking_url = trackingUrl;
        }

        if (carrier) {
          updateData.carrier = carrier;
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', order.id);

        if (updateError) {
          errors.push(`Row ${i + 1}: Failed to update order "${orderNumber}"`);
          console.error('Update error:', updateError);
        } else {
          updates.push({
            orderNumber: order.order_number || order.id,
            trackingNumber,
          });
        }
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        errors.push(`Row ${i + 1}: Processing error`);
      }
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      errors: errors.length > 0 ? errors : undefined,
      details: updates,
    });
  } catch (error) {
    console.error('Error importing tracking numbers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

// Helper function to find column index by multiple possible names
function findColumnIndex(header: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = header.findIndex(col => 
      col.toLowerCase().trim() === name.toLowerCase()
    );
    if (index !== -1) return index;
  }
  return -1;
}

