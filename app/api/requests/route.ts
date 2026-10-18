import { NextRequest, NextResponse } from 'next/server';
import { dataStore, SALEM_CENTER } from '@/lib/data/store';
import { RequestStatus } from '@/types';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { STANDARDIZED_SERVICES } from '@/lib/constants';

// GET: Privileged Admin Queue Retrieval
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to view service requests');
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

    return NextResponse.json({
      success: true,
      count: requests.length,
      data: requests,
    });
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
    const validLat = !isNaN(lat) && lat >= 8.0 && lat <= 14.0 ? lat : SALEM_CENTER.lat;
    const validLon = !isNaN(lon) && lon >= 76.0 && lon <= 81.0 ? lon : SALEM_CENTER.lon;

    const matchedService = STANDARDIZED_SERVICES.find(
      (s) => s.id === body.service_id || s.name.toLowerCase() === serviceName.toLowerCase()
    );

    const preferredDate = body.preferred_date && /^\d{4}-\d{2}-\d{2}$/.test(body.preferred_date)
      ? body.preferred_date
      : new Date().toISOString().split('T')[0];

    // If customer selected "Other" or typed a custom service description
    const customServiceNote = body.custom_service_note ? ` [Requested: ${body.custom_service_note}]` : '';

    const newRequest = dataStore.createRequest({
      customer_id: '',
      customer_name: body.customer_name.trim(),
      customer_phone: formattedPhone,
      customer_whatsapp: body.customer_whatsapp
        ? `+91 ${body.customer_whatsapp.replace(/\D/g, '').slice(-10, -5)} ${body.customer_whatsapp.replace(/\D/g, '').slice(-5)}`
        : formattedPhone,
      customer_email: body.customer_email?.trim(),
      category_id: matchedService?.id ? 'cat-standard' : 'cat-general',
      category_name: serviceName,
      service_id: matchedService?.id || (isOtherService ? 'srv-other' : 'srv-general'),
      service_name: serviceName,
      description: `${body.description?.trim() || `${serviceName} requirement in ${body.district || 'Salem'}`}${customServiceNote}`,
      formatted_address: body.formatted_address?.trim() || `${body.district || 'Salem'}, Tamil Nadu`,
      district: body.district || 'Salem',
      latitude: validLat,
      longitude: validLon,
      preferred_date: preferredDate,
      preferred_time_slot: body.preferred_time_slot || 'Today (Within 2 Hours)',
      status: 'NEW',
      customer_confirmed: false,
    });

    // Return only safe public reference and tracking token to the customer
    return NextResponse.json({
      success: true,
      message: 'Service request created successfully',
      data: {
        request_number: newRequest.request_number,
        tracking_token: newRequest.tracking_token,
        service_name: newRequest.service_name,
        district: newRequest.district,
        created_at: newRequest.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create service request' },
      { status: 500 }
    );
  }
}
