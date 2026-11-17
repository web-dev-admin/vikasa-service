import { dataStore } from '../data/store';
import { getDistrictCoordinates, TAMIL_NADU_DISTRICTS } from '../constants';
import {
  generateShareableJobLocationWhatsAppMessage,
  getUniversalWhatsAppShareUrl,
  getGoogleMapsUrl,
} from '../utils/phone';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('=== VIKASA CALL VALIDATION, PINPOINT GPS & ALLOCATION SHARE TEST SUITE ===\n');

// 1. District Centroid Coordinates & Snapping
console.log('--- 1. District Centroid & Pinpoint GPS Tests ---');
const erodeCoords = getDistrictCoordinates('Erode');
assert(erodeCoords.lat === 11.3410 && erodeCoords.lon === 77.7172, 'Erode centroid matches exact coordinates');

const chennaiCoords = getDistrictCoordinates('Chennai');
assert(chennaiCoords.lat === 13.0827 && chennaiCoords.lon === 80.2707, 'Chennai centroid matches exact coordinates');

const trichyCoords = getDistrictCoordinates('Tiruchirappalli (Trichy)');
assert(trichyCoords.lat === 10.7905 && trichyCoords.lon === 78.7047, 'Trichy centroid matches exact coordinates with parens');

const fuzzyTrichy = getDistrictCoordinates('Trichy');
assert(fuzzyTrichy.lat === 10.7905 && fuzzyTrichy.lon === 78.7047, 'Trichy centroid matches with fuzzy short name');

for (const d of TAMIL_NADU_DISTRICTS) {
  const coords = getDistrictCoordinates(d);
  assert(
    typeof coords.lat === 'number' && typeof coords.lon === 'number' && coords.lat > 8 && coords.lat < 14,
    `District centroid defined within Tamil Nadu bounds for "${d}"`
  );
}

// 2. Candidate Call Validation Gate Tests
console.log('\n--- 2. Candidate Call Validation Gate Tests ---');
const candidate = dataStore.registerWorker({
  full_name: 'Test Technician Validation',
  phone: '9842199999',
  skills: ['Electrical & Lighting', 'Carpentry & Plywood Work'],
  service_ids: ['srv-electrical'],
  district: 'Erode',
  base_location_name: 'Erode, Tamil Nadu',
  experience_years: 4,
  verification_status: 'pending_verification',
  availability: 'available',
  latitude: 11.3410,
  longitude: 77.7172,
  service_radius_km: 20,
  service_area_names: ['Erode'],
});

assert(candidate.verification_status === 'pending_verification', 'New worker defaults to pending_verification');
assert(!candidate.call_validated, 'New worker defaults to call_validated === false/undefined');

// Validate call
const validatedWorker = dataStore.validateWorkerCall(
  candidate.id,
  'Spoke with candidate via phone. Verified 4 years wiring experience and valid ID.'
);

assert(Boolean(validatedWorker), 'validateWorkerCall returned worker object');
assert(validatedWorker?.call_validated === true, 'Worker call_validated is now true');
assert(Boolean(validatedWorker?.call_validated_at), 'Worker has call_validated_at timestamp');
assert(
  validatedWorker?.call_notes?.includes('Verified 4 years wiring experience') === true,
  'Worker call_notes recorded accurately'
);

// Worker can now be approved and verified
const verifiedWorker = dataStore.verifyWorker(candidate.id, 'admin-tester', 'All checks passed');
assert(verifiedWorker?.verification_status === 'verified', 'Worker verification status is now verified');
assert(verifiedWorker?.call_validated === true, 'Worker call_validated remains true after verification');

// 3. Post-Allocation Location Sharing Tests
console.log('\n--- 3. Post-Allocation Single Share Button Tests ---');

// Create test booking
const req = dataStore.createRequest({
  customer_id: 'cust-test-share',
  customer_name: 'Ramesh Sundaram',
  customer_phone: '9876543210',
  service_id: 'srv-electrical',
  service_name: 'Electrical & Lighting',
  category_id: 'cat-electrical',
  category_name: 'Electrical',
  description: 'Main distribution box breaker tripping repeatedly',
  preferred_date: '2026-11-20',
  preferred_time_slot: 'Morning (9 AM - 12 PM)',
  district: 'Erode',
  formatted_address: 'No 45, Nasiyanur Road, Erode, Tamil Nadu 638011',
  latitude: 11.341052,
  longitude: 77.717281,
  status: 'NEW',
  urgency: 'high',
  customer_confirmed: true,
});

// Case A: Before Allocation (assigned_worker_id is undefined)
assert(!req.assigned_worker_id, 'Request starts unallocated (assigned_worker_id is null/undefined)');

// Case B: Allocate Technician to Request
const assignment = dataStore.assignWorker(req.id, candidate.id);
assert(Boolean(assignment), 'Technician successfully assigned to request');

const assignedReq = dataStore.getRequestById(req.id)!;
assert(assignedReq.assigned_worker_id === candidate.id, 'Request assigned_worker_id matches candidate');
assert(assignedReq.status.toLowerCase() === 'assigned', 'Request status is now assigned');

// Format single share message
const shareMessage = generateShareableJobLocationWhatsAppMessage({
  requestNumber: assignedReq.request_number,
  customerName: assignedReq.customer_name,
  customerPhone: assignedReq.customer_phone,
  serviceName: assignedReq.service_name,
  district: assignedReq.district,
  formattedAddress: assignedReq.formatted_address,
  latitude: assignedReq.latitude,
  longitude: assignedReq.longitude,
  preferredDate: assignedReq.preferred_date,
  preferredTimeSlot: assignedReq.preferred_time_slot,
  description: assignedReq.description,
  technicianName: assignedReq.assigned_worker_name,
});

assert(shareMessage.includes('VIKASA SERVICES – JOB DISPATCH ORDER'), 'Message has dispatch header');
assert(shareMessage.includes('Ramesh Sundaram'), 'Message includes customer name');
assert(shareMessage.includes('+91 9876543210'), 'Message includes customer phone');
assert(shareMessage.includes('Electrical & Lighting'), 'Message includes service name');
assert(shareMessage.includes('No 45, Nasiyanur Road, Erode'), 'Message includes address');
assert(shareMessage.includes('maps.google.com/?q=11.341052,77.717281'), 'Message includes 6-decimal exact GPS Google Maps link');

// Share URL targeted to allocated technician's phone
const targetedShareUrl = getUniversalWhatsAppShareUrl(shareMessage, candidate.phone);
assert(targetedShareUrl.startsWith('https://wa.me/919842199999'), 'Share URL directly targets allocated technician WhatsApp');
assert(targetedShareUrl.includes(encodeURIComponent('Ramesh Sundaram')), 'Share URL encodes customer name correctly');
assert(targetedShareUrl.includes(encodeURIComponent('11.341052,77.717281')), 'Share URL encodes exact GPS coordinates');

// Clean up
dataStore.deleteWorker(candidate.id);
dataStore.deleteRequest(req.id);

console.log('\n==================================================');
console.log('ALL TESTS PASSED: 100% of Call Validation, Pinpoint GPS & Allocation Share verified!');
console.log('==================================================');
