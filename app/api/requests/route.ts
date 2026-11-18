import { NextRequest, NextResponse } from 'next/server';
import { dataStore, ERODE_CENTER } from '@/lib/data/store';
import { RequestStatus } from '@/types';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { STANDARDIZED_SERVICES } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';
import { dispatchAdminNotification } from '@/lib/notifications/dispatcher';

// GET: Privileged Admin Queue Retrieval
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to view service requests');
    }

    // Sync from Supabase if connected
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { data: dbRequests, error } = await supabase
          .from('service_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(dbRequests)) {
          dataStore.mergeRequests(dbRequests);
        } else {
          const { data: rpcReqs } = await supabase.rpc('get_admin_service_requests');
          if (Array.isArray(rpcReqs) && rpcReqs.length > 0) {
            dataStore.mergeRequests(rpcReqs);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch exception:', err);
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as RequestStatus | null;
    const search = searchParams.get('search') || '';
    const district = searchParams.get('district') || '';

    let requests = dataStore.getRequests(status && (status as string) !== 'ALL' ? status : undefined);

    if (search) {
      const q = search.toLowerCase();
      requests = requests.filter(
        (r) =>
          r.request_number.toString().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          r.customer_phone.includes(q) ||
          r.service_name.toLowerCase().includes(q) ||
          r.formatted_address.toLowerCase().includes(q)
      );
    }

    if (district && district !== 'ALL') {
      requests = requests.filter((r) => r.district?.toLowerCase() === district.toLowerCase());
    }

    return NextResponse.json(
      {
        success: true,
        count: requests.length,
        data: requests,
      },
      {
        headers: {
          'Cache-Control': 'no-store, private',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST: Public Customer Request Submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validation
    if (!body.customer_name || typeof body.customer_name !== 'string' || body.customer_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!body.customer_phone || typeof body.customer_phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid 10-digit mobile number is required' },
        { status: 400 }
      );
    }

    const cleanPhone = body.customer_phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9' },
        { status: 400 }
      );
    }

    const serviceName = body.service_name?.trim() || 'Home Service';
    const isOtherService = serviceName.toLowerCase() === 'other' || body.service_id === 'srv-other';

    // Format phone
    const formattedPhone = `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`;

    // Validate coordinates
    const lat = Number(body.latitude);
    const lon = Number(body.longitude);
    const validLat = !isNaN(lat) && lat >= 8.0 && lat <= 14.0 ? lat : ERODE_CENTER.lat;
    const validLon = !isNaN(lon) && lon >= 76.0 && lon <= 81.0 ? lon : ERODE_CENTER.lon;

    const allKnownServices = dataStore.getAllServices();
    const matchedService = allKnownServices.find(
      (s) => s.id === body.service_id || s.name.toLowerCase() === serviceName.toLowerCase()
    ) || STANDARDIZED_SERVICES.find(
      (s) => s.id === body.service_id || s.name.toLowerCase() === serviceName.toLowerCase()
    );

    const preferredDate = body.preferred_date && /^\d{4}-\d{2}-\d{2}$/.test(body.preferred_date)
      ? body.preferred_date
      : new Date().toISOString().split('T')[0];

    // If client/technician selected "Other" or typed a custom service description
    const rawCustomNote = body.custom_service_note?.trim() || '';
    const customServiceNote = rawCustomNote ? ` [Custom Requirement: ${rawCustomNote}]` : '';
    const requesterType: 'client' | 'technician' = body.requester_type === 'technician' ? 'technician' : 'client';

    const newRequest = dataStore.createRequest({
      customer_id: '',
      customer_name: body.customer_name.trim(),
      customer_phone: formattedPhone,
      customer_whatsapp: body.customer_whatsapp
        ? `+91 ${body.customer_whatsapp.replace(/\D/g, '').slice(-10, -5)} ${body.customer_whatsapp.replace(/\D/g, '').slice(-5)}`
        : formattedPhone,
      customer_email: body.customer_email?.trim(),
      category_id: body.category_id || (matchedService && 'category_id' in matchedService ? matchedService.category_id : undefined) || (matchedService?.id ? 'cat-standard' : 'cat-general'),
      category_name: serviceName,
      service_id: matchedService?.id || (isOtherService ? 'srv-other' : 'srv-general'),
      service_name: serviceName,
      description: `${body.description?.trim() || `${serviceName} requirement in ${body.district || 'Erode'}`}${customServiceNote}`,
      formatted_address: body.formatted_address?.trim() || `${body.district || 'Erode'}, Tamil Nadu`,
      district: body.district || 'Erode',
      latitude: validLat,
      longitude: validLon,
      preferred_date: preferredDate,
      preferred_time_slot: body.preferred_time_slot || 'Today (Within 2 Hours)',
      status: 'NEW',
      customer_confirmed: false,
      requester_type: requesterType,
      custom_service_note: rawCustomNote || undefined,
    });

    // Sync to Supabase if connected
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        await supabase.from('service_requests').insert([{
          id: newRequest.id,
          request_number: newRequest.request_number,
          customer_id: newRequest.customer_id || newRequest.id,
          customer_name: newRequest.customer_name,
          customer_phone: newRequest.customer_phone,
          customer_whatsapp: newRequest.customer_whatsapp,
          customer_email: newRequest.customer_email,
          category_id: newRequest.category_id,
          category_name: newRequest.category_name,
          service_id: newRequest.service_id,
          service_name: newRequest.service_name,
          description: newRequest.description,
          formatted_address: newRequest.formatted_address,
          district: newRequest.district,
          latitude: newRequest.latitude,
          longitude: newRequest.longitude,
          preferred_date: newRequest.preferred_date,
          preferred_time_slot: newRequest.preferred_time_slot,
          status: newRequest.status,
          customer_confirmed: newRequest.customer_confirmed,
          tracking_token: newRequest.tracking_token,
          requester_type: newRequest.requester_type || 'client',
          custom_service_note: newRequest.custom_service_note,
          created_at: newRequest.created_at,
          updated_at: newRequest.updated_at,
        }]);

        // Upsert customer profile
        await supabase.from('customers').upsert([{
          id: newRequest.id,
          full_name: newRequest.customer_name,
          phone: newRequest.customer_phone,
          whatsapp: newRequest.customer_whatsapp,
          email: newRequest.customer_email,
          district: newRequest.district,
          address: newRequest.formatted_address,
          latitude: newRequest.latitude,
          longitude: newRequest.longitude,
          total_requests: 1,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'phone' });
      } catch (dbErr) {
        console.warn('Supabase request sync warning:', dbErr);
      }
    }

    // Trigger Admin Web Push & In-App Notification (non-blocking)
    dispatchAdminNotification({
      type: 'service_request',
      title: 'New Customer Service Request',
      message: `${newRequest.customer_name} requested ${newRequest.service_name} in ${newRequest.district}.`,
      relatedId: newRequest.id,
      relatedType: 'request',
    }).catch((err) => console.warn('Admin notification warning:', err));

    // Return safe public reference and tracking token to the customer, plus full_request for store sync
    return NextResponse.json({
      success: true,
      message: 'Service request created successfully',
      data: {
        request_number: newRequest.request_number,
        tracking_token: newRequest.tracking_token,
        service_name: newRequest.service_name,
        district: newRequest.district,
        created_at: newRequest.created_at,
        full_request: newRequest,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create service request' },
      { status: 500 }
    );
  }
}
