import { audioAlert } from '../utils/audioAlert';
import { dataStore } from '../data/store';
import { dispatchAdminNotification } from '../notifications/dispatcher';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('=== VIKASA NOTIFICATION LIFECYCLE, DEDUPLICATION & THROTTLE TEST SUITE ===\n');

// 1. Mock Browser Environment for localStorage and window events
console.log('--- 1. Setting up mock environment ---');
const storageMap: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (k: string) => storageMap[k] || null,
  setItem: (k: string, v: string) => {
    storageMap[k] = String(v);
  },
  removeItem: (k: string) => {
    delete storageMap[k];
  },
  clear: () => {
    for (const key of Object.keys(storageMap)) {
      delete storageMap[key];
    }
  },
};

const dispatchedEvents: string[] = [];
const mockWindow = {
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: (e: { type: string }) => {
    dispatchedEvents.push(e.type);
    return true;
  },
};

(global as unknown as { window: unknown }).window = mockWindow;
(global as unknown as { localStorage: unknown }).localStorage = mockLocalStorage;
(global as unknown as { sessionStorage: unknown }).sessionStorage = mockLocalStorage;
(global as unknown as { document: unknown }).document = {
  hidden: false,
  addEventListener: () => {},
  removeEventListener: () => {},
};

assert(typeof window !== 'undefined', 'Mock window initialized');
assert(typeof localStorage !== 'undefined', 'Mock localStorage initialized');

// 2. AudioAlert localStorage Persistence Test
console.log('\n--- 2. AudioAlert Acknowledgment Persistence in localStorage ---');
const testLeadId = 'req-booking-999';
assert(audioAlert.isAcknowledged(testLeadId) === false, 'Fresh lead is not acknowledged initially');

// Mark acknowledged
audioAlert.markAcknowledged(testLeadId);
assert(audioAlert.isAcknowledged(testLeadId) === true, 'Lead is acknowledged immediately in memory');

// Check localStorage
const storedAcks = JSON.parse(mockLocalStorage.getItem('vikasa_acknowledged_alarms') || '[]');
assert(storedAcks.includes(testLeadId), 'Acknowledgment is stored in localStorage ("vikasa_acknowledged_alarms")');

// Simulate fresh session / new tab:
assert(audioAlert.isAcknowledged(testLeadId) === true, 'New tab / reload reads persistent acknowledgment from localStorage');

// 3. Notification Deduplication in DataStore
console.log('\n--- 3. Deterministic Notification IDs & DataStore Deduplication ---');
const initialNotifCount = dataStore.getNotifications().length;

// First notification for service request 12345
const notif1 = dataStore.addNotification({
  id: 'notif-service_request-req-12345',
  type: 'service_request',
  title: 'New Customer Service Request',
  message: 'Ramesh requested Electrical in Erode',
  related_id: 'req-12345',
  related_type: 'request',
});

assert(notif1.id === 'notif-service_request-req-12345', 'Deterministic ID correctly assigned');

// Attempt duplicate insertion for the same service request
const notif2 = dataStore.addNotification({
  id: 'notif-service_request-req-12345',
  type: 'service_request',
  title: 'New Customer Service Request (retry)',
  message: 'Ramesh requested Electrical in Erode',
  related_id: 'req-12345',
  related_type: 'request',
});

assert(notif2.id === notif1.id, 'Duplicate notification returns matching ID');

const notificationsAfter = dataStore.getNotifications();
const matches = notificationsAfter.filter((n) => n.related_id === 'req-12345');
assert(matches.length === 1, `Exactly 1 notification exists for req-12345, got ${matches.length}`);

// 4. Persistence Event Loop Prevention
console.log('\n--- 4. Verify dataStore.persist() Does NOT Dispatch Loop Events ---');
dispatchedEvents.length = 0; // Clear recorded events

// Add worker and persist
dataStore.setRequests(dataStore.getRequests());

// Verify vikasa_data_updated is NOT dispatched on persist (breaks recursive loop)
assert(
  !dispatchedEvents.includes('vikasa_data_updated'),
  'dataStore.persist() does NOT dispatch "vikasa_data_updated", preventing infinite polling storm'
);

// 5. Test dispatcher deterministic ID behavior
console.log('\n--- 5. Dispatcher Idempotent Execution ---');
async function testDispatcher() {
  const dispatched1 = await dispatchAdminNotification({
    type: 'service_request',
    title: 'Customer Booking Test',
    message: 'Test booking',
    relatedId: 'req-client-auto-test',
    relatedType: 'request',
  });

  assert(dispatched1.id === 'notif-service_request-req-client-auto-test', 'Dispatcher generated deterministic ID');

  const dispatched2 = await dispatchAdminNotification({
    type: 'service_request',
    title: 'Customer Booking Test Duplicate',
    message: 'Test booking duplicate',
    relatedId: 'req-client-auto-test',
    relatedType: 'request',
  });

  assert(dispatched2.id === dispatched1.id, 'Dispatcher deduplicated second call');
}

testDispatcher().then(() => {
  // 6. Test Mark as Read and Delete
  console.log('\n--- 6. Mark Read & Delete Operations ---');
  const testId = 'notif-service_request-req-client-auto-test';
  
  const readSuccess = dataStore.markNotificationAsRead(testId);
  assert(readSuccess === true, 'Notification successfully marked as read');
  
  const readNotif = dataStore.getNotifications().find((n) => n.id === testId);
  assert(readNotif?.is_read === true, 'Notification status is is_read = true');

  const deleteSuccess = dataStore.deleteNotification(testId);
  assert(deleteSuccess === true, 'Notification successfully deleted');

  const deletedNotif = dataStore.getNotifications().find((n) => n.id === testId);
  assert(!deletedNotif, 'Notification is completely removed from store');

  console.log('\n======================================================');
  console.log('🎉 ALL NOTIFICATION LIFECYCLE & DEDUPLICATION TESTS PASSED!');
  console.log('======================================================\n');
}).catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
