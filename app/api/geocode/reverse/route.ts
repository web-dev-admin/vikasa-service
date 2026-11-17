import { NextRequest, NextResponse } from 'next/server';
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants';

export const runtime = 'nodejs';

// Server-side reverse geocoding proxy to prevent CORS and Nominatim User-Agent blocking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat') || searchParams.get('latitude');
    const lonStr = searchParams.get('lon') || searchParams.get('longitude');

    if (!latStr || !lonStr) {
      return NextResponse.json(
        { success: false, error: 'Both latitude and longitude parameters are required' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinate values' },
        { status: 400 }
      );
    }

    // 1. Fetch from OpenStreetMap Nominatim with compliant User-Agent
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    let addressData: any = null;

    try {
      const res = await fetch(nominatimUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'VikasaServicesPlatform/2.0 (contact@vikasaservices.in)',
          'Accept-Language': 'en,ta',
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        addressData = await res.json();
      }
    } catch {
      clearTimeout(timeout);
    }

    // 2. Parse address fields
    const addr = addressData?.address || {};
    const road = addr.road || addr.street || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
    const locality = addr.suburb || addr.neighbourhood || addr.residential || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || '';
    const detectedDistrict = addr.state_district || addr.county || addr.district || '';
    const postcode = addr.postcode || '';

    // 3. Match against official Tamil Nadu standardized districts
    let matchedDistrict: string = 'Erode';
    const textToMatch = `${detectedDistrict} ${city} ${locality}`.toLowerCase();

    const foundDistrict = TAMIL_NADU_DISTRICTS.find((d) => {
      const lower = d.toLowerCase();
      // Handle special cases like Trichy
      if (lower.includes('trichy') && textToMatch.includes('trichy')) return true;
      const cleanName = lower.replace(/\s*\(.*\)/, '').trim();
      return textToMatch.includes(cleanName);
    });

    if (foundDistrict) {
      matchedDistrict = foundDistrict;
    }

    // 4. Construct clean, human-friendly formatted address
    const parts = [road, locality !== road ? locality : '', city, matchedDistrict, postcode ? `PIN ${postcode}` : '']
      .filter(Boolean)
      .filter((item, idx, arr) => arr.indexOf(item) === idx);

    const formattedAddress = parts.length > 0 ? parts.join(', ') : `GPS Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`;

    return NextResponse.json({
      success: true,
      data: {
        latitude: lat,
        longitude: lon,
        district: matchedDistrict,
        city: city || matchedDistrict,
        road,
        locality,
        postcode,
        formatted_address: formattedAddress,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Reverse geocoding failed' },
      { status: 500 }
    );
  }
}
