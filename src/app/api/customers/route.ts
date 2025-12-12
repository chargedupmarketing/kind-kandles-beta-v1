import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { decrypt, decryptFields, hashForSearch, ENCRYPTED_FIELDS } from '@/lib/encryption';
import { logAuditEvent, extractRequestInfo } from '@/lib/auditLog';
import { jwtVerify } from 'jose';

// Helper to extract user info from token
async function getUserFromToken(authHeader: string) {
  try {
    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(authHeader);
    const { ipAddress, userAgent } = extractRequestInfo(request);

    if (!isSupabaseConfigured()) {
      // Return mock data when Supabase is not configured
      return NextResponse.json({
        customers: [
          {
            id: '1',
            email: 'customer@example.com',
            first_name: 'Jane',
            last_name: 'Doe',
            phone: '555-123-4567',
            accepts_marketing: true,
            total_orders: 5,
            total_spent: 250.00,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_order_at: new Date().toISOString(),
            notes: null
          }
        ]
      });
    }

    const serverClient = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'total_spent';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    let query = serverClient
      .from('customers')
      .select('*')
      .order(sort, { ascending: order === 'asc' });

    if (search) {
      // For encrypted data, we need to search by hash or decrypt all records
      // Using hash-based search for better performance
      const searchHash = hashForSearch(search);
      query = query.or(`email_hash.eq.${searchHash},phone_hash.eq.${searchHash},email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Decrypt sensitive fields before returning
    const decryptedCustomers = (customers || []).map(customer => 
      decryptFields(customer, [...ENCRYPTED_FIELDS.customer])
    );

    // Log audit event for viewing customer data
    if (user) {
      await logAuditEvent({
        action: 'VIEW',
        resource: 'customer',
        userId: user.userId,
        userEmail: user.email,
        userRole: user.role,
        ipAddress,
        userAgent,
        details: {
          recordCount: decryptedCustomers.length,
          searchQuery: search || undefined,
        },
      });
    }

    return NextResponse.json({ customers: decryptedCustomers });
  } catch (error) {
    console.error('Error in customers route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserFromToken(authHeader);
    const { ipAddress, userAgent } = extractRequestInfo(request);

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const serverClient = createServerClient();
    const body = await request.json();

    // Create search hashes for encrypted fields
    const emailHash = body.email ? hashForSearch(body.email) : null;
    const phoneHash = body.phone ? hashForSearch(body.phone) : null;

    const { data: customer, error } = await serverClient
      .from('customers')
      .insert({
        email: body.email,
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        phone: body.phone || null,
        accepts_marketing: body.accepts_marketing || false,
        notes: body.notes || null,
        email_hash: emailHash,
        phone_hash: phoneHash,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    // Log audit event
    if (user) {
      await logAuditEvent({
        action: 'CREATE',
        resource: 'customer',
        resourceId: customer.id,
        userId: user.userId,
        userEmail: user.email,
        userRole: user.role,
        ipAddress,
        userAgent,
        details: {
          customerEmail: body.email,
        },
      });
    }

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error in customers POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

