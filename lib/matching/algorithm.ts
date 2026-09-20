import { Worker, MatchedWorker, WorkerContactAttempt } from '@/types';

/**
 * Computes great-circle distance between two coordinate pairs using Haversine formula.
 * Mirrors PostGIS ST_Distance(geography, geography) in meters converted to km.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100;
}

/**
 * PostGIS Worker Matching Engine
 * 1. Correct Service
 * 2. Worker Verified
 * 3. Worker Available
 * 4. Geographic Distance within search radius & worker maximum radius
 * 5. Orders by exact match, distance, experience
 */
export function matchWorkers(
  serviceId: string,
  customerLat: number,
  customerLon: number,
  workers: Worker[],
  contactAttempts: WorkerContactAttempt[] = [],
  searchRadiusKm: number = 15
): MatchedWorker[] {
  const matched: MatchedWorker[] = [];

  for (const worker of workers) {
    // 1. Must be verified
    if (worker.verification_status !== 'verified') continue;

    // 2. Must be available (or we still show if previously contacted for transparency)
    if (worker.availability !== 'available') continue;

    // 3. Must provide the requested service
    const isExactService = worker.service_ids.includes(serviceId);
    if (!isExactService) continue;

    // 4. Calculate Distance
    const distanceKm = calculateDistanceKm(
      customerLat,
      customerLon,
      worker.latitude,
      worker.longitude
    );

    // 5. Must be within search radius AND worker's own maximum service radius
    if (distanceKm > searchRadiusKm || distanceKm > worker.service_radius_km) {
      continue;
    }

    // Distance categorization
    let matchCategory: 'Nearby (0-3 km)' | 'Near (3-7 km)' | 'Far (7-15+ km)';
    if (distanceKm <= 3.0) {
      matchCategory = 'Nearby (0-3 km)';
    } else if (distanceKm <= 7.0) {
      matchCategory = 'Near (3-7 km)';
    } else {
      matchCategory = 'Far (7-15+ km)';
    }

    // Check contact history for this request
    const previousAttempt = contactAttempts
      .filter((a) => a.worker_id === worker.id)
      .sort((a, b) => b.attempt_number - a.attempt_number)[0];

    matched.push({
      worker_id: worker.id,
      full_name: worker.full_name,
      phone: worker.phone,
      avatar_url: worker.avatar_url,
      experience_years: worker.experience_years,
      verification_status: worker.verification_status,
      availability: worker.availability,
      distance_km: distanceKm,
      is_exact_service: isExactService,
      service_radius_km: worker.service_radius_km,
      base_location_name: worker.base_location_name,
      match_category: matchCategory,
      skills: worker.skills,
      has_been_contacted: !!previousAttempt,
      last_contact_result: previousAttempt?.result,
      latitude: worker.latitude,
      longitude: worker.longitude,
    });
  }

  // Sort: Uncontacted first -> Lowest distance -> Highest experience
  return matched.sort((a, b) => {
    if (a.has_been_contacted !== b.has_been_contacted) {
      return a.has_been_contacted ? 1 : -1;
    }
    if (a.distance_km !== b.distance_km) {
      return a.distance_km - b.distance_km;
    }
    return b.experience_years - a.experience_years;
  });
}
