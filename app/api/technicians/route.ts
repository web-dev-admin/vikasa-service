import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function GET(request: NextRequest) {
  try {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.full_name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Full name and phone are required' },
        { status: 400 }
      );
    }

    if (!body.service_ids || body.service_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one service must be selected' },
        { status: 400 }
      );
    }

    const technician = dataStore.registerWorker({
      full_name: body.full_name.trim(),
      phone: body.phone.trim(),
      whatsapp: body.whatsapp?.trim() || body.phone.trim(),
      email: body.email?.trim(),
      experience_years: Number(body.experience_years) || 1,
      skills: body.skills || [],
      bio: body.bio || 'Verified service technician.',
      verification_status: 'verified',
      availability: body.availability || 'available',
      active_status: body.active_status || 'active',
      district: body.district || 'Salem',
      base_location_name: body.base_location_name || `${body.district || 'Salem'}, Tamil Nadu`,
      latitude: Number(body.latitude) || 11.6643,
      longitude: Number(body.longitude) || 78.146,
      service_radius_km: Number(body.service_radius_km) || 20,
      service_area_names: [body.base_location_name || 'Salem'],
      service_ids: body.service_ids,
    });

    return NextResponse.json({
      success: true,
      data: technician,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to register technician' },
      { status: 500 }
    );
  }
}
