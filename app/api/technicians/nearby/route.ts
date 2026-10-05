import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { calculateDistanceKm } from '@/lib/matching/algorithm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lonStr = searchParams.get('lon');
    const service = searchParams.get('service') || '';
    const district = searchParams.get('district') || '';
    const radiusKm = Number(searchParams.get('radius')) || 50;

    const customerLat = latStr ? parseFloat(latStr) : 11.6643;
    const customerLon = lonStr ? parseFloat(lonStr) : 78.146;

    // Fetch all active verified workers
    const allWorkers = dataStore.getWorkers().filter((w) => w.verification_status === 'verified');

    // Calculate distance and rank
    const ranked = allWorkers
      .map((w) => {
        const distance = calculateDistanceKm(
          customerLat,
          customerLon,
          w.latitude,
          w.longitude
        );

        // Check if provides service
        const sLower = service.toLowerCase();
        const matchesService =
          !service ||
          w.service_ids.some((id) => id.toLowerCase().includes(sLower) || sLower.includes(id.toLowerCase())) ||
          w.skills.some((skill) => skill.toLowerCase().includes(sLower) || sLower.includes(skill.toLowerCase()));

        // Check district match
        const matchesDistrict = !district || district === 'ALL' || w.district?.toLowerCase() === district.toLowerCase();

        return {
          technician_id: w.id,
          name: w.full_name,
          phone: w.phone,
          whatsapp: w.whatsapp || w.phone,
          district: w.district || 'Salem',
          base_location: w.base_location_name,
          experience_years: w.experience_years,
          skills: w.skills,
          availability: w.availability,
          distance_km: distance,
          matchesService,
          matchesDistrict,
        };
      })
      .filter((w) => {
        // If service is specified, must match service
        if (service && !w.matchesService) return false;
        // Check radius if lat/lon provided
        if (latStr && lonStr && w.distance_km > radiusKm) return false;
        return true;
      })
      .sort((a, b) => {
        // 1. Same district first if specified
        if (district && district !== 'ALL') {
          if (a.matchesDistrict && !b.matchesDistrict) return -1;
          if (!a.matchesDistrict && b.matchesDistrict) return 1;
        }

        // 2. Available first
        if (a.availability === 'available' && b.availability !== 'available') return -1;
        if (a.availability !== 'available' && b.availability === 'available') return 1;

        // 3. Nearest distance first
        return a.distance_km - b.distance_km;
      });

    return NextResponse.json({
      success: true,
      count: ranked.length,
      data: ranked,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to find nearby technicians' },
      { status: 500 }
    );
  }
}
