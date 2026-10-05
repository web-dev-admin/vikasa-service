import { NextRequest, NextResponse } from 'next/server';
import { dataStore, SALEM_CENTER } from '@/lib/data/store';
import { RequestStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as RequestStatus | null;
    const search = searchParams.get('search') || '';
    const district = searchParams.get('district') || '';

    let requests = dataStore.getRequests(status && status !== ('ALL' as any) ? status : undefined);

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customer_name || !body.customer_phone) {
      return NextResponse.json(
        { success: false, error: 'Customer name and phone number are required' },
        { status: 400 }
      );
    }

    if (!body.service_name && !body.service_id) {
      return NextResponse.json(
        { success: false, error: 'Service required must be selected' },
        { status: 400 }
      );
    }

    const cleanPhone = body.customer_phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    const formattedPhone = `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`;

    const newRequest = dataStore.createRequest({
      customer_id: '', // Automatically created/upserted by dataStore.createRequest
      customer_name: body.customer_name.trim(),
      customer_phone: formattedPhone,
      customer_whatsapp: body.customer_whatsapp ? `+91 ${body.customer_whatsapp.replace(/\D/g, '').slice(-10)}` : formattedPhone,
      customer_email: body.customer_email?.trim(),
      category_id: body.category_id || 'cat-general',
      category_name: body.category_name || body.service_name || 'Home Service',
      service_id: body.service_id || 'srv-general',
      service_name: body.service_name || 'Home Service',
      description: body.description?.trim() || 'Service request',
      formatted_address: body.formatted_address || `${body.district || 'Salem'}, Tamil Nadu`,
      district: body.district || 'Salem',
      latitude: Number(body.latitude) || SALEM_CENTER.lat,
      longitude: Number(body.longitude) || SALEM_CENTER.lon,
      preferred_date: body.preferred_date || new Date().toISOString().split('T')[0],
      preferred_time_slot: body.preferred_time_slot || 'Today (Within 2 Hours)',
      status: 'NEW',
      customer_confirmed: false,
    });

    return NextResponse.json({
      success: true,
      data: newRequest,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create service request' },
      { status: 500 }
    );
  }
}
