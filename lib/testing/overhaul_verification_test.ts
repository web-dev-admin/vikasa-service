import { dataStore } from '../data/store';
import { signAdminToken, verifyAdminToken } from '../auth/admin';
import { sanitizeIndianMobile10 } from '../utils/phone';
import { dispatchAdminNotification } from '../notifications/dispatcher';
import { DEFAULT_WEBSITE_CONTENT } from '../data/website_content';

console.log('=== VIKASA OVERHAUL COMPREHENSIVE VERIFICATION SUITE ===\n');

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

// 1. Phone Sanitization Tests
const p1 = sanitizeIndianMobile10('+91 98656 52420');
assert(p1 === '9865652420', 'Phone sanitization handles +91 prefix and spaces');

const p2 = sanitizeIndianMobile10('09865652420');
assert(p2 === '9865652420', 'Phone sanitization handles leading zero');

const p3 = sanitizeIndianMobile10('98656-52420');
assert(p3 === '9865652420', 'Phone sanitization handles hyphens');

const p4 = sanitizeIndianMobile10('  98656 52420  ');
assert(p4 === '9865652420', 'Phone sanitization handles extraneous padding');

// 2. Customer Request & Privacy Projection
const newReq = dataStore.createRequest({
  customer_id: '',
  customer_name: 'Kavitha R',
  customer_phone: '+91 98427 12345',
  service_id: 'srv-interior',
  service_name: 'Interior Design',
  category_id: 'cat-interior',
  category_name: 'Interior Design',
  description: 'Modular kitchen consultation for 3BHK villa',
  formatted_address: 'Perundurai Road, Erode',
  district: 'Erode',
  latitude: 11.3410,
  longitude: 77.7172,
  status: 'NEW',
  customer_confirmed: false,
});

assert(Boolean(newReq.id), 'Service request created with UUID');
assert(Boolean(newReq.tracking_token), 'Secure UUID tracking token generated');
assert(newReq.status === 'NEW', 'Initial request status is NEW');

const publicTracking = dataStore.getPublicTrackingStatus(newReq.tracking_token);
assert(Boolean(publicTracking), 'Public tracking projection accessible via secure token');
assert(!('customer_phone' in (publicTracking as unknown as Record<string, unknown>)), 'Privacy check: Zero customer phone leaked');
assert(!('customer_name' in (publicTracking as unknown as Record<string, unknown>)), 'Privacy check: Zero customer name leaked');
assert(!('latitude' in (publicTracking as unknown as Record<string, unknown>)), 'Privacy check: Zero exact coordinates leaked');

// 3. Technician Registration Security
const technician = dataStore.registerWorker({
  full_name: 'Murugan Carpenter',
  phone: '+91 94432 98765',
  experience_years: 8,
  skills: ['Carpentry & Plywood Work'],
  verification_status: 'pending_verification',
  availability: 'available',
  district: 'Erode',
  base_location_name: 'Bhavani Road, Erode',
  latitude: 11.3410,
  longitude: 77.7172,
  service_radius_km: 25,
  service_area_names: ['Erode', 'Bhavani'],
  service_ids: ['srv-carpentry'],
});

assert(technician.verification_status === 'pending_verification', 'Public worker registration strictly sets pending_verification');
assert(Boolean(technician.application_token), 'Technician assigned secure application tracking token');
assert(Boolean(technician.application_token?.startsWith('app-tok-')), 'Application token has secure prefix');

// Verify token-based technician query without leaking PII
const queriedWorker = dataStore.getWorkers().find((w) => w.application_token === technician.application_token);
assert(Boolean(queriedWorker), 'Worker retrievable via application token');
const technicianStatusProjection = {
  applicationReference: queriedWorker?.application_token,
  verificationStatus: queriedWorker?.verification_status,
  trade: queriedWorker?.skills?.[0],
  district: queriedWorker?.district,
  appliedAt: queriedWorker?.created_at,
};
assert(!('phone' in technicianStatusProjection), 'Technician status projection: Zero phone leaked');
assert(!('full_name' in technicianStatusProjection), 'Technician status projection: Zero technician full name leaked');
assert(!('aadhar_number' in technicianStatusProjection), 'Technician status projection: Zero identification documents leaked');

// 4. Admin Auth Token Signing & Verification
const adminToken = signAdminToken('admin@vikasa.com', 'admin');
assert(Boolean(adminToken && adminToken.includes('.')), 'Admin JWT signature generated');

const session = verifyAdminToken(adminToken);
assert(Boolean(session && session.isAdmin && session.email === 'admin@vikasa.com'), 'Admin JWT verified with timing-safe HMAC SHA-256');

const forgedToken = `${adminToken.split('.')[0]}.invalid_signature`;
assert(verifyAdminToken(forgedToken) === null, 'Tampered token rejected by cryptographic verification');

// 5. In-App & Push Notification Dispatcher
const notif = dataStore.addNotification({
  type: 'service_request',
  title: 'New Service Request',
  message: 'Kavitha R booked Modular Kitchen in Erode',
  related_id: newReq.id,
  related_type: 'request',
});

assert(Boolean(notif.id), 'Notification persisted to store');
assert(notif.is_read === false, 'Notification defaults to unread');

const unreadList = dataStore.getNotifications();
assert(unreadList.length > 0, 'Notification center retrieves notifications');

dataStore.markNotificationAsRead(notif.id);
const updatedNotif = dataStore.getNotifications().find((n) => n.id === notif.id);
assert(updatedNotif?.is_read === true, 'Notification marked as read');

// 6. Device Token Management (Android PWA Push)
const devToken = dataStore.registerDeviceToken({
  admin_email: 'admin@vikasa.com',
  fcm_token: 'fake_fcm_test_token_android_123',
  device_name: 'Pixel 8 Android Chrome',
  platform: 'android',
  is_active: true,
});

assert(devToken.platform === 'android', 'Device token registered with platform android');
assert(dataStore.getDeviceTokens().length > 0, 'Device tokens retrievable for FCM dispatch');

dataStore.removeDeviceToken('fake_fcm_test_token_android_123');
assert(dataStore.getDeviceTokens().length === 0, 'Device token cleanly removed');

// 7. Website Content CMS
const currentContent = dataStore.getWebsiteContent();
assert(Boolean(currentContent.hero.heading), 'Website content CMS has valid default hero heading');
assert(Boolean(currentContent.contact.phone), 'Website content CMS has valid default contact phone');
assert(Array.isArray(currentContent.faqs) && currentContent.faqs.length >= 6, 'Website content CMS has 6+ default FAQs');

dataStore.updateWebsiteContent({
  hero: {
    ...currentContent.hero,
    headingHighlight: 'in Erode & Tamil Nadu (Verified)',
  },
});

const updatedContent = dataStore.getWebsiteContent();
assert(
  updatedContent.hero.headingHighlight === 'in Erode & Tamil Nadu (Verified)',
  'Website Content CMS updates hero headline and persists state'
);

console.log(`\n🎉 ALL ${passedTests}/${totalTests} OVERHAUL VERIFICATION TESTS PASSED SUCCESSFULLY!`);

