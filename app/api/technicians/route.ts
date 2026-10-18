import { NextRequest, NextResponse } from 'next/server';
import { dataStore, ERODE_CENTER } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';

// GET: Admin only technician directory
export async function GET(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to view technician directory');
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const district = searchParams.get('district') || undefined;
    const service = searchParams.get('service') || undefined;
    const availability = searchParams.get('availability') || undefined;
    const active_status = searchParams.get('active_status') || undefined;

    const technicians = dataStore.getWorkers({
      search,
      district,
      service,
      availability,
      active_status,
    });

    return NextResponse.json({
      success: true,
      count: technicians.length,
      data: technicians,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch technicians' },
      { status: 500 }
    );
  }
}

// POST: Public technician registration (untrusted endpoint, strictly pending_verification)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.full_name || typeof body.full_name !== 'string' || body.full_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!body.phone || typeof body.phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mobile number is required' },
        { status: 400 }
      );
    }

    const cleanPhone = body.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.service_ids) || body.service_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one service trade must be selected' },
        { status: 400 }
      );
    }

    const formattedPhone = `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`;
    const cleanWhatsapp = body.whatsapp ? body.whatsapp.replace(/\D/g, '') : cleanPhone;
    const formattedWhatsapp = cleanWhatsapp.length >= 10
      ? `+91 ${cleanWhatsapp.slice(-10, -5)} ${cleanWhatsapp.slice(-5)}`
      : formattedPhone;

    // Validate coordinates
    const lat = Number(body.latitude);
    const lon = Number(body.longitude);
    const validLat = !isNaN(lat) && lat >= 8.0 && lat <= 14.0 ? lat : ERODE_CENTER.lat;
    const validLon = !isNaN(lon) && lon >= 76.0 && lon <= 81.0 ? lon : ERODE_CENTER.lon;

    // Strict security rule: Public registrations CANNOT self-approve.
    // They are always set to 'pending_verification'.
    const technician = dataStore.registerWorker({
      full_name: body.full_name.trim(),
      phone: formattedPhone,
      whatsapp: formattedWhatsapp,
      email: body.email?.trim() || undefined,
      avatar_url: body.avatar_url?.trim() || undefined,
      experience_years: Math.max(0, Math.min(50, Number(body.experience_years) || 1)),
      skills: Array.isArray(body.skills) ? body.skills : [],
      bio: body.bio?.trim() || `Professional service technician registered for ${body.district || 'Erode'}.`,
      verification_status: 'pending_verification', // ALWAYS pending_verification
      availability: 'available',
      active_status: 'active',
      district: body.district?.trim() || 'Erode',
      base_location_name: body.base_location_name?.trim() || `${body.district || 'Erode'}, Tamil Nadu`,
      latitude: validLat,
      longitude: validLon,
      service_radius_km: Math.max(5, Math.min(100, Number(body.service_radius_km) || 20)),
      service_area_names: [body.base_location_name || body.district || 'Erode'],
      service_ids: body.service_ids,
    });

    return NextResponse.json({
      success: true,
      message: 'Technician registration submitted successfully. Your profile is pending coordinator verification.',
      data: {
        id: technician.id,
        full_name: technician.full_name,
        verification_status: technician.verification_status,
        district: technician.district,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit technician registration' },
      { status: 500 }
    );
  }
}
