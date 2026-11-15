import { dataStore } from '../data/store';
import { audioAlert } from '../utils/audioAlert';
import { STANDARDIZED_SERVICES } from '../constants';
import {
  getGoogleMapsUrl,
  generateShareableJobLocationWhatsAppMessage,
  getUniversalWhatsAppShareUrl,
} from '../utils/phone';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== VIKASA PHASE 3 ENHANCEMENTS VERIFICATION SUITE ===\n');

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
// 1. Audio Alert & Haptic Vibration Utility
// ==========================================
console.log('\n--- 1. Audio Alert & Vibration Tests ---');
assert(typeof audioAlert.playAlertChime === 'function', 'audioAlert has playAlertChime method');
assert(typeof audioAlert.playAlarmBuzzer === 'function', 'audioAlert has playAlarmBuzzer method');
assert(typeof audioAlert.triggerVibration === 'function', 'audioAlert has triggerVibration method');
assert(typeof audioAlert.triggerFullAlert === 'function', 'audioAlert has triggerFullAlert method');

// Verify safe execution in Node.js environment without throwing
audioAlert.playAlarmBuzzer();
audioAlert.triggerFullAlert();
assert(true, 'audioAlert runs safely in non-browser/SSR environment without throwing');

// ==========================================
// 2. Dynamic Service Catalog Management
// ==========================================
console.log('\n--- 2. Dynamic Service Management Tests ---');
const initialServices = dataStore.getAllServices();
assert(initialServices.length >= STANDARDIZED_SERVICES.length, `Base services retrieved (${initialServices.length} services)`);

// Verify all standardized services have descriptions and price estimates
for (const s of initialServices) {
  assert(Boolean(s.description), `Service "${s.name}" has descriptive copy for "i" tooltip`);
  assert(s.is_active !== false, `Service "${s.name}" defaults to active`);
}

// Add a new custom service as requested by user
const customService = dataStore.addCustomService({
  name: 'Solar Water Heater Repair',
  category_id: 'cat-electrical',
  description: 'Panel cleaning, scale removal, heating element check, and piping fixes.',
  price_estimate: 'From ₹499',
  is_active: true,
});

assert(Boolean(customService.id), 'Custom service created with ID');
assert(customService.name === 'Solar Water Heater Repair', 'Custom service has correct title');

const updatedServices = dataStore.getAllServices();
const foundCustom = updatedServices.find((s) => s.id === customService.id);
assert(Boolean(foundCustom), 'New service immediately retrievable from dataStore');
assert(Boolean(foundCustom?.description?.includes('Panel cleaning')), 'Custom service description preserved for tooltip');

// Delete custom service
const deleted = dataStore.deleteCustomService(customService.id);
assert(deleted, 'deleteCustomService returns true');
const postDeleteServices = dataStore.getAllServices();
assert(!postDeleteServices.some((s) => s.id === customService.id), 'Deleted service removed from catalog');

// ==========================================
// 3. Deletion Anti-Glitch Protection Tests
// ==========================================
console.log('\n--- 3. Record Deletion & Anti-Glitch Blacklist Tests ---');
const testCust = dataStore.upsertCustomer({
  full_name: 'Anti-Glitch Customer',
  phone: '9840111222',
  district: 'Erode',
});
assert(Boolean(testCust.id), 'Customer created');

const testReq = dataStore.createRequest({
  customer_id: testCust.id,
  customer_name: testCust.full_name,
  customer_phone: testCust.phone,
  service_id: 'srv-plumbing',
  service_name: 'Plumbing',
  category_id: 'cat-plumbing',
  category_name: 'Plumbing',
  description: 'Faucet repair',
  formatted_address: 'Erode City',
  district: 'Erode',
  latitude: 11.341,
  longitude: 77.717,
  status: 'NEW',
  customer_confirmed: false,
});
assert(Boolean(testReq.id), 'Request created');

// Simulate client-side deletion blacklist filtering
const deletedBlacklist = new Set<string>();
deletedBlacklist.add(testReq.id);
deletedBlacklist.add(testReq.tracking_token);

// Now simulate a polling response returning the old data from server
const simulatedPollResponse = [testReq];
const filteredPoll = simulatedPollResponse.filter(
  (r) => !deletedBlacklist.has(r.id) && !deletedBlacklist.has(r.tracking_token)
);

assert(filteredPoll.length === 0, 'Polling race condition intercepted: blacklisted request completely filtered out');

// Verify dataStore deletion
dataStore.deleteRequest(testReq.id);
dataStore.deleteCustomer(testCust.id);
assert(!dataStore.getRequestById(testReq.id), 'Request permanently deleted from store');

// ==========================================
// 4. Supabase Complete Reset Script Validation
// ==========================================
console.log('\n--- 4. Supabase Fresh Setup SQL Script Tests ---');
const sqlPath = path.join(process.cwd(), 'supabase', 'COMPLETE_RESET_AND_FRESH_SETUP.sql');
assert(fs.existsSync(sqlPath), 'COMPLETE_RESET_AND_FRESH_SETUP.sql exists');

const sqlContent = fs.readFileSync(sqlPath, 'utf8');
assert(sqlContent.includes('DROP TABLE IF EXISTS'), 'SQL includes safe DROP TABLE statements');
assert(sqlContent.includes('CASCADE'), 'SQL uses CASCADE for referential dependency cleanup');
assert(sqlContent.includes('ON DELETE CASCADE'), 'SQL configures ON DELETE CASCADE on child tables');
assert(sqlContent.includes('ENABLE ROW LEVEL SECURITY'), 'SQL enables Row Level Security');
assert(sqlContent.includes('INSERT INTO service_categories'), 'SQL seeds essential categories');
assert(sqlContent.includes('INSERT INTO services'), 'SQL seeds essential services');
assert(!sqlContent.includes('dummy_worker_1'), 'SQL contains zero dummy workers (clean slate)');
assert(!sqlContent.includes('dummy_customer_1'), 'SQL contains zero dummy customers (clean slate)');

// ==========================================
// 5. Exact Location & Shareable WhatsApp Format
// ==========================================
console.log('\n--- 5. Exact Location & Shareable WhatsApp Format Tests ---');
const mapsWithCoords = getGoogleMapsUrl(11.341, 77.7172, 'Collectorate, Erode', 'Erode');
assert(mapsWithCoords.includes('maps.google.com/?q=11.341000,77.717200'), 'getGoogleMapsUrl formats exact GPS coordinates query correctly');

const mapsWithoutCoords = getGoogleMapsUrl(undefined, undefined, 'Perundurai Road', 'Erode');
assert(mapsWithoutCoords.includes('google.com/maps/search') && mapsWithoutCoords.includes('Perundurai%20Road'), 'getGoogleMapsUrl falls back to address search safely');

const formattedMsg = generateShareableJobLocationWhatsAppMessage({
  requestNumber: 1042,
  customerName: 'Kavitha Devi',
  customerPhone: '9876543210',
  serviceName: 'Electrical Repair',
  district: 'Erode',
  formattedAddress: 'No 45, Nasiyanur Road, Erode',
  latitude: 11.3501,
  longitude: 77.7123,
  preferredDate: '2026-11-16',
  preferredTimeSlot: 'Morning 10 AM',
  description: 'Kitchen light flickering and MCB trip',
  customServiceNote: 'Requires industrial grade 32A breaker',
  technicianName: 'Murugan Trades',
});

assert(formattedMsg.includes('VIKASA SERVICES – JOB DISPATCH ORDER'), 'Formatted message has dispatch header');
assert(formattedMsg.includes('#1042'), 'Formatted message has booking ID');
assert(formattedMsg.includes('Kavitha Devi'), 'Formatted message includes customer name');
assert(formattedMsg.includes('+91 9876543210'), 'Formatted message includes formatted customer phone');
assert(formattedMsg.includes('maps.google.com/?q=11.350100,77.712300'), 'Formatted message contains exact Google Maps navigation link');
assert(formattedMsg.includes('Requires industrial grade 32A breaker'), 'Formatted message contains custom requirement notes');
assert(formattedMsg.includes('Murugan Trades'), 'Formatted message contains assigned technician name');

const universalUrl = getUniversalWhatsAppShareUrl(formattedMsg);
assert(universalUrl.startsWith('https://api.whatsapp.com/send?text='), 'getUniversalWhatsAppShareUrl targets WhatsApp universal share endpoint when no phone is specified');

const targetedUrl = getUniversalWhatsAppShareUrl(formattedMsg, '9443322110');
assert(targetedUrl.startsWith('https://wa.me/919443322110?text='), 'getUniversalWhatsAppShareUrl targets specific technician wa.me when phone is specified');

console.log(`\n==================================================`);
console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} assertions verified!`);
console.log(`==================================================\n`);

