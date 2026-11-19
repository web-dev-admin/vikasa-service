import {
  findClosestTamilNaduDistrict,
} from '@/lib/utils/districtMatcher';

export interface GeoPositionResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ReverseGeocodeResult {
  latitude: number;
  longitude: number;
  district: string | null;
  formatted_address: string;
  city?: string;
  locality?: string;
  road?: string;
  house_number?: string;
  postcode?: string;
  state?: string;
  country?: string;
  isOutsideServiceArea?: boolean;
  outsideAreaMessage?: string;
}

export class GeolocationError extends Error {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';

  constructor(
    code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED',
    message: string
  ) {
    super(message);
    this.name = 'GeolocationError';
    this.code = code;
  }
}

export interface GeolocationOptions {
  timeoutMs?: number;
  maximumAgeMs?: number;
  enableHighAccuracy?: boolean;
}

/**
 * Gets device geolocation with high-accuracy satellite lock and intelligent
 * fallback to WiFi/cellular triangulation.
 *
 * Guarantees:
 * 1. Runs strictly upon explicit user interaction (no background tracking).
 * 2. Uses appropriate high-accuracy settings with 10s timeout and 60s cache.
 * 3. Categorizes permission denied, unavailable services, and timeouts cleanly.
 */
export async function getDeviceGeolocation(
  options: GeolocationOptions = {}
): Promise<GeoPositionResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new GeolocationError(
      'NOT_SUPPORTED',
      'Geolocation is not supported by your browser or device.'
    );
  }

  const {
    timeoutMs = 10000,
    maximumAgeMs = 60000,
    enableHighAccuracy = true,
  } = options;

  return new Promise((resolve, reject) => {
    // Attempt 1: High accuracy GPS satellite lock
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err1) => {
        // If user explicitly denied permission, do not retry
        if (err1.code === err1.PERMISSION_DENIED) {
          reject(
            new GeolocationError(
              'PERMISSION_DENIED',
              'Location permission was denied. Please allow location access in your browser or device settings.'
            )
          );
          return;
        }

        // Attempt 2: Fallback to WiFi / cell-tower indoor triangulation
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracy: Math.round(pos.coords.accuracy),
            });
          },
          (err2) => {
            if (err2.code === err2.PERMISSION_DENIED) {
              reject(
                new GeolocationError(
                  'PERMISSION_DENIED',
                  'Location permission was denied. Please allow location access in your browser or device settings.'
                )
              );
            } else if (err2.code === err2.POSITION_UNAVAILABLE) {
              reject(
                new GeolocationError(
                  'POSITION_UNAVAILABLE',
                  'Location services are disabled or unavailable. Please enable device Location in your settings.'
                )
              );
            } else {
              reject(
                new GeolocationError(
                  'TIMEOUT',
                  'Location detection timed out. Please retry or enter your address manually.'
                )
              );
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 6000,
            maximumAge: 300000, // 5-minute fallback cache for indoor locations
          }
        );
      },
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: maximumAgeMs,
      }
    );
  });
}

/**
 * Reverse geocodes coordinates to Tamil Nadu district, structured address components,
 * and human-readable formatted address via our internal proxy API.
 * Includes mathematical centroid distance fallback if external network fails.
 */
export async function fetchDistrictAndAddress(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult> {
  const coordLabel = `GPS Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`;

  // 1. Primary: Server-side reverse geocoding proxy
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

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
          district: json.data.district || null,
          formatted_address: json.data.formatted_address || coordLabel,
          city: json.data.city || '',
          locality: json.data.locality || '',
          road: json.data.road || '',
          house_number: json.data.house_number || '',
          postcode: json.data.postcode || '',
          state: json.data.state || 'Tamil Nadu',
          country: json.data.country || 'India',
          isOutsideServiceArea: Boolean(json.data.isOutsideServiceArea),
          outsideAreaMessage: json.data.outsideAreaMessage,
        };
      }
    }
  } catch {
    // API unreachable (offline or network glitch)
  }

  // 2. Client-side Mathematical Centroid Fallback:
  // Accurately maps coordinates to the closest Tamil Nadu district even with zero network
  const closest = findClosestTamilNaduDistrict(lat, lon);

  if (closest.isWithinTamilNadu) {
    return {
      latitude: lat,
      longitude: lon,
      district: closest.district,
      formatted_address: `${closest.district}, Tamil Nadu (${coordLabel})`,
      state: 'Tamil Nadu',
      country: 'India',
      isOutsideServiceArea: false,
    };
  }

  return {
    latitude: lat,
    longitude: lon,
    district: null,
    formatted_address: coordLabel,
    isOutsideServiceArea: true,
    outsideAreaMessage: 'Detected coordinates appear to be outside Tamil Nadu service coverage.',
  };
}
