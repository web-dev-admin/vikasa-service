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
        let customerId = newRequest.customer_id;
        const cleanPhone = newRequest.customer_phone.replace(/\D/g, '').slice(-10);

        // 1. Ensure customer exists in Supabase first (satisfies foreign key constraint)
        const { data: existingCust } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingCust?.id) {
          customerId = existingCust.id;
        } else {
          const custId = customerId || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const { data: createdCust, error: cErr } = await supabase
            .from('customers')
            .insert([{
              id: custId,
              full_name: newRequest.customer_name,
              phone: cleanPhone,
              whatsapp: newRequest.customer_whatsapp || cleanPhone,
              district: newRequest.district || 'Erode',
              address: newRequest.formatted_address || '',
              latitude: newRequest.latitude || null,
              longitude: newRequest.longitude || null,
            }])
            .select('id')
            .maybeSingle();

          if (!cErr && createdCust?.id) {
            customerId = createdCust.id;
          } else {
            customerId = custId;
          }
        }

        // 2. Map service_id to valid DB services foreign key
        const validServiceIds = [
          'srv-interior',
          'srv-electrical',
          'srv-plumbing',
          'srv-carpentry',
          'srv-painting',
          'srv-ac',
          'srv-cleaning',
          'srv-other',
        ];
        let dbServiceId = 'srv-other';
        const rawSrv = (newRequest.service_id || '').toLowerCase();
        const rawName = (newRequest.service_name || '').toLowerCase();

        if (
          rawSrv.includes('interior') ||
          rawSrv.includes('kitchen') ||
          rawSrv.includes('ceiling') ||
          rawName.includes('interior') ||
          rawName.includes('kitchen') ||
          rawName.includes('ceiling')
        ) {
          dbServiceId = 'srv-interior';
        } else if (rawSrv.includes('electric') || rawName.includes('electric') || rawName.includes('wiring')) {
          dbServiceId = 'srv-electrical';
        } else if (rawSrv.includes('plumb') || rawName.includes('plumb') || rawName.includes('pipe') || rawName.includes('leak')) {
          dbServiceId = 'srv-plumbing';
        } else if (rawSrv.includes('carpent') || rawName.includes('carpent') || rawName.includes('wood')) {
          dbServiceId = 'srv-carpentry';
        } else if (rawSrv.includes('paint') || rawName.includes('paint') || rawName.includes('putty')) {
          dbServiceId = 'srv-painting';
        } else if (rawSrv.includes('ac') || rawName.includes('ac') || rawName.includes('air conditioner') || rawName.includes('appliance')) {
          dbServiceId = 'srv-ac';
        } else if (rawSrv.includes('clean') || rawName.includes('clean') || rawName.includes('pest')) {
          dbServiceId = 'srv-cleaning';
        } else if (validServiceIds.includes(rawSrv)) {
          dbServiceId = rawSrv;
        }

        // 3. Insert service_requests matching actual DB columns
        const validTrackingToken =
          newRequest.tracking_token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newRequest.tracking_token)
            ? newRequest.tracking_token
            : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '6522e57b-7446-423a-b48a-9122ea02e975');

        const insertPayload: Record<string, any> = {
          id: newRequest.id,
          tracking_token: validTrackingToken,
          customer_id: customerId,
          customer_name: newRequest.customer_name,
          customer_phone: newRequest.customer_phone,
          service_id: dbServiceId,
          service_name: newRequest.service_name,
          category_name: newRequest.category_name || 'Standard Service',
          description: newRequest.description || '',
          custom_service_note: newRequest.custom_service_note || null,
          formatted_address: newRequest.formatted_address,
          district: newRequest.district || 'Erode',
          latitude: newRequest.latitude || null,
          longitude: newRequest.longitude || null,
          preferred_date: newRequest.preferred_date || new Date().toISOString().split('T')[0],
          preferred_time_slot: newRequest.preferred_time_slot || 'Today (Within 2 Hours)',
          status: newRequest.status || 'NEW',
          customer_confirmed: Boolean(newRequest.customer_confirmed),
          created_at: newRequest.created_at,
          updated_at: newRequest.updated_at,
        };

        const { data: insertedDbReq, error: reqErr } = await supabase
          .from('service_requests')
          .insert([insertPayload])
          .select()
          .maybeSingle();

        if (reqErr) {
          console.error('[Requests:POST] Supabase insert error:', reqErr.message, reqErr.code);
        } else if (insertedDbReq) {
          newRequest.id = insertedDbReq.id;
          newRequest.request_number = insertedDbReq.request_number;
          newRequest.tracking_token = insertedDbReq.tracking_token;
          newRequest.created_at = insertedDbReq.created_at;
          newRequest.updated_at = insertedDbReq.updated_at;
          dataStore.mergeRequests([newRequest]);
        }
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
