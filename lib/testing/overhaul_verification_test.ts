import { dataStore } from '../data/store';
import { signAdminToken, verifyAdminToken } from '../auth/admin';
import { sanitizeIndianMobile10 } from '../utils/phone';
import { dispatchAdminNotification } from '../notifications/dispatcher';
import { DEFAULT_WEBSITE_CONTENT } from '../data/website_content';

async function runTests() {
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

  assert(Boolean(newReq.tracking_token), 'Service request created with tracking token');
  assert(newReq.customer_phone === '9842712345', 'Customer phone sanitized upon storage');

  // 3. Public Tracking Projection (Strict Zero-PII Check)
  const trackingView = dataStore.getPublicTrackingStatus(newReq.tracking_token);
  assert(trackingView !== null, 'Public tracking status retrievable via token');
  assert((trackingView as any).customer_phone === undefined, 'Public tracking strictly hides customer phone');
  assert((trackingView as any).customer_name === undefined, 'Public tracking strictly hides full customer name');
  assert((trackingView as any).formatted_address === undefined, 'Public tracking strictly hides full street address');
  assert(trackingView?.district === 'Erode', 'Public tracking provides safe district view');

  // 4. Admin Auth Tokens
  const token = await signAdminToken('admin@vikasa.com', 'admin');
  assert(typeof token === 'string' && token.length > 20, 'Admin JWT token signed successfully');

  const decoded = await verifyAdminToken(token);
  assert(decoded !== null && decoded.email === 'admin@vikasa.com', 'Admin JWT token verified and decoded payload matches');

  // 5. In-App Notification Center
  const notif = dataStore.addNotification({
    type: 'service_request',
    title: 'New Service Request',
    message: 'Kavitha R requested Interior Design',
    related_id: newReq.id,
    related_type: 'request',
  });

  assert(Boolean(notif.id), 'In-app notification created');
  assert(notif.is_read === false, 'New notification defaults to unread');

  const unreadList = dataStore.getNotifications();
  assert(unreadList.length > 0, 'Notification center retrieves notifications');

  dataStore.markNotificationAsRead(notif.id);
  const updatedNotif = dataStore.getNotifications().find((n) => n.id === notif.id);
  assert(updatedNotif?.is_read === true, 'Notification marked as read');

  // 6. In-App Notification Dispatch (Zero-Firebase Verification)
  const testNotif = await dispatchAdminNotification({
    type: 'service_request',
    title: 'Test Notification',
    message: 'In-app notification test without Firebase',
  });
  assert(Boolean(testNotif.id), 'Notification dispatched successfully without external Firebase dependency');

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
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
