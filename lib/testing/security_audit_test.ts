import { dataStore } from '../data/store';

console.log('--- VIKASA PRODUCTION SECURITY & PRIVACY AUDIT ---');

const requests = dataStore.getRequests();
console.log(`Total active requests in store: ${requests.length}`);

// Test 1: Valid tracking token returns strictly limited projection
const req1042 = requests.find((r) => r.request_number === 1042);
if (!req1042) {
  console.error('FAIL: req-1042 not found');
  process.exit(1);
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
if (publicData.request_number !== 1042) throw new Error('Assertion failed: request_number mismatch');
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
  if (key in (publicData as Record<string, unknown>)) {
    console.error(`SECURITY VIOLATION: '${key}' leaked in public projection!`);
    process.exit(1);
  }
}
console.log('✓ PASS: Zero sensitive PII in public tracking projection (no phones, no coordinates, no notes)');

// Test 2: Cannot access by guessing sequential numbers or arbitrary strings
const invalidToken1 = '1042';
const invalidToken2 = 'req-1042';
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
dataStore.assignWorker('req-1042', 'w-mani', 'Audit test assignment');
const assignedPublicData = dataStore.getPublicTrackingStatus(trackingToken);
if (!assignedPublicData) throw new Error('Assigned public data null');

console.log('Assigned Worker Public Field:', assignedPublicData.assigned_worker_first_name);
if (assignedPublicData.assigned_worker_first_name !== 'Manikandan') {
  console.error(`FAIL: Expected first name 'Manikandan', got: ${assignedPublicData.assigned_worker_first_name}`);
  process.exit(1);
}
if ('worker_phone' in (assignedPublicData as Record<string, unknown>)) {
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
