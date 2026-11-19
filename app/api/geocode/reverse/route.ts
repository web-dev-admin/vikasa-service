import { NextRequest, NextResponse } from 'next/server';
import {
  matchDistrictFromAddress,
  findClosestTamilNaduDistrict,
  AddressComponents,
} from '@/lib/utils/districtMatcher';

export const runtime = 'nodejs';

// In-memory reverse geocode cache (rounded to ~100m) to absorb repeat calls and avoid rate-limiting
const geocodeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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

    // 1. Check in-memory cache (~100m grid)
    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(
        { success: true, data: cached.data },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
            'X-Geocode-Cache': 'HIT',
          },
        }
      );
    }

    // 2. Query OpenStreetMap Nominatim with compliant User-Agent
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&zoom=18`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

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

    // 3. Parse address components
    const addr: AddressComponents = addressData?.address || {};
    const houseNumber = addr.house_number || addr.building || '';
    const road = addr.road || addr.street || addr.residential || '';
    const locality = addr.suburb || addr.neighbourhood || addr.locality || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || '';
    const postcode = addr.postcode || '';
    const state = addr.state || 'Tamil Nadu';
    const country = addr.country || 'India';

    // 4. District matching and validation
    const matchResult = matchDistrictFromAddress(addr);
    let finalDistrict: string | null = matchResult.district;
    let isOutsideServiceArea = matchResult.isOutsideTamilNadu;
    let outsideAreaMessage: string | undefined = undefined;

    if (isOutsideTamilNadu(lat, lon, matchResult)) {
      isOutsideServiceArea = true;
      const detectedRegion = matchResult.detectedDistrictName || matchResult.detectedState || 'outside Tamil Nadu';
      outsideAreaMessage = `Your detected location is in ${detectedRegion}. Vikasa Services currently operates in Tamil Nadu. Please select your service district manually.`;
    } else if (!finalDistrict) {
      // Coordinate centroid proximity fallback
      const closest = findClosestTamilNaduDistrict(lat, lon);
      if (closest.isWithinTamilNadu) {
        finalDistrict = closest.district;
      } else {
        isOutsideServiceArea = true;
        outsideAreaMessage = 'Your location appears to be outside our Tamil Nadu service coverage.';
      }
    }

    // 5. Construct human-readable formatted address
    const addressParts: string[] = [];
    if (houseNumber) addressParts.push(houseNumber);
    if (road && road !== houseNumber) addressParts.push(road);
    if (locality && locality !== road) addressParts.push(locality);
    if (city && city !== locality && city !== road) addressParts.push(city);
    if (finalDistrict && finalDistrict !== city) addressParts.push(finalDistrict);
    if (postcode) addressParts.push(`PIN ${postcode}`);

    const formattedAddress = addressParts.length > 0
      ? addressParts.join(', ')
      : `GPS Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`;

    const responsePayload = {
      latitude: lat,
      longitude: lon,
      district: finalDistrict,
      state: isOutsideServiceArea ? (matchResult.detectedState || state) : 'Tamil Nadu',
      country,
      city: city || (finalDistrict ? finalDistrict.replace(/\s*\(.*\)/, '') : ''),
      locality: locality || road || '',
      road: road || '',
      house_number: houseNumber || '',
      postcode: postcode || '',
      formatted_address: formattedAddress,
      isOutsideServiceArea,
      outsideAreaMessage,
    };

    // Cache the result
    geocodeCache.set(cacheKey, { data: responsePayload, timestamp: Date.now() });

    return NextResponse.json(
      {
        success: true,
        data: responsePayload,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
          'X-Geocode-Cache': 'MISS',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Reverse geocoding failed' },
      { status: 500 }
    );
  }
}

function isOutsideTamilNadu(
  lat: number,
  lon: number,
  matchResult: { isOutsideTamilNadu: boolean }
): boolean {
  if (matchResult.isOutsideTamilNadu) return true;
  // Latitude outside 7.9° N - 13.8° N or longitude outside 76.0° E - 80.6° E is outside Tamil Nadu
  if (lat < 7.9 || lat > 13.8 || lon < 76.0 || lon > 80.6) {
    return true;
  }
  return false;
}
