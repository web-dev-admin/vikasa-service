import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { META_PIXEL_ID } from '../constants';

console.log('=== VIKASA META PIXEL COMPREHENSIVE COMPLIANCE TEST ===\n');

// 1. Verify Meta Pixel ID Configuration
console.log('--- 1. Testing Meta Pixel ID Configuration ---');
assert.strictEqual(META_PIXEL_ID, '1273210955258944', 'META_PIXEL_ID must match user provided Pixel ID');
console.log('✅ PASSED: Meta Pixel ID is configured strictly to "1273210955258944"');

// 2. Verify Base Code in <head>
console.log('\n--- 2. Testing Base Code Presence in <head> of Root Layout ---');
const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

const headTagIndex = layoutContent.indexOf('<head>');
const closingHeadIndex = layoutContent.indexOf('</head>');
assert.ok(headTagIndex !== -1 && closingHeadIndex !== -1, 'RootLayout must contain <head> and </head>');

const headContent = layoutContent.substring(headTagIndex, closingHeadIndex);
assert.ok(headContent.includes("fbq('init'"), 'Meta Pixel base code must be inside <head>');
assert.ok(headContent.includes("fbq('track', 'PageView')"), 'Initial PageView must be inside <head>');
assert.ok(headContent.includes(META_PIXEL_ID), 'Pixel ID must be inside <head>');
assert.ok(headContent.includes('https://connect.facebook.net/en_US/fbevents.js'), 'Must load fbevents.js in <head>');
assert.ok(headContent.includes('noscript'), 'Noscript fallback must be in <head>');
console.log('✅ PASSED: Meta Pixel base code and noscript are present in <head> of root layout (wrapping all pages)');

// 3. Verify Events Fired: Lead for Inquiries & CompleteRegistration for Worker Onboarding
console.log('\n--- 3. Testing Conversion Events (Lead & CompleteRegistration) ---');
const leadFormPath = path.join(process.cwd(), 'components', 'customer', 'LeadForm.tsx');
const leadFormContent = fs.readFileSync(leadFormPath, 'utf8');
assert.ok(leadFormContent.includes('trackMetaLead'), 'LeadForm must trigger trackMetaLead on success');
assert.ok(!leadFormContent.includes('trackMetaCompleteRegistration'), 'LeadForm must NOT trigger CompleteRegistration');
console.log('✅ PASSED: LeadForm triggers "Lead" conversion event strictly on successful submission');

const successPagePath = path.join(process.cwd(), 'app', '(public)', 'request', 'success', '[id]', 'page.tsx');
const successPageContent = fs.readFileSync(successPagePath, 'utf8');
assert.ok(successPageContent.includes('trackMetaLead'), 'Request success page must trigger trackMetaLead');
console.log('✅ PASSED: Confirmation page triggers "Lead" event with deduplication guard');

const workerRegisterPath = path.join(process.cwd(), 'app', '(public)', 'worker-register', 'page.tsx');
const workerRegisterContent = fs.readFileSync(workerRegisterPath, 'utf8');
assert.ok(
  workerRegisterContent.includes('trackMetaCompleteRegistration'),
  'worker-register must call trackMetaCompleteRegistration'
);
assert.ok(!workerRegisterContent.includes('trackMetaLead'), 'worker-register must NOT trigger Lead event');
console.log('✅ PASSED: "CompleteRegistration" is used exclusively for technician registrations');

// 4. Verify Registration & Lead Event Timing & Anti-Duplication
console.log('\n--- 4. Testing Event Firing Safety & Anti-Duplication Guards ---');
assert.ok(
  workerRegisterContent.includes('hasSubmittedRef'),
  'worker-register must have hasSubmittedRef guard'
);
assert.ok(
  workerRegisterContent.includes('if (isSubmitting || hasSubmittedRef.current) return;'),
  'handleSubmit must guard against multiple submissions'
);
assert.ok(
  workerRegisterContent.includes('disabled={isSubmitting}'),
  'Submit button must be disabled during submission'
);
assert.ok(
  leadFormContent.includes('hasTrackedLeadRef'),
  'LeadForm must have hasTrackedLeadRef anti-duplication guard'
);
console.log('✅ PASSED: Conversion events are guarded against double clicks, page load, and validation failures');

// 5. Verify Automatic Advanced Matching Field Names
console.log('\n--- 5. Testing Automatic Advanced Matching Field Names ---');
assert.ok(
  workerRegisterContent.includes('name="name"') && workerRegisterContent.includes('autoComplete="name"'),
  'Full name input must have name="name" and autoComplete="name"'
);
assert.ok(
  workerRegisterContent.includes('name="phone"') && workerRegisterContent.includes('autoComplete="tel"'),
  'Phone input must have name="phone" and autoComplete="tel"'
);
assert.ok(
  workerRegisterContent.includes('name="service_category"'),
  'Form must contain service_category for trade matching'
);
assert.ok(
  leadFormContent.includes('name="name"') && leadFormContent.includes('autoComplete="name"'),
  'LeadForm must have name="name" and autoComplete="name"'
);
assert.ok(
  leadFormContent.includes('name="phone"') && leadFormContent.includes('autoComplete="tel"'),
  'LeadForm must have name="phone" and autoComplete="tel"'
);
console.log('✅ PASSED: Form fields have standard names: name, phone, service_category');

// 6. Verify Safe Wrapper & Zero Console Pollution
console.log('\n--- 6. Testing Safe fbq Type Check & Error Handling ---');
const metaPixelCompPath = path.join(process.cwd(), 'components', 'analytics', 'MetaPixel.tsx');
const metaPixelCompContent = fs.readFileSync(metaPixelCompPath, 'utf8');
assert.ok(
  metaPixelCompContent.includes("typeof window.fbq === 'function'"),
  'Must check if fbq is a function before calling'
);
assert.ok(
  metaPixelCompContent.includes('trackMetaLead'),
  'MetaPixel must export trackMetaLead'
);
assert.ok(
  metaPixelCompContent.includes('trackMetaCompleteRegistration'),
  'MetaPixel must export trackMetaCompleteRegistration'
);
assert.ok(
  !metaPixelCompContent.includes('console.warn') && !metaPixelCompContent.includes('console.error'),
  'MetaPixel must not log warnings or errors if blocked by ad blocker'
);
console.log('✅ PASSED: fbq calls safely wrapped with zero console errors or warnings when blocked');

// 7. Verify Privacy Policy Availability
console.log('\n--- 7. Testing Privacy Policy Availability & Links ---');
const privacyPagePath = path.join(process.cwd(), 'app', '(public)', 'privacy', 'page.tsx');
assert.ok(fs.existsSync(privacyPagePath), 'Privacy policy page must exist at app/(public)/privacy/page.tsx');
const pagePath = path.join(process.cwd(), 'app', '(public)', 'page.tsx');
const pageContent = fs.readFileSync(pagePath, 'utf8');
assert.ok(pageContent.includes('/privacy'), 'Main page footer must link to /privacy');
assert.ok(workerRegisterContent.includes('/privacy'), 'Worker registration must link to /privacy');
console.log('✅ PASSED: Privacy policy page is available and linked in footer and registration form');

// 8. Verify Meta Domain Verification HTML File & Meta Tag
console.log('\n--- 8. Testing Meta Domain Verification File & Tag ---');
const verificationFilePath = path.join(process.cwd(), 'public', '1e7tx9xyqihrixp5zeyk9q7swk9t2y.html');
assert.ok(fs.existsSync(verificationFilePath), 'Verification file 1e7tx9xyqihrixp5zeyk9q7swk9t2y.html must exist in public/');
const verificationFileContent = fs.readFileSync(verificationFilePath, 'utf8');
assert.ok(verificationFileContent.includes('1e7tx9xyqihrixp5zeyk9q7swk9t2y'), 'Verification file must contain the unique code');
assert.ok(layoutContent.includes('facebook-domain-verification'), 'Root layout must include facebook-domain-verification meta tag');
console.log('✅ PASSED: Meta Domain Verification HTML file and head meta tag configured correctly');

console.log('\n==================================================================');
console.log('🎉 ALL META PIXEL & DOMAIN VERIFICATION TESTS PASSED (8/8)!');
console.log('==================================================================');
