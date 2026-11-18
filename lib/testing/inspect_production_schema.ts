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

  console.log('=== READ-ONLY SUPABASE SCHEMA & DUPLICATE INSPECTION ===');
  console.log(`Target Endpoint: ${url.replace(/^https?:\/\/([^.]+).*/, '$1')}...`);

  // 1. Inspect notifications table
  try {
    const { data, error, count } = await client
      .from('notifications')
      .select('id, type, title, message, related_id, is_read, created_at', { count: 'exact' })
      .limit(10);

    if (error) {
      console.log(`[notifications] Table error: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`[notifications] Table EXISTS. Total rows: ${count}`);
      if (data && data.length > 0) {
        console.log(`[notifications] Columns present: ${Object.keys(data[0]).join(', ')}`);
        console.log(`[notifications] Sample row 1: id=${data[0].id}, type=${data[0].type}, related_id=${data[0].related_id}, is_read=${data[0].is_read}`);
      }
    }
  } catch (err: unknown) {
    console.log(`[notifications] Query exception:`, (err as Error).message);
  }

  // 2. Inspect admin_notifications table
  try {
    const { data, error, count } = await client
      .from('admin_notifications')
      .select('id, type, title, message, related_id, is_read, created_at', { count: 'exact' })
      .limit(10);

    if (error) {
      console.log(`[admin_notifications] Table error: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`[admin_notifications] Table EXISTS. Total rows: ${count}`);
      if (data && data.length > 0) {
        console.log(`[admin_notifications] Columns present: ${Object.keys(data[0]).join(', ')}`);
        console.log(`[admin_notifications] Sample row 1: id=${data[0].id}, type=${data[0].type}, related_id=${data[0].related_id}, is_read=${data[0].is_read}`);
      }
    }
  } catch (err: unknown) {
    console.log(`[admin_notifications] Query exception:`, (err as Error).message);
  }

  // 3. Check for duplicates in notifications table
  try {
    const { data, error } = await client
      .from('notifications')
      .select('id, type, related_id, created_at')
      .not('related_id', 'is', null)
      .limit(200);

    if (!error && Array.isArray(data)) {
      const groupMap = new Map<string, string[]>();
      for (const row of data) {
        if (!row.related_id) continue;
        const key = `${row.type}::${row.related_id}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(row.id);
      }
      let duplicateGroups = 0;
      for (const [key, ids] of groupMap.entries()) {
        if (ids.length > 1) {
          duplicateGroups++;
          console.log(`[notifications] DUPLICATE DETECTED: key="${key}" has ${ids.length} entries`);
        }
      }
      console.log(`[notifications] Duplicate groups count (in sample of ${data.length}): ${duplicateGroups}`);
    }
  } catch (err: unknown) {
    console.log(`[notifications] Duplicate check exception:`, (err as Error).message);
  }
}

inspectSchema();
