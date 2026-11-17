import { dataStore } from '../data/store';

console.log('--- VIKASA PRODUCTION SECURITY & PRIVACY AUDIT ---');

const requests = dataStore.getRequests();
console.log(`Total active requests in store: ${requests.length}`);

// Hermetic test fixtures setup
if (!dataStore.getWorkerById('w-mani')) {
  dataStore.registerWorker({
    id: 'w-mani',
    full_name: 'Manikandan S.',
    phone: '+91 97890 44211',
    experience_years: 5,
    skills: ['Pipe Leakage', 'Tap Fitting'],
    verification_status: 'verified',
    availability: 'available',
    base_location_name: 'Perundurai Road, Erode',
    latitude: 11.3410,
    longitude: 77.7172,
    service_radius_km: 25,
    service_area_names: ['Erode'],
    service_ids: ['srv-plumbing'],
  });
}

let req1042 = requests.find((r) => r.service_id === 'srv-plumbing' && r.district === 'Erode');
if (!req1042) {
  req1042 = dataStore.createRequest({
    customer_id: 'cust-test',
    customer_name: 'Kavitha R.',
    customer_phone: '+91 94433 12345',
    service_id: 'srv-plumbing',
    service_name: 'Plumbing',
    category_id: 'cat-plumbing',
    category_name: 'Plumbing',
    customer_confirmed: true,
    description: 'Pipe leakage under kitchen sink',
    formatted_address: 'Perundurai Road, Erode',
    district: 'Erode',
    latitude: 11.3410,
    longitude: 77.7172,
    status: 'NEW',
    preferred_date: '2026-11-20',
  });
}

const trackingToken = req1042.tracking_token;
console.log(`Testing with valid tracking token: ${trackingToken}`);

const publicData = dataStore.getPublicTrackingStatus(trackingToken);
if (!publicData) {
  console.error('FAIL: getPublicTrackingStatus returned null for valid token');
  process.exit(1);
}

// Assertion 1: Check allowed fields exist
console.log('Public Data Keys:', Object.keys(publicData));
if (publicData.request_number !== req1042.request_number) throw new Error('Assertion failed: request_number mismatch');
if (!publicData.service_name) throw new Error('Assertion failed: service_name missing');
if (!publicData.general_area) throw new Error('Assertion failed: general_area missing');

// Assertion 2: PII checks - MUST NOT EXIST
const forbiddenKeys = [
  'customer_phone',
  'customer_name',
  'worker_phone',
  'worker_name',
  'latitude',
  'longitude',
  'coordinates',
  'admin_notes',
  'notes',
  'audit_logs',
  'utm_source',
];

for (const key of forbiddenKeys) {
  if (key in (publicData as unknown as Record<string, unknown>)) {
    console.error(`SECURITY VIOLATION: '${key}' leaked in public projection!`);
    process.exit(1);
  }
}
console.log('✓ PASS: Zero sensitive PII in public tracking projection (no phones, no coordinates, no notes)');

// Test 2: Cannot access by guessing sequential numbers or arbitrary strings
const invalidToken1 = String(req1042.request_number);
const invalidToken2 = req1042.id;
const invalidToken3 = 'e7b1a234-8c90-4d56-a123-000000000000'; // Non-existent UUID

if (dataStore.getPublicTrackingStatus(invalidToken1) !== null) {
  console.error('SECURITY VIOLATION: Sequential number allowed as token!');
  process.exit(1);
}
if (dataStore.getPublicTrackingStatus(invalidToken2) !== null) {
  console.error('SECURITY VIOLATION: Internal ID allowed as token!');
  process.exit(1);
}
if (dataStore.getPublicTrackingStatus(invalidToken3) !== null) {
  console.error('SECURITY VIOLATION: Guessed non-existent UUID allowed!');
  process.exit(1);
}
console.log('✓ PASS: Invalid, sequential, and guessed tokens return null (IDOR prevented)');

// Test 3: Test assigned worker projection privacy
dataStore.assignWorker(req1042.id, 'w-mani', 'Audit test assignment');
const assignedPublicData = dataStore.getPublicTrackingStatus(trackingToken);
if (!assignedPublicData) throw new Error('Assigned public data null');

console.log('Assigned Worker Public Field:', assignedPublicData.assigned_worker_first_name);
if (assignedPublicData.assigned_worker_first_name !== 'Manikandan') {
  console.error(`FAIL: Expected first name 'Manikandan', got: ${assignedPublicData.assigned_worker_first_name}`);
  process.exit(1);
}
if ('worker_phone' in (assignedPublicData as unknown as Record<string, unknown>)) {
  console.error('SECURITY VIOLATION: worker_phone leaked after assignment!');
  process.exit(1);
}
console.log('✓ PASS: Worker privacy preserved on assignment (first name only, zero phone exposed)');

// Test 4: Worker availability sync
const mani = dataStore.getWorkerById('w-mani');
if (mani?.availability !== 'busy') {
  console.error('FAIL: Worker availability was not updated to busy!');
  process.exit(1);
}
console.log('✓ PASS: Worker availability automatically updated to BUSY upon assignment');

console.log('--- ALL SECURITY & PRIVACY UNIT TESTS PASSED ---');
