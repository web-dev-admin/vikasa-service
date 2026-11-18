import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const env: Record<string, string> = {};
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        env[key] = val;
      }
    }
  }
  return env;
}

async function inspectSchema() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('No Supabase credentials in .env.local');
    return;
  }

  const client = createClient(url, key);

  console.log('=== READ-ONLY SUPABASE SCHEMA & TABLES INSPECTION ===');
  console.log(`Target Endpoint: ${url.replace(/^https?:\/\/([^.]+).*/, '$1')}...`);

  // 1. Inspect service_requests table
  try {
    const { error, count } = await client
      .from('service_requests')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log(`[service_requests] Table error: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`[service_requests] Table EXISTS. Current row count: ${count}`);
    }
  } catch (err: unknown) {
    console.log(`[service_requests] Query exception:`, (err as Error).message);
  }

  // 2. Inspect workers table
  try {
    const { error, count } = await client
      .from('workers')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log(`[workers] Table error: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`[workers] Table EXISTS. Current row count: ${count}`);
    }
  } catch (err: unknown) {
    console.log(`[workers] Query exception:`, (err as Error).message);
  }

  // 3. Inspect customers table
  try {
    const { error, count } = await client
      .from('customers')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log(`[customers] Table error: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`[customers] Table EXISTS. Current row count: ${count}`);
    }
  } catch (err: unknown) {
    console.log(`[customers] Query exception:`, (err as Error).message);
  }

  // 4. Inspect services table
  try {
    const { data, error } = await client
      .from('services')
      .select('id, name')
      .limit(20);

    if (error) {
      console.log(`[services] Table error: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`[services] Table EXISTS. Available service IDs: ${data?.map((s) => s.id).join(', ')}`);
    }
  } catch (err: unknown) {
    console.log(`[services] Query exception:`, (err as Error).message);
  }
}

inspectSchema();
