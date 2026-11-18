import { dataStore } from '../data/store';
import { ServiceRequest, Worker } from '../../types';
import assert from 'assert';

console.log('=====================================================');
console.log('VIKASA PLATFORM: COMPREHENSIVE DELETE OPERATIONS TEST');
console.log('=====================================================');

async function runDeleteTests() {
  let passed = 0;
  const total = 27;

  // -------------------------------------------------------------------------
  // TEST 1: Service Request Creation and Permanent Deletion
  // -------------------------------------------------------------------------
  console.log('\n--- 1. Testing Service Request Permanent Deletion ---');
  const req1 = dataStore.createRequest({
    customer_name: 'Test Delete Homeowner',
    customer_phone: '9842199991',
    category_id: 'cat-electrical',
    category_name: 'Electrical',
    service_id: 'srv-electrical',
    service_name: 'Electrical Repair',
    description: 'Electrical wiring issue in kitchen',
    customer_confirmed: false,
    district: 'Erode',
    formatted_address: '123 Perundurai Road, Erode',
    latitude: 11.341,
    longitude: 77.717,
    status: 'NEW',
    preferred_date: '2026-11-20',
    preferred_time_slot: 'Morning',
  });

  assert(req1 && req1.id, 'Request 1 created successfully');
  passed++;
  console.log(`[PASS] Request 1 created with ID: ${req1.id}, token: ${req1.tracking_token}`);

  const existsBefore = dataStore.getRequestById(req1.id);
  assert(existsBefore !== undefined, 'Request exists before deletion');
  passed++;

  // Execute deletion
  const delReqResult = dataStore.deleteRequest(req1.id);
  assert(delReqResult === true, 'deleteRequest returns true');
  passed++;

  // Verify request is gone
  const existsAfter = dataStore.getRequestById(req1.id);
  assert(existsAfter === undefined, 'Request is undefined after deletion');
  passed++;

  const listAfter = dataStore.getRequests().find((r) => r.id === req1.id || r.tracking_token === req1.tracking_token);
  assert(listAfter === undefined, 'Request does not appear in getRequests()');
  passed++;
  console.log('[PASS] Service request completely removed from memory and storage');

  // Test anti-resurrection upon mergeRequests
  dataStore.mergeRequests([req1]);
  const resurrectedReq = dataStore.getRequestById(req1.id);
  assert(resurrectedReq === undefined, 'Deleted request NEVER resurrects via mergeRequests');
  passed++;
  console.log('[PASS] mergeRequests strictly suppresses deleted requests via deletedRequestIds');

  // -------------------------------------------------------------------------
  // TEST 2: Customer Suggestion ("Others Request") Deletion
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Testing Customer Suggestion ("Others Request") Deletion ---');
  const customSuggestionReq = dataStore.createRequest({
    customer_name: 'Custom Service Requester',
    customer_phone: '9842199992',
    category_id: 'cat-general',
    category_name: 'Custom Category',
    service_id: 'srv-other',
    service_name: 'Other Custom Service',
    description: 'Terrace garden lighting and solar setup',
    customer_confirmed: false,
    custom_service_note: 'Terrace Garden Solar Light Installation',
    district: 'Salem',
    formatted_address: 'Fairlands, Salem',
    latitude: 11.664,
    longitude: 78.146,
    status: 'NEW',
    preferred_date: '2026-11-21',
    preferred_time_slot: 'Afternoon',
  });

  assert(customSuggestionReq && customSuggestionReq.id, 'Customer suggestion created');
  passed++;

  // Verify it qualifies as customer suggestion
  const isOther =
    customSuggestionReq.service_id === 'srv-other' ||
    customSuggestionReq.service_name.toLowerCase().includes('other') ||
    Boolean(customSuggestionReq.custom_service_note);
  assert(isOther === true, 'Qualifies as customer suggestion for Suggestions Hub');
  passed++;

  // Delete customer suggestion
  dataStore.deleteRequest(customSuggestionReq.id);
  assert(!dataStore.getRequestById(customSuggestionReq.id), 'Customer suggestion deleted');
  passed++;

  // Verify it is excluded from getRequests()
  const inSuggestions = dataStore.getRequests().find((r) => r.id === customSuggestionReq.id);
  assert(inSuggestions === undefined, 'Customer suggestion absent from suggestions queue');
  passed++;
  console.log('[PASS] Customer custom suggestion ("others request") deleted permanently');

  // -------------------------------------------------------------------------
  // TEST 3: Technician Deletion and Foreign Key Unlinking
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Testing Technician Deletion & Foreign Key Unlinking ---');
  const worker1 = dataStore.registerWorker({
    full_name: 'Muthusamy Carpenter',
    phone: '9842199993',
    district: 'Coimbatore',
    skills: ['Carpentry & Woodwork'],
    service_ids: ['srv-carpentry'],
    experience_years: 12,
    service_radius_km: 25,
    service_area_names: ['Gandhipuram', 'RS Puram'],
    base_location_name: 'Gandhipuram, Coimbatore',
    latitude: 11.016,
    longitude: 76.955,
    availability: 'available',
    active_status: 'active',
    verification_status: 'verified',
  });

  assert(worker1 && worker1.id, 'Technician registered successfully');
  passed++;
  console.log(`[PASS] Technician registered with ID: ${worker1.id}`);

  // Create a request and allocate it to this worker
  const reqToAssign = dataStore.createRequest({
    customer_name: 'Homeowner Requiring Carpenter',
    customer_phone: '9842199994',
    category_id: 'cat-carpentry',
    category_name: 'Carpentry',
    service_id: 'srv-carpentry',
    service_name: 'Carpentry & Woodwork',
    description: 'Wardrobe hinge repair',
    customer_confirmed: false,
    district: 'Coimbatore',
    formatted_address: 'RS Puram, Coimbatore',
    latitude: 11.012,
    longitude: 76.945,
    status: 'NEW',
  });

  dataStore.assignWorker(reqToAssign.id, worker1.id);
  const assignedReq = dataStore.getRequestById(reqToAssign.id);
  assert(assignedReq?.assigned_worker_id === worker1.id, 'Worker assigned to request');
  passed++;
  console.log('[PASS] Worker allocated to request prior to deletion');

  // Delete the worker
  const delWorkerResult = dataStore.deleteWorker(worker1.id);
  assert(delWorkerResult === true, 'deleteWorker returns true');
  passed++;

  // Verify worker is gone from getWorkers() and getWorkerById()
  assert(dataStore.getWorkerById(worker1.id) === undefined, 'Worker not retrievable by getWorkerById');
  passed++;
  assert(!dataStore.getWorkers().some((w) => w.id === worker1.id), 'Worker not present in getWorkers()');
  passed++;

  // Verify the active request was cleanly unassigned
  const reqAfterWorkerDel = dataStore.getRequestById(reqToAssign.id);
  assert(reqAfterWorkerDel?.assigned_worker_id === undefined, 'Request assigned_worker_id is cleanly unlinked/undefined');
  passed++;
  assert(reqAfterWorkerDel?.status === 'CUSTOMER_CONFIRMED', 'Request status restored to CUSTOMER_CONFIRMED');
  passed++;
  console.log('[PASS] Active request foreign key cleanly unlinked without orphaned references');

  // Verify anti-resurrection on mergeWorkers
  dataStore.mergeWorkers([worker1]);
  assert(dataStore.getWorkerById(worker1.id) === undefined, 'Deleted worker NEVER resurrects via mergeWorkers');
  passed++;
  console.log('[PASS] mergeWorkers strictly suppresses deleted workers via deletedWorkerIds');

  // -------------------------------------------------------------------------
  // TEST 4: Technician Trade Suggestion Dismissal vs Permanent Deletion
  // -------------------------------------------------------------------------
  console.log('\n--- 4. Testing Technician Trade Suggestion Dismissal vs Deletion ---');
  const techWithTrade = dataStore.registerWorker({
    full_name: 'Suresh Sound Engineer',
    phone: '9842199995',
    district: 'Tiruppur',
    skills: ['Home Automation & Audio Setup'],
    service_ids: ['srv-general'],
    custom_trade_note: 'Acoustic Soundproofing & Studio Setup',
    has_custom_skill: true,
    experience_years: 8,
    service_radius_km: 30,
    service_area_names: ['Avinashi Road', 'Tiruppur Central'],
    base_location_name: 'Avinashi Road, Tiruppur',
    latitude: 11.108,
    longitude: 77.341,
    availability: 'available',
    active_status: 'active',
    verification_status: 'verified',
  });

  assert(techWithTrade.custom_trade_note !== undefined, 'Technician has custom trade note');
  passed++;

  // Test mode A: Dismiss trade suggestion (keeps technician, clears custom note)
  dataStore.updateWorker(techWithTrade.id, {
    custom_trade_note: undefined,
    has_custom_skill: false,
  });

  const updatedTech = dataStore.getWorkerById(techWithTrade.id);
  assert(updatedTech !== undefined, 'Technician remains in database');
  passed++;
  assert(updatedTech?.custom_trade_note === undefined, 'Custom trade note removed');
  passed++;
  assert(updatedTech?.has_custom_skill === false, 'has_custom_skill set to false');
  passed++;
  console.log('[PASS] Dismiss Trade Suggestion removes custom trade note while preserving technician');

  // Test mode B: Permanent deletion of technician
  dataStore.deleteWorker(techWithTrade.id);
  assert(dataStore.getWorkerById(techWithTrade.id) === undefined, 'Technician permanently deleted');
  passed++;

  // Clean up test request
  dataStore.deleteRequest(reqToAssign.id);

  // -------------------------------------------------------------------------
  // TEST 5: Customer Deletion
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Testing Customer Profile Permanent Deletion ---');
  const testCustomer = dataStore.upsertCustomer({
    full_name: 'Test Customer Profile',
    phone: '9842199999',
    district: 'Erode',
  });

  assert(testCustomer && testCustomer.id, 'Customer created');
  passed++;

  const custBefore = dataStore.getCustomerById(testCustomer.id);
  assert(custBefore !== null, 'Customer exists before deletion');
  passed++;

  dataStore.deleteCustomer(testCustomer.id);
  const custAfter = dataStore.getCustomerById(testCustomer.id);
  assert(custAfter === null, 'Customer is null after deleteCustomer');
  passed++;
  assert(!dataStore.getCustomers().some((c) => c.id === testCustomer.id || c.phone === testCustomer.phone), 'Customer absent from getCustomers()');
  passed++;
  console.log('[PASS] Customer profile and phone permanently suppressed');

  console.log('=====================================================');
  console.log(`ALL DELETE OPERATIONS TESTS PASSED (${passed}/${total})`);
  console.log('=====================================================');
}

runDeleteTests().catch((err) => {
  console.error('DELETE TEST FAILED:', err);
  process.exit(1);
});
