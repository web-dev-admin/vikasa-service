import assert from 'assert';
import fs from 'fs';
import path from 'path';

// 1. Load environment variables
const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
}

import { createClient } from '@supabase/supabase-js';
import { POST as createRequestPost } from '../../app/api/requests/route';
import { PATCH as updateStatusPatch } from '../../app/api/requests/[id]/status/route';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log('=== CLIENT BOOKING & VERIFIED CUSTOMER COLUMN COMPREHENSIVE TEST ===\n');

  let testTrackingToken: string | null = null;
  let testRequestId: string | null = null;
  const testPhone = '9876543210';

  try {
    // -------------------------------------------------------------
    // Test 1: Client Booking Insertion Into Supabase
    // -------------------------------------------------------------
    console.log('--- 1. Testing Client Booking Creation & Supabase Storage ---');
    const mockBookingPayload = {
      customer_name: 'Test Booking Client',
      customer_phone: testPhone,
      requester_type: 'client',
      service_name: 'Interior Design',
      service_id: 'srv-interior',
      category_name: 'Interior Design',
      description: 'Comprehensive interior design consultation',
      formatted_address: 'Perundurai Road, Erode, Tamil Nadu',
      district: 'Erode',
      latitude: 11.341,
      longitude: 77.7172,
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time_slot: 'Today (Within 2 Hours)',
    };

    const req = new NextRequest('http://localhost:3000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockBookingPayload),
    });

    const response = await createRequestPost(req);
    const json = await response.json();

    assert.strictEqual(response.status, 200, `Booking creation must return 200, got ${response.status}`);
    assert.strictEqual(json.success, true, 'Booking response must indicate success');
    assert.ok(json.data.request_number, 'Generated booking must have a request_number');
    assert.ok(json.data.tracking_token, 'Generated booking must have a tracking_token');

    testTrackingToken = json.data.tracking_token;
    testRequestId = json.data.full_request?.id || null;

    console.log(`Generated Booking: Request #${json.data.request_number}, Token: ${testTrackingToken}, ID: ${testRequestId}`);

    // Verify it is actually stored in Supabase service_requests table
    const { data: dbRecord, error: dbErr } = await supabase
      .from('service_requests')
      .select('*')
      .eq('tracking_token', testTrackingToken)
      .maybeSingle();

    assert.ok(!dbErr, `Supabase select must not error: ${dbErr?.message}`);
    assert.ok(dbRecord, 'Client booking MUST be permanently saved in Supabase service_requests');
    assert.strictEqual(dbRecord.customer_name, 'Test Booking Client');
    assert.strictEqual(dbRecord.status, 'NEW');
    assert.strictEqual(dbRecord.customer_confirmed, false);
    console.log('✅ PASSED: Client booking is successfully stored in Supabase service_requests');

    // -------------------------------------------------------------
    // Test 2: Customer Phone Interview Verification & Status Update
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Customer Verification Status Update & Supabase Sync ---');
    const verifyReq = new NextRequest(`http://localhost:3000/api/requests/${encodeURIComponent(dbRecord.id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-portal': 'true',
      },
      body: JSON.stringify({
        status: 'CUSTOMER_CONFIRMED',
        note: 'Customer called and verified requirements in Erode',
      }),
    });

    const patchRes = await updateStatusPatch(verifyReq, {
      params: Promise.resolve({ id: dbRecord.id }),
    });
    const patchJson = await patchRes.json();

    assert.strictEqual(patchRes.status, 200, `Status update must return 200, got ${patchRes.status}`);
    assert.strictEqual(patchJson.success, true, 'Status update must indicate success');
    assert.strictEqual(patchJson.data.status, 'CUSTOMER_CONFIRMED');
    assert.strictEqual(patchJson.data.customer_confirmed, true);

    // Verify update was synced to Supabase database
    const { data: updatedDbRecord, error: updateErr } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', dbRecord.id)
      .maybeSingle();

    assert.ok(!updateErr, `Supabase fetch updated record error: ${updateErr?.message}`);
    assert.ok(updatedDbRecord, 'Updated record must exist in Supabase');
    assert.strictEqual(updatedDbRecord.status, 'CUSTOMER_CONFIRMED', 'Status in Supabase must be CUSTOMER_CONFIRMED');
    assert.strictEqual(updatedDbRecord.customer_confirmed, true, 'customer_confirmed in Supabase must be TRUE');
    assert.ok(updatedDbRecord.customer_confirmed_at, 'customer_confirmed_at must be populated with timestamp');
    console.log('✅ PASSED: Customer verification persists status and customer_confirmed: true in Supabase');

    // -------------------------------------------------------------
    // Test 3: Verified Customers Column / Filter Logic Verification
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Verified Customer Column Partitioning ---');
    const { data: allReqs } = await supabase.from('service_requests').select('*');
    assert.ok(Array.isArray(allReqs) && allReqs.length > 0, 'Database must contain requests');

    const verifiedList = allReqs.filter(
      (r) =>
        r.customer_confirmed ||
        r.status === 'CUSTOMER_CONFIRMED' ||
        r.status === 'MATCHING' ||
        r.status === 'WORKER_CONTACTING'
    );
    const newInquiriesList = allReqs.filter(
      (r) => r.status === 'NEW' || r.status === 'CUSTOMER_TO_CALL'
    );

    assert.ok(
      verifiedList.some((r) => r.id === dbRecord.id),
      'The confirmed request must be present in the Verified Customers column/list'
    );
    assert.ok(
      !newInquiriesList.some((r) => r.id === dbRecord.id),
      'The confirmed request must NOT be in the New Inquiries list'
    );
    console.log(`✅ PASSED: Confirmed request correctly moves into Verified Customers (${verifiedList.length}) and out of New Inquiries (${newInquiriesList.length})`);

  } finally {
    // -------------------------------------------------------------
    // Cleanup Test Records
    // -------------------------------------------------------------
    console.log('\n--- Cleanup: Removing test records from Supabase ---');
    if (testTrackingToken) {
      await supabase.from('service_requests').delete().eq('tracking_token', testTrackingToken);
    }
    if (testRequestId) {
      await supabase.from('service_requests').delete().eq('id', testRequestId);
    }
    await supabase.from('customers').delete().eq('phone', testPhone);
    console.log('✅ Cleanup complete.');
  }

  console.log('\n==================================================================');
  console.log('🎉 ALL CLIENT BOOKING & VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
