import { TAMIL_NADU_DISTRICTS } from '@/lib/constants';

export interface GeoPositionResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  district: string;
  formatted_address: string;
  city?: string;
  locality?: string;
}

/**
 * Gets high-accuracy device geolocation with automatic fallback to standard accuracy
 * and cached position to prevent timeouts indoors or on mobile devices.
 */
export async function getDeviceGeolocation(): Promise<GeoPositionResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser or device.');
  }

  // Attempt 1: Live pinpoint GPS satellite fix (maximumAge: 0) for sub-meter doorstep accuracy
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy,
        });
      },
      (err1) => {
        // If user explicitly denied permission, do not retry
        if (err1.code === err1.PERMISSION_DENIED) {
          reject(new Error('Location permission denied by user.'));
          return;
        }

        // Attempt 2: Fallback to WiFi / cell-tower indoor triangulation
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: pos.coords.accuracy,
            });
          },
          (err2) => {
            reject(
              new Error(
                err2.code === err2.PERMISSION_DENIED
                  ? 'Location permission denied.'
                  : 'Unable to retrieve location. Please select your district manually.'
              )
            );
          },
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 30000, // 30-second fallback cache
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 0, // Force fresh satellite pinpoint GPS lock
      }
    );
  });
}

/**
 * Reverse geocodes coordinates to Tamil Nadu district and clean address.
 * Tries BigDataCloud client API first (CORS safe), falls back to internal proxy API.
 */
export async function fetchDistrictAndAddress(
  lat: number,
  lon: number,
  fallbackDistrict: string = 'Erode'
): Promise<ReverseGeocodeResult> {
  const coordLabel = `GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`;

  // 1. First attempt: BigDataCloud free client reverse geocoding (fast & CORS friendly)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const locality = data.locality || data.neighbourhood || '';
      const city = data.city || data.principalSubdivisionDistrict || '';
      const districtRaw = data.principalSubdivisionDistrict || city || locality || '';

      // Match district
      const textToMatch = `${districtRaw} ${city} ${locality}`.toLowerCase();
      const matched = TAMIL_NADU_DISTRICTS.find((d) => {
        const cleanName = d.toLowerCase().replace(/\s*\(.*\)/, '').trim();
        return textToMatch.includes(cleanName);
      });

      const parts = [locality, city, matched || fallbackDistrict].filter(Boolean);
      const uniqueParts = parts.filter((item, idx, arr) => arr.indexOf(item) === idx);

      return {
        latitude: lat,
        longitude: lon,
        district: matched || fallbackDistrict,
        city: city || fallbackDistrict,
        locality,
        formatted_address: uniqueParts.join(', ') || coordLabel,
      };
    }
  } catch {
    // Continue to server-side proxy fallback
  }

  // 2. Second attempt: Internal Next.js proxy route `/api/geocode/reverse`
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const apiRes = await fetch(
      `/api/geocode/reverse?lat=${lat}&lon=${lon}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.success && json.data) {
        return {
          latitude: lat,
          longitude: lon,
          district: json.data.district || fallbackDistrict,
          city: json.data.city,
          locality: json.data.locality,
          formatted_address: json.data.formatted_address || coordLabel,
        };
      }
    }
  } catch {
    // Both network geocoders failed, return clean fallback with coordinates
  }

  // 3. Fallback: Return coordinates with fallback district
  return {
    latitude: lat,
    longitude: lon,
    district: fallbackDistrict,
    formatted_address: coordLabel,
  };
}
