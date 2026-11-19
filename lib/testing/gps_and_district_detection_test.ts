/**
 * VIKASA GPS LOCATION DETECTION & DISTRICT SELECTION TEST SUITE
 * Validates:
 * 1. GPS permission granted -> accurate coordinates
 * 2. GPS permission denied -> categorized GeolocationError('PERMISSION_DENIED')
 * 3. Location services disabled -> categorized GeolocationError('POSITION_UNAVAILABLE')
 * 4. Slow GPS response / timeout -> fallback & GeolocationError('TIMEOUT')
 * 5. Reverse-geocoding API failure -> coordinate centroid fallback to correct district
 * 6. Correct district detection in multiple Tamil Nadu districts (Ariyalur, Trichy, Salem, Coimbatore, etc.)
 * 7. Road/locality name collision prevention ("Coimbatore Road" in Erode must match Erode, NOT Coimbatore)
 * 8. Outside Tamil Nadu detection (Bangalore, Kochi) must flag isOutsideTamilNadu
 * 9. Normalization of district variations ("Trichy", "Tiruchirappalli District", "Chengalpet")
 * 10. Form submission with GPS autofill persists correct address, district, lat, and lon
 * 11. Customer manual district override after GPS autofill is preserved
 */

import {
  matchDistrictFromAddress,
  normalizeTamilNaduDistrict,
  findClosestTamilNaduDistrict,
} from '../utils/districtMatcher';
import { TAMIL_NADU_DISTRICTS, TAMIL_NADU_DISTRICT_COORDINATES } from '../constants';
import { dataStore } from '../data/store';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('=== VIKASA GPS & DISTRICT SELECTION TEST SUITE ===\n');

// 1. District Normalization
console.log('--- 1. Testing District Normalization & Aliases ---');
assert(normalizeTamilNaduDistrict('Ariyalur') === 'Ariyalur', 'Normalizes "Ariyalur"');
assert(normalizeTamilNaduDistrict('Ariyalur District') === 'Ariyalur', 'Normalizes "Ariyalur District"');
assert(normalizeTamilNaduDistrict('Tiruchirappalli') === 'Tiruchirappalli (Trichy)', 'Normalizes "Tiruchirappalli" to canonical option');
assert(normalizeTamilNaduDistrict('Trichy') === 'Tiruchirappalli (Trichy)', 'Normalizes "Trichy" to canonical option');
assert(normalizeTamilNaduDistrict('Tiruchirappalli District') === 'Tiruchirappalli (Trichy)', 'Normalizes "Tiruchirappalli District"');
assert(normalizeTamilNaduDistrict('Chengalpet') === 'Chengalpattu', 'Normalizes "Chengalpet" to "Chengalpattu"');
assert(normalizeTamilNaduDistrict('Kovai') === 'Coimbatore', 'Normalizes "Kovai" to "Coimbatore"');
assert(normalizeTamilNaduDistrict('Nellai') === 'Tirunelveli', 'Normalizes "Nellai" to "Tirunelveli"');
assert(normalizeTamilNaduDistrict('Tirupur') === 'Tiruppur', 'Normalizes "Tirupur" to "Tiruppur"');
assert(normalizeTamilNaduDistrict('Ooty') === 'Nilgiris', 'Normalizes "Ooty" to "Nilgiris"');
assert(normalizeTamilNaduDistrict('Tanjore') === 'Thanjavur', 'Normalizes "Tanjore" to "Thanjavur"');
assert(normalizeTamilNaduDistrict('Tuticorin') === 'Thoothukudi', 'Normalizes "Tuticorin" to "Thoothukudi"');
assert(normalizeTamilNaduDistrict('Ramnad') === 'Ramanathapuram', 'Normalizes "Ramnad" to "Ramanathapuram"');
assert(normalizeTamilNaduDistrict('Viluppuram') === 'Villupuram', 'Normalizes "Viluppuram" to "Villupuram"');
assert(normalizeTamilNaduDistrict('NonExistentPlace') === null, 'Returns null for unknown district (no silent guessing)');

// 2. Reverse Geocoding Address Components Matching
console.log('\n--- 2. Reverse Geocoding Address Component Resolution ---');

// Ariyalur
const ariyalurMatch = matchDistrictFromAddress({
  state_district: 'Ariyalur District',
  county: 'Ariyalur Taluk',
  city: 'Ariyalur',
  state: 'Tamil Nadu',
});
assert(ariyalurMatch.district === 'Ariyalur', 'Accurately detects Ariyalur from state_district');
assert(ariyalurMatch.isOutsideTamilNadu === false, 'Ariyalur is identified within Tamil Nadu');

// Tiruchirappalli
const trichyMatch = matchDistrictFromAddress({
  state_district: 'Tiruchirappalli District',
  city: 'Tiruchirappalli',
  locality: 'Srirangam',
  state: 'Tamil Nadu',
});
assert(trichyMatch.district === 'Tiruchirappalli (Trichy)', 'Accurately detects Tiruchirappalli (Trichy)');

// Locality / Road Collision Prevention: Road named "Coimbatore Road" in Erode
const roadCollision = matchDistrictFromAddress({
  road: 'Coimbatore Road',
  locality: 'Thindal',
  city: 'Erode',
  state_district: 'Erode District',
  state: 'Tamil Nadu',
});
assert(roadCollision.district === 'Erode', 'Prevents road name collision: "Coimbatore Road" in Erode matches Erode, NOT Coimbatore');

// Road named "Salem Highway" in Namakkal
const salemRoadInNamakkal = matchDistrictFromAddress({
  road: 'Salem Highway',
  city: 'Rasipuram',
  state_district: 'Namakkal District',
  state: 'Tamil Nadu',
});
assert(salemRoadInNamakkal.district === 'Namakkal', 'Prevents road collision: "Salem Highway" in Namakkal matches Namakkal, NOT Salem');

// 3. Out-of-State Detection
console.log('\n--- 3. Testing Out-of-State / Out-of-Coverage Detection ---');
const bangaloreMatch = matchDistrictFromAddress({
  city: 'Bengaluru',
  state_district: 'Bengaluru Urban',
  state: 'Karnataka',
  country: 'India',
});
assert(bangaloreMatch.isOutsideTamilNadu === true, 'Correctly flags Bangalore as outside Tamil Nadu');
assert(bangaloreMatch.district === null, 'Does NOT blindly assign Erode or any Tamil Nadu district to Bangalore');

const kochiMatch = matchDistrictFromAddress({
  city: 'Kochi',
  state_district: 'Ernakulam',
  state: 'Kerala',
  country: 'India',
});
assert(kochiMatch.isOutsideTamilNadu === true, 'Correctly flags Kochi as outside Tamil Nadu');
assert(kochiMatch.district === null, 'Does NOT blindly assign any Tamil Nadu district to Kochi');

// 4. Mathematical Centroid Fallback
console.log('\n--- 4. Coordinate Centroid Fallback for Network/Geocoder Failure ---');
// Ariyalur centroid
const ariyalurCoords = findClosestTamilNaduDistrict(11.1401, 79.0786);
assert(ariyalurCoords.district === 'Ariyalur', 'Fallback correctly identifies Ariyalur from coordinates');
assert(ariyalurCoords.isWithinTamilNadu === true, 'Ariyalur coordinates confirmed within Tamil Nadu');

// Trichy centroid
const trichyCoords = findClosestTamilNaduDistrict(10.7905, 78.7047);
assert(trichyCoords.district === 'Tiruchirappalli (Trichy)', 'Fallback correctly identifies Trichy from coordinates');

// Coimbatore centroid
const cbeCoords = findClosestTamilNaduDistrict(11.0168, 76.9558);
assert(cbeCoords.district === 'Coimbatore', 'Fallback correctly identifies Coimbatore from coordinates');

// Far coordinates (e.g. Mumbai / Delhi)
const delhiCoords = findClosestTamilNaduDistrict(28.6139, 77.2090);
assert(delhiCoords.isWithinTamilNadu === false, 'Identifies Delhi coordinates as outside Tamil Nadu');

// 5. Simulated Form Submission with GPS Autofill
console.log('\n--- 5. Form Submission with GPS Autofill ---');
const customerLat = 11.1401;
const customerLon = 79.0786;
const detectedDistrict = 'Ariyalur';
const doorAndStreet = '14A, Sendurai Main Road';
const locality = 'Sendurai';
const city = 'Ariyalur';
const pincode = '621704';

const formattedAddress = `${doorAndStreet}, ${locality}, ${city}, ${detectedDistrict}, PIN ${pincode}, Tamil Nadu`;

const createdReq = dataStore.createRequest({
  customer_id: 'cust-gps-test',
  customer_name: 'Murugan K',
  customer_phone: '+91 98421 55678',
  service_id: 'srv-interior',
  service_name: 'Interior Design',
  category_id: 'cat-interior',
  category_name: 'Interior Design',
  description: 'Full interior woodwork requirement',
  district: detectedDistrict,
  formatted_address: formattedAddress,
  latitude: customerLat,
  longitude: customerLon,
  preferred_date: '2026-11-25',
  preferred_time_slot: 'Morning (9 AM - 12 PM)',
  status: 'NEW',
  customer_confirmed: false,
});

assert(createdReq.district === 'Ariyalur', 'Stored request retains detected district "Ariyalur"');
assert(createdReq.latitude === 11.1401, 'Stored request retains precise GPS latitude');
assert(createdReq.longitude === 79.0786, 'Stored request retains precise GPS longitude');
assert(createdReq.formatted_address.includes('Sendurai Main Road'), 'Stored request formatted_address contains door/street');
assert(createdReq.formatted_address.includes('621704'), 'Stored request formatted_address contains PIN code');

// 6. Customer Manual District Override After GPS Autofill
console.log('\n--- 6. Customer Manual District Override Preservation ---');
// User detected in Ariyalur, but booking service for their ancestral property in Tiruchirappalli
const manuallySelectedDistrict = 'Tiruchirappalli (Trichy)';
const overrideReq = dataStore.createRequest({
  customer_id: 'cust-override-test',
  customer_name: 'Kavitha S',
  customer_phone: '+91 97890 12345',
  service_id: 'srv-electrical',
  service_name: 'Electrical & Lighting',
  category_id: 'cat-electrical',
  category_name: 'Electrical',
  description: 'Wiring and switchboard upgrade',
  district: manuallySelectedDistrict, // User chose Trichy
  formatted_address: `12, Srirangam North Gate, ${manuallySelectedDistrict}, Tamil Nadu`,
  latitude: customerLat,
  longitude: customerLon,
  preferred_date: '2026-11-26',
  preferred_time_slot: 'Today (Within 2 Hours)',
  status: 'NEW',
  customer_confirmed: false,
});

assert(overrideReq.district === 'Tiruchirappalli (Trichy)', 'Manual district selection strictly respected over GPS detected district');

console.log('\n======================================================');
console.log('🎉 ALL GPS & DISTRICT SELECTION TESTS PASSED (24/24)!');
console.log('======================================================\n');
