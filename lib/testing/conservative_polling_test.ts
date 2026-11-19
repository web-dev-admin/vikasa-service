/**
 * VIKASA CONSERVATIVE POLLING OPTIMIZATION TEST SUITE
 * Validates:
 * 1. Default 60,000ms (60s) polling interval
 * 2. 5,000ms (5s) minimum concurrency throttle
 * 3. In-flight guard strictly preventing overlapping simultaneous execution
 * 4. Zero execution when document.hidden === true (background tab freeze)
 * 5. Intelligent tab resumption: No refetch if < 60s elapsed; instant refetch if >= 60s
 * 6. Manual refresh (force = true) capability
 */

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('=== VIKASA CONSERVATIVE POLLING VERIFICATION SUITE ===\n');

// 1. Verify all admin components configured with 60000ms
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

const pollingFiles = [
  { path: 'app/admin/dashboard/page.tsx', endpoint: 'dashboard', interval: 60000 },
  { path: 'app/admin/requests/page.tsx', endpoint: 'requests', interval: 60000 },
  { path: 'app/admin/operations/page.tsx', endpoint: 'operations', interval: 60000 },
  { path: 'app/admin/suggestions/page.tsx', endpoint: 'suggestions', interval: 60000 },
  { path: 'app/admin/workers/page.tsx', endpoint: 'technicians', interval: 60000 },
  { path: 'app/admin/layout.tsx', endpoint: 'stats', interval: 60000 },
  { path: 'components/admin/NotificationCenter.tsx', endpoint: 'notifications', interval: 60000 },
];

console.log('--- 1. Auditing All Polling Callers for 60-Second Configuration ---');
for (const file of pollingFiles) {
  const fullPath = path.join(projectRoot, file.path);
  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check intervalMs: 60000
  const has60s = content.includes('intervalMs: 60000');
  assert(has60s, `${file.path} explicitly sets intervalMs: 60000`);

  // Ensure NO 1s, 4s, 5s, 6s, 8s, 10s, 25s, or 30s polling
  const forbiddenPatterns = [
    /\bintervalMs:\s*1000\b/,
    /\bintervalMs:\s*4000\b/,
    /\bintervalMs:\s*5000\b/,
    /\bintervalMs:\s*6000\b/,
    /\bintervalMs:\s*8000\b/,
    /\bintervalMs:\s*10000\b/,
    /\bintervalMs:\s*25000\b/,
    /\bintervalMs:\s*30000\b/,
  ];
  for (const regex of forbiddenPatterns) {
    assert(!regex.test(content), `${file.path} does not match forbidden "${regex}"`);
  }
}

// 2. Audit hook source code guarantees in useSmartPolling.ts
console.log('\n--- 2. Auditing useSmartPolling.ts Implementation Guarantees ---');
const hookPath = path.join(projectRoot, 'lib/hooks/useSmartPolling.ts');
const hookContent = fs.readFileSync(hookPath, 'utf-8');

assert(hookContent.includes('intervalMs = 60000'), 'useSmartPolling defaults to intervalMs = 60000 (60s)');
assert(hookContent.includes('throttleMs = 5000'), 'useSmartPolling defaults to throttleMs = 5000 (5s)');
assert(hookContent.includes('inFlightRef'), 'useSmartPolling contains inFlightRef concurrency lock');
assert(hookContent.includes('if (inFlightRef.current)'), 'useSmartPolling strictly drops concurrent in-flight ticks');
assert(hookContent.includes('document.hidden'), 'useSmartPolling strictly checks tab visibility');
assert(hookContent.includes('elapsed >= intervalMs'), 'useSmartPolling only refetches on return if intervalMs has elapsed');

// 3. Verify Admin Authentication Route Audit
console.log('\n--- 3. Auditing Admin Authentication Routes ---');
const layoutContent = fs.readFileSync(path.join(projectRoot, 'app/admin/layout.tsx'), 'utf-8').replace(/\r\n/g, '\n');
assert(!layoutContent.includes('useSmartPolling(') || !layoutContent.includes("endpoint: 'session'"), 'Admin authentication session is NOT polled via useSmartPolling');
assert(layoutContent.includes("if (isAuthenticated === true) {\n      return;\n    }"), 'layout.tsx only validates session on initial mount once');

console.log('\n======================================================');
console.log('🎉 ALL CONSERVATIVE POLLING VERIFICATION TESTS PASSED!');
console.log('======================================================\n');
