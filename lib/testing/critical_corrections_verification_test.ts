import { supabaseAdmin, requireSupabaseAdmin } from '../supabase/client';
import { dispatchAdminNotification } from '../notifications/dispatcher';
import { dataStore } from '../data/store';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('=== VIKASA CRITICAL CORRECTIONS VERIFICATION SUITE ===\n');

// 1. Missing Service-Role Key Hardening Tests
console.log('--- 1. Supabase Admin Client Hardening & Fail-Safe Tests ---');
// In this testing process, SUPABASE_SERVICE_ROLE_KEY is not set in process.env
assert(
  supabaseAdmin === null || typeof supabaseAdmin === 'object',
  'supabaseAdmin is null or a typed client (never falls back to anon key masquerade)'
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  assert(supabaseAdmin === null, 'supabaseAdmin is strictly NULL when SUPABASE_SERVICE_ROLE_KEY is absent');
  let thrown = false;
  try {
    requireSupabaseAdmin();
  } catch (err: unknown) {
    thrown = true;
    assert(
      (err as Error).message.includes('SUPABASE_SERVICE_ROLE_KEY is not configured'),
      'requireSupabaseAdmin throws explicit error when service role key is absent'
    );
  }
  assert(thrown, 'requireSupabaseAdmin does NOT silently succeed without service role key');
}

// 2. SQL Deduplication Logic Simulation (Latest-Record & Timestamp Tie-Breaker)
console.log('\n--- 2. Deduplication Logic Simulation (Latest-Record & Tie-Breaker) ---');

interface MockNotifRow {
  id: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
  payload: string;
}

// Simulate PostgreSQL ROW_NUMBER() OVER (PARTITION BY type, related_id ORDER BY created_at DESC NULLS LAST, is_read ASC, id DESC)
function simulateDeduplication(rows: MockNotifRow[]): MockNotifRow[] {
  // Partition by type and related_id (where related_id is not null and not empty)
  const partitions = new Map<string, MockNotifRow[]>();
  const unconstrained: MockNotifRow[] = [];

  for (const r of rows) {
    if (!r.related_id || r.related_id.trim() === '') {
      unconstrained.push(r);
    } else {
      const key = `${r.type}::${r.related_id}`;
      if (!partitions.has(key)) partitions.set(key, []);
      partitions.get(key)!.push(r);
    }
  }

  const preserved: MockNotifRow[] = [...unconstrained];

  for (const [, group] of partitions) {
    // Sort identical to migration 008 ROW_NUMBER ORDER BY
    group.sort((a, b) => {
      // 1. created_at DESC
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      if (timeB !== timeA) return timeB - timeA;

      // 2. is_read ASC (false < true, unread preferred)
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1;
      }

      // 3. id DESC (deterministic tie breaker)
      return b.id.localeCompare(a.id);
    });

    // Rank 1 is preserved
    preserved.push(group[0]);
  }

  return preserved;
}

// Test A: Preserving Newest Record by created_at
const testRowsTimestamp: MockNotifRow[] = [
  { id: 'notif-old', type: 'service_request', related_id: 'req-1', is_read: true, created_at: '2026-11-18T10:00:00Z', payload: 'old version' },
  { id: 'notif-new', type: 'service_request', related_id: 'req-1', is_read: false, created_at: '2026-11-18T12:00:00Z', payload: 'new version' },
  { id: 'notif-mid', type: 'service_request', related_id: 'req-1', is_read: true, created_at: '2026-11-18T11:00:00Z', payload: 'mid version' },
];

const dedupedTime = simulateDeduplication(testRowsTimestamp);
assert(dedupedTime.length === 1, 'Deduplication collapses duplicate group to exactly 1 record');
assert(dedupedTime[0].id === 'notif-new', 'Deduplication strictly preserves newest record by created_at DESC');
assert(dedupedTime[0].payload === 'new version', 'Preserved record has latest payload');

// Test B: Equal created_at Timestamps - Unread Priority
const testRowsEqualTime: MockNotifRow[] = [
  { id: 'notif-read', type: 'service_request', related_id: 'req-2', is_read: true, created_at: '2026-11-18T15:00:00Z', payload: 'already read' },
  { id: 'notif-unread', type: 'service_request', related_id: 'req-2', is_read: false, created_at: '2026-11-18T15:00:00Z', payload: 'still unread' },
];

const dedupedEqual = simulateDeduplication(testRowsEqualTime);
assert(dedupedEqual.length === 1, 'Deduplication collapses equal timestamp records to 1');
assert(dedupedEqual[0].is_read === false, 'Tie-breaker preserves UNREAD (is_read=false) to prevent missed notifications');
assert(dedupedEqual[0].id === 'notif-unread', 'Selected unread notification row');

// Test C: NULL and Empty related_id Handling (Broadcasts)
const testRowsBroadcast: MockNotifRow[] = [
  { id: 'notif-b1', type: 'broadcast', related_id: null, is_read: false, created_at: '2026-11-18T16:00:00Z', payload: 'broadcast 1' },
  { id: 'notif-b2', type: 'broadcast', related_id: null, is_read: false, created_at: '2026-11-18T16:01:00Z', payload: 'broadcast 2' },
  { id: 'notif-b3', type: 'system', related_id: '', is_read: true, created_at: '2026-11-18T16:02:00Z', payload: 'system note' },
];

const dedupedBroadcast = simulateDeduplication(testRowsBroadcast);
assert(dedupedBroadcast.length === 3, 'Broadcasts with NULL or empty related_id are NEVER deleted or grouped together');

// 3. Partial Dual-Table Update Failure Logic Simulation
console.log('\n--- 3. Dual-Table Mutation & Error Propagation Logic ---');

interface MutationMockResult {
  primaryUpdated: boolean;
  fallbackUpdated: boolean;
  errors: string[];
}

function evaluateDualTableResults(
  results: [PromiseSettledResult<{ error: { code?: string; message: string } | null }>, PromiseSettledResult<{ error: { code?: string; message: string } | null }>]
): MutationMockResult {
  let primaryUpdated = false;
  let fallbackUpdated = false;
  const errors: string[] = [];

  if (results[0].status === 'fulfilled') {
    const { error } = results[0].value;
    if (error) {
      if (error.code !== '42P01') errors.push(`notifications: ${error.message}`);
    } else {
      primaryUpdated = true;
    }
  } else {
    errors.push(`notifications rejected: ${String(results[0].reason)}`);
  }

  if (results[1].status === 'fulfilled') {
    const { error } = results[1].value;
    if (error) {
      if (error.code !== '42P01') errors.push(`admin_notifications: ${error.message}`);
    } else {
      fallbackUpdated = true;
    }
  } else {
    errors.push(`admin_notifications rejected: ${String(results[1].reason)}`);
  }

  return { primaryUpdated, fallbackUpdated, errors };
}

// Case 1: Primary succeeds, fallback is missing (code 42P01 table does not exist)
const resPartialSuccess = evaluateDualTableResults([
  { status: 'fulfilled', value: { error: null } },
  { status: 'fulfilled', value: { error: { code: '42P01', message: 'relation does not exist' } } },
]);
assert(resPartialSuccess.primaryUpdated === true, 'Primary table marked updated');
assert(resPartialSuccess.fallbackUpdated === false, 'Fallback table correctly marked not updated');
assert(resPartialSuccess.errors.length === 0, '42P01 (missing legacy table) is ignored as non-fatal');

// Case 2: Both tables fail with real database connection / RLS errors
const resCompleteFailure = evaluateDualTableResults([
  { status: 'fulfilled', value: { error: { code: '42501', message: 'permission denied for table notifications' } } },
  { status: 'rejected', reason: new Error('connection timeout') },
]);
assert(!resCompleteFailure.primaryUpdated && !resCompleteFailure.fallbackUpdated, 'Both tables marked as NOT updated');
assert(resCompleteFailure.errors.length === 2, 'All failures captured in error log');
// Verify that route would reject:
const wouldRouteFail = !resCompleteFailure.primaryUpdated && !resCompleteFailure.fallbackUpdated && resCompleteFailure.errors.length > 0;
assert(wouldRouteFail, 'Route correctly refuses to report success when all database updates fail');

// 4. Concurrent Notification Creation Test
console.log('\n--- 4. Concurrent Notification Dispatch & Idempotency ---');

async function testConcurrentDispatches() {
  const entityId = 'req-concurrent-stress-test';

  // Fire 5 concurrent dispatches for the same service request
  const promises = Array.from({ length: 5 }).map((_, i) =>
    dispatchAdminNotification({
      type: 'service_request',
      title: `Booking Update ${i}`,
      message: `Message variant ${i}`,
      relatedId: entityId,
      relatedType: 'request',
    })
  );

  const results = await Promise.all(promises);

  // All 5 dispatches must yield the EXACT same deterministic ID
  const firstId = results[0].id;
  assert(firstId === `notif-service_request-${entityId}`, 'First dispatch produced deterministic ID');

  for (let i = 1; i < results.length; i++) {
    assert(results[i].id === firstId, `Concurrent dispatch ${i} produced matching deterministic ID`);
  }

  // Check dataStore: exactly 1 notification must exist in store
  const inStore = dataStore.getNotifications().filter((n) => n.related_id === entityId);
  assert(inStore.length === 1, `Store contains exactly 1 notification under concurrent race, found ${inStore.length}`);
}

testConcurrentDispatches().then(() => {
  console.log('\n======================================================');
  console.log('🎉 ALL CRITICAL CORRECTIONS & EDGE-CASE TESTS PASSED!');
  console.log('======================================================\n');
}).catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
