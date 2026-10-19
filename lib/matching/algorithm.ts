import { Worker, MatchedWorker, WorkerContactAttempt } from '@/types';

/**
 * Computes great-circle distance between two coordinate pairs using Haversine formula.
 * Mirrors PostGIS ST_Distance(geography, geography) in meters converted to km.
 * Gracefully handles 0 or invalid coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' || isNaN(lat1) ||
    typeof lon1 !== 'number' || isNaN(lon1) ||
    typeof lat2 !== 'number' || isNaN(lat2) ||
    typeof lon2 !== 'number' || isNaN(lon2)
  ) {
    return 0;
  }
  if ((lat1 === 0 && lon1 === 0) || (lat2 === 0 && lon2 === 0)) return 0;
  if (lat1 === lat2 && lon1 === lon2) return 0;

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
 * Robust district comparison handling variations like:
 * "Erode", "Erode City", "Erode, Tamil Nadu", "erode"
 */
export function matchDistrict(
  workerDistrict?: string,
  targetDistrict?: string
): boolean {
  if (!targetDistrict || targetDistrict === 'ALL') return true;
  if (!workerDistrict) return false;

  const clean = (str: string) =>
    str.toLowerCase().replace(/district|city|, tamil nadu/gi, '').trim();

  const w = clean(workerDistrict);
  const t = clean(targetDistrict);

  return w === t || w.includes(t) || t.includes(w);
}

/**
 * Normalizes and checks if a technician's skills or service IDs match a target service or trade.
 * Handles:
 * - Direct ID match
 * - Full string match (case-insensitive)
 * - Bidirectional substring match
 * - Keyword / trade token matching
 * - Semantic trade synonym clusters
 */
export function matchServiceOrTrade(
  workerSkills: string[] = [],
  workerServiceIds: string[] = [],
  targetService: string,
  targetServiceId?: string
): boolean {
  if (!targetService || targetService === 'ALL') return true;

  const target = targetService.toLowerCase().trim();
  const targetId = (targetServiceId || '').toLowerCase().trim();

  // 1. Direct ID match
  if (targetId) {
    if (
      workerServiceIds.some((id) => {
        const i = id.toLowerCase().trim();
        return i === targetId || i.includes(targetId) || targetId.includes(i);
      })
    ) {
      return true;
    }
  }

  // 2. Direct string & bidirectional substring matching
  for (const skill of workerSkills) {
    const s = skill.toLowerCase().trim();
    if (!s) continue;
    if (s === target || s.includes(target) || target.includes(s)) return true;
  }

  for (const id of workerServiceIds) {
    const s = id.toLowerCase().trim();
    if (!s) continue;
    if (s === target || s.includes(target) || target.includes(s)) return true;
  }

  // 3. Keyword / trade token matching (tokens of length >= 3)
  const targetTokens = target.split(/[\s,&+/_\-()]+/).filter((t) => t.length >= 3);
  for (const token of targetTokens) {
    for (const skill of workerSkills) {
      if (skill.toLowerCase().includes(token)) return true;
    }
    for (const id of workerServiceIds) {
      if (id.toLowerCase().includes(token)) return true;
    }
  }

  // 4. Semantic domain synonyms
  const synonymMap: Record<string, string[]> = {
    interior: ['interior', 'decor', 'consultation', 'design', 'architecture', 'full home', 'living', 'bedroom'],
    carpentry: ['carpentry', 'plywood', 'wood', 'furniture', 'modular', 'kitchen', 'wardrobe', 'cupboard', 'cabinet', 'pooja', 'tv unit', 'tv wall', 'loft'],
    painting: ['paint', 'color', 'whitewash', 'texture', 'wall finish', 'primer'],
    electrical: ['electric', 'wiring', 'light', 'fan', 'switch', 'inverter', 'led', 'pop'],
    plumbing: ['plumb', 'pipe', 'leak', 'tap', 'motor', 'drain', 'sanitary'],
    ac: ['ac', 'air conditioner', 'cooling', 'hvac', 'refrigerat'],
    cleaning: ['clean', 'deep clean', 'sanitize', 'housekeeping'],
  };

  for (const syns of Object.values(synonymMap)) {
    const targetHasDomain = syns.some((syn) => target.includes(syn) || targetId.includes(syn));
    if (targetHasDomain) {
      const workerHasDomain =
        workerSkills.some((s) => syns.some((syn) => s.toLowerCase().includes(syn))) ||
        workerServiceIds.some((id) => syns.some((syn) => id.toLowerCase().includes(syn)));
      if (workerHasDomain) return true;
    }
  }

  return false;
}

/**
 * PostGIS Worker Matching Engine
 * 1. Correct Service / Trade
 * 2. Worker Verified (strict by default, configurable)
 * 3. Worker Available (or includes for transparency if requested)
 * 4. Geographic Distance within search radius & worker maximum radius (or same district)
 * 5. Orders by contact history, distance, experience
 */
export function matchWorkers(
  serviceId: string,
  customerLat: number,
  customerLon: number,
  workers: Worker[],
  contactAttempts: WorkerContactAttempt[] = [],
  searchRadiusKm: number = 35,
  options?: {
    allowPending?: boolean;
    allowBusy?: boolean;
    serviceName?: string;
    customerDistrict?: string;
  }
): MatchedWorker[] {
  const matched: MatchedWorker[] = [];

  for (const worker of workers) {
    // 1. Must be verified (unless explicitly allowed)
    if (!options?.allowPending && worker.verification_status !== 'verified') {
      continue;
    }

    // 2. Must be available (unless explicitly allowed)
    if (!options?.allowBusy && worker.availability !== 'available') {
      continue;
    }

    // 3. Must provide the requested service or compatible trade
    const isExactService =
      worker.service_ids.includes(serviceId) ||
      matchServiceOrTrade(
        worker.skills,
        worker.service_ids,
        options?.serviceName || serviceId,
        serviceId
      );

    if (!isExactService) continue;

    // 4. Calculate Distance
    const distanceKm = calculateDistanceKm(
      customerLat,
      customerLon,
      worker.latitude,
      worker.longitude
    );

    // 5. Must be within search radius OR in the same district
    const isSameDistrict = matchDistrict(worker.district, options?.customerDistrict);
    const effectiveRadius = Math.max(searchRadiusKm, worker.service_radius_km || 25);

    if (!isSameDistrict && distanceKm > effectiveRadius) {
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

