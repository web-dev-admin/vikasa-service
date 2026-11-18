import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

export const isLocalMockMode = process.env.NEXT_PUBLIC_USE_LOCAL_MOCK_DB === 'true';

// 1. Standard client for public operations (strictly uses anon key with RLS enforcement)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 2. Privileged server-side client for administrative mutations (bypasses RLS)
// CRITICAL SECURITY RULE: Never silently fall back to the anonymous key for privileged operations.
// If SUPABASE_SERVICE_ROLE_KEY is not explicitly provided in server environment, supabaseAdmin is null.
function initSupabaseAdmin(): SupabaseClient | null {
  // Runtime client-bundle safety check: Ensure service role key is NEVER accessible in browser
  if (typeof window !== 'undefined') {
    return null;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.trim() === '') {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey.trim(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabaseAdmin: SupabaseClient | null = initSupabaseAdmin();

/**
 * Returns the privileged admin client or throws an explicit error if missing.
 * Use this in server-side routes requiring verified service-role permissions.
 */
export function requireSupabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('SECURITY VIOLATION: supabaseAdmin cannot be invoked in browser client context');
  }
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables');
  }
  return supabaseAdmin;
}
