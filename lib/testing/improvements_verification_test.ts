import { dataStore } from '../data/store';
import { TRANSLATIONS } from '../taxonomy/i18n';
import { getHomeServiceWhatsAppUrl } from '../utils/phone';
import { VIKASA_CONFIG, STANDARDIZED_SERVICES } from '../constants';

console.log('=== VIKASA SERVICES IMPROVEMENTS & BUG FIXES VERIFICATION ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${testName}`);
    process.exit(1);
  }
  passedTests++;
  console.log(`✅ PASSED: ${testName}`);
}

// ==========================================
// 1. Technician Registration Tamil Translation
// ==========================================
console.log('\n--- 1. Technician Tamil Translation Tests ---');

assert(Boolean(TRANSLATIONS.en.tech), 'English technician dictionary exists');
assert(Boolean(TRANSLATIONS.ta.tech), 'Tamil technician dictionary exists');

// Verify all keys present in both languages
const enKeys = Object.keys(TRANSLATIONS.en.tech) as (keyof typeof TRANSLATIONS.en.tech)[];
const taKeys = Object.keys(TRANSLATIONS.ta.tech) as (keyof typeof TRANSLATIONS.ta.tech)[];

assert(enKeys.length > 30, `Comprehensive English tech dictionary (${enKeys.length} keys)`);
assert(taKeys.length === enKeys.length, 'English and Tamil technician dictionary key counts match exactly');

for (const key of enKeys) {
  assert(Boolean(TRANSLATIONS.ta.tech[key]), `Tamil translation exists for key: ${String(key)}`);
}

// Verify tradeNames coverage
const activeStandardServices = STANDARDIZED_SERVICES.filter((s) => s.id !== 'srv-other');
for (const s of activeStandardServices) {
  assert(
    Boolean(TRANSLATIONS.en.tech.tradeNames[s.id]),
    `English trade name exists for: ${s.id} (${s.name})`
  );
  assert(
    Boolean(TRANSLATIONS.ta.tech.tradeNames[s.id]),
    `Tamil trade name exists for: ${s.id} (${TRANSLATIONS.ta.tech.tradeNames[s.id]})`
  );
}

// Verify Tamil characters are valid UTF-8
assert(
  TRANSLATIONS.ta.tech.pageTitle.includes('தொழில்நுட்ப'),
  'Tamil page title contains valid Tamil unicode characters'
);
assert(
  TRANSLATIONS.ta.tech.switchLanguage === 'English' && TRANSLATIONS.en.tech.switchLanguage === 'தமிழ்',
  'Language toggle labels correctly flip between தமிழ் and English'
);

// ==========================================
// 2. Real Database & Store Deletion Logic
// ==========================================
console.log('\n--- 2. Record Deletion Logic Tests ---');

// 2a. Customer Deletion
const testCust = dataStore.upsertCustomer({
  full_name: 'Deletable Test Customer',
  phone: '9840199999',
  district: 'Erode',
  address: 'Test Street, Erode',
});
assert(Boolean(testCust.id), 'Test customer created');
assert(Boolean(dataStore.getCustomerById(testCust.id)), 'Test customer retrievable before deletion');

const custDeleted = dataStore.deleteCustomer(testCust.id);
assert(custDeleted, 'deleteCustomer returns true for valid ID');
assert(dataStore.getCustomerById(testCust.id) === null, 'Deleted customer is no longer retrievable');
assert(!dataStore.deleteCustomer('non-existent-id'), 'deleteCustomer returns false for non-existent ID');

// 2b. Request Deletion
const testReq = dataStore.createRequest({
  customer_id: 'cust-temp',
  customer_name: 'Request Delete Test',
  customer_phone: '9840188888',
  service_id: 'srv-plumbing',
  service_name: 'Plumbing',
  category_id: 'cat-plumbing',
  category_name: 'Plumbing',
  description: 'Leak test delete',
  formatted_address: 'Erode',
  district: 'Erode',
  latitude: 11.341,
  longitude: 77.717,
  status: 'NEW',
  customer_confirmed: false,
});
assert(Boolean(testReq.id), 'Test service request created');
assert(Boolean(dataStore.getRequestById(testReq.id)), 'Test service request retrievable');

const reqDeleted = dataStore.deleteRequest(testReq.id);
assert(reqDeleted, 'deleteRequest returns true for valid ID');
assert(!dataStore.getRequestById(testReq.id), 'Deleted request is no longer retrievable');
assert(
  dataStore.getPublicTrackingStatus(testReq.tracking_token) === null,
  'Deleted request cannot be tracked via public token'
);

// 2c. Worker Deletion with Request Unassignment
const testWorker = dataStore.registerWorker({
  full_name: 'Test Plumber Worker',
  phone: '9840177777',
  whatsapp: '9840177777',
  experience_years: 7,
  skills: ['Plumbing'],
  service_ids: ['srv-plumbing'],
  district: 'Erode',
  base_location_name: 'Erode Centre',
  latitude: 11.341,
  longitude: 77.717,
  service_radius_km: 20,
  availability: 'available',
  verification_status: 'pending_verification',
  service_area_names: ['Erode'],
});
assert(Boolean(testWorker.id), 'Test worker registered');

// Create an assigned request for this worker
const assignedReq = dataStore.createRequest({
  customer_id: 'cust-temp-2',
  customer_name: 'Assigned Customer',
  customer_phone: '9840166666',
  service_id: 'srv-plumbing',
  service_name: 'Plumbing',
  category_id: 'cat-plumbing',
  category_name: 'Plumbing',
  description: 'Assigned job test',
  formatted_address: 'Erode',
  district: 'Erode',
  latitude: 11.341,
  longitude: 77.717,
  status: 'ASSIGNED',
  assigned_worker_id: testWorker.id,
  customer_confirmed: true,
});
assert(assignedReq.assigned_worker_id === testWorker.id, 'Request assigned to worker');

// Now delete worker
const workerDeleted = dataStore.deleteWorker(testWorker.id);
assert(workerDeleted, 'deleteWorker returns true');
assert(!dataStore.getWorkerById(testWorker.id), 'Deleted worker is no longer retrievable');

const updatedAssignedReq = dataStore.getRequestById(assignedReq.id);
assert(
  updatedAssignedReq?.assigned_worker_id === null || updatedAssignedReq?.assigned_worker_id === undefined,
  'Active requests assigned to deleted worker are safely unassigned'
);
assert(
  updatedAssignedReq?.status === 'CUSTOMER_CONFIRMED' || updatedAssignedReq?.status === 'NEW',
  'Unassigned request safely reverts status for re-dispatch'
);

// ==========================================
// 3. WhatsApp Pre-filled Message Generator
// ==========================================
console.log('\n--- 3. WhatsApp Home Services Enquiry URL Tests ---');

// 3a. English Default
const urlEn = getHomeServiceWhatsAppUrl();
assert(urlEn.startsWith('https://wa.me/919865652420?text='), 'WhatsApp URL points to wa.me with correct business phone');
const textEn = decodeURIComponent(urlEn.split('?text=')[1]);
assert(textEn.includes('Vikasa Services'), 'English message includes Vikasa Services');
assert(textEn.includes('home service requirement'), 'English message mentions home service requirement');
assert(textEn.includes('General Home Service'), 'Default service placeholder present');

// 3b. English with dynamic parameters
const urlEnCustom = getHomeServiceWhatsAppUrl({
  customerName: 'Karthik S',
  serviceName: 'Plumbing',
  district: 'Erode',
  address: 'Perundurai Road',
  problemDescription: 'Water pressure low in bathroom',
  lang: 'en',
});
const textEnCustom = decodeURIComponent(urlEnCustom.split('?text=')[1]);
assert(textEnCustom.includes('Karthik S'), 'Customer name dynamically injected');
assert(textEnCustom.includes('Plumbing'), 'Service name dynamically injected');
assert(textEnCustom.includes('Perundurai Road, Erode'), 'Location dynamically injected');
assert(textEnCustom.includes('Water pressure low in bathroom'), 'Problem description dynamically injected');

// 3c. Tamil WhatsApp Template
const urlTa = getHomeServiceWhatsAppUrl({
  customerName: 'செல்வம்',
  serviceName: 'மின்சார வேலை (Electrical)',
  district: 'சேலம்',
  lang: 'ta',
});
const textTa = decodeURIComponent(urlTa.split('?text=')[1]);
assert(textTa.includes('வணக்கம்') && (textTa.includes('விகாசா') || textTa.includes('Vikasa')), 'Tamil message includes greeting');
assert(textTa.includes('செல்வம்'), 'Tamil customer name dynamically injected');
assert(textTa.includes('மின்சார வேலை'), 'Tamil service dynamically injected');

// 3d. Config Default URL Check
assert(!VIKASA_CONFIG.whatsappUrl.toLowerCase().includes('interior design quotation'), 'Legacy interior-only quotation text successfully removed');
assert(VIKASA_CONFIG.whatsappUrl.includes('home%20service') || VIKASA_CONFIG.whatsappUrl.includes('home%20services') || decodeURIComponent(VIKASA_CONFIG.whatsappUrl).includes('home service'), 'Config default URL reflects home-services');

// ==========================================
// 4. Admin Freezing Bug Prevention Check
// ==========================================
console.log('\n--- 4. Admin Contact Freezing Fix Verification ---');

// Verify getCustomers is purely idempotent and does not mutate or throw
const customersRun1 = dataStore.getCustomers();
const customersRun2 = dataStore.getCustomers();
assert(customersRun1.length === customersRun2.length, 'getCustomers is idempotent across consecutive calls');

// Verify getCustomerById resolves with clean 10-digit phone fallback
const fallbackCust = dataStore.upsertCustomer({
  full_name: 'Phone Fallback Test',
  phone: '9842754321',
  district: 'Erode',
});
const foundById = dataStore.getCustomerById(fallbackCust.id);
assert(Boolean(foundById) && foundById?.customer.full_name === 'Phone Fallback Test', 'Found customer by direct ID');
const foundByPhone = dataStore.getCustomerById('9842754321');
assert(Boolean(foundByPhone) && foundByPhone?.customer.full_name === 'Phone Fallback Test', 'Found customer by 10-digit phone fallback');
const foundByFormattedPhone = dataStore.getCustomerById('+91 98427 54321');
assert(Boolean(foundByFormattedPhone) && foundByFormattedPhone?.customer.full_name === 'Phone Fallback Test', 'Found customer by formatted phone fallback');

// Cleanup
dataStore.deleteCustomer(fallbackCust.id);

console.log(`\n==================================================`);
console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} assertions verified!`);
console.log(`==================================================\n`);

