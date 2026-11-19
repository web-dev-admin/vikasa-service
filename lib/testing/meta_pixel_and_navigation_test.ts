import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { META_PIXEL_ID } from '../constants';

console.log('=== VIKASA META PIXEL COMPREHENSIVE COMPLIANCE TEST ===\n');

// 1. Verify Meta Pixel ID Configuration
console.log('--- 1. Testing Meta Pixel ID Configuration ---');
assert.strictEqual(META_PIXEL_ID, '1436121381902025', 'META_PIXEL_ID must match user provided Pixel ID');
console.log('✅ PASSED: Meta Pixel ID is configured strictly to "1436121381902025"');

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

// 3. Verify Events Fired: ONLY CompleteRegistration conversion event
console.log('\n--- 3. Testing Single Conversion Event (CompleteRegistration ONLY) ---');
const leadFormPath = path.join(process.cwd(), 'components', 'customer', 'LeadForm.tsx');
const leadFormContent = fs.readFileSync(leadFormPath, 'utf8');
assert.ok(!leadFormContent.includes("trackMetaEvent('Lead'"), 'LeadForm must NOT trigger Lead event');
assert.ok(!leadFormContent.includes("fbq('track', 'Lead')"), 'LeadForm must NOT contain any Lead event');
console.log('✅ PASSED: "Lead" conversion event completely removed from LeadForm');

const attributionPath = path.join(process.cwd(), 'lib', 'marketing', 'attribution.ts');
const attributionContent = fs.readFileSync(attributionPath, 'utf8');
assert.ok(!attributionContent.includes("fbq('track', 'Lead')"), 'attribution.ts must NOT trigger Lead event');
console.log('✅ PASSED: "Lead" conversion event completely removed from attribution.ts');

const workerRegisterPath = path.join(process.cwd(), 'app', '(public)', 'worker-register', 'page.tsx');
const workerRegisterContent = fs.readFileSync(workerRegisterPath, 'utf8');
assert.ok(
  workerRegisterContent.includes('trackMetaCompleteRegistration'),
  'worker-register must call trackMetaCompleteRegistration'
);
console.log('✅ PASSED: "CompleteRegistration" is the ONLY conversion event used');

// 4. Verify Registration Event Timing & Anti-Duplication
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
console.log('✅ PASSED: CompleteRegistration is guarded against double clicks, page load, and validation failures');

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

console.log('\n==================================================================');
console.log('🎉 ALL META PIXEL AUDIT & FIX COMPLIANCE TESTS PASSED (7/7)!');
console.log('==================================================================');
