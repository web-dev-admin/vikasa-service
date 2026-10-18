import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, isLocalMockMode } from '@/lib/supabase/client';

// Dedicated server secret for admin session signing (fallback to deterministic local key in mock mode)
const ADMIN_JWT_SECRET = process.env.ADMIN_SESSION_SECRET || 'vikasa_admin_secret_key_tamildistricts_2026';
const ADMIN_COOKIE_NAME = 'vikasa_admin_session';

export interface AdminSession {
  isAdmin: boolean;
  email: string;
  role: string;
  issuedAt: number;
}

/**
 * Creates a cryptographically signed session token for the administrator.
 */
export function signAdminToken(email: string, role: string = 'admin'): string {
  const payload = {
    email: email.toLowerCase().trim(),
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', ADMIN_JWT_SECRET);
  hmac.update(encodedPayload);
  const signature = hmac.digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a signed session token. Returns parsed session or null.
 */
export function verifyAdminToken(token: string): AdminSession | null {
  if (!token || !token.includes('.')) return null;

  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const hmac = crypto.createHmac('sha256', ADMIN_JWT_SECRET);
    hmac.update(encodedPayload);
    const expectedSignature = hmac.digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return null;
    }

    return {
      isAdmin: true,
      email: payload.email,
      role: payload.role,
      issuedAt: payload.iat,
    };
  } catch {
    return null;
  }
}

export const generateAdminSessionToken = signAdminToken;

export function verifyAdminSessionToken(token: string): { valid: boolean; session?: AdminSession; reason?: string } {
  const session = verifyAdminToken(token);
  return {
    valid: Boolean(session),
    session: session || undefined,
    reason: session ? undefined : 'Invalid token signature or expired',
  };
}

/**
 * Checks admin authentication for incoming NextRequest (via Cookie or Bearer header).
 * Supports both local secure signed sessions and Supabase Auth JWTs.
 */
export async function authenticateAdmin(request: NextRequest): Promise<AdminSession | null> {
  // 1. Check Authorization Bearer header
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  // 2. Fallback to HTTP-only cookie
  if (!token) {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
    token = cookie?.value || null;
  }

  // 3. Fallback to legacy cookie if present
  if (!token) {
    const legacyCookie = request.cookies.get('vikasa_admin_token');
    if (legacyCookie?.value && legacyCookie.value !== 'active') {
      token = legacyCookie.value;
    }
  }

  if (!token) return null;

  // Verify signed token
  const verified = verifyAdminToken(token);
  if (verified) return verified;

  // If remote Supabase Auth is active, attempt to verify with Supabase client
  if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        return {
          isAdmin: true,
          email: user.email || 'admin@vikasa.com',
          role: 'admin',
          issuedAt: Math.floor(Date.now() / 1000),
        };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Standard HTTP 401 Unauthorized Response for privileged endpoints.
 */
export function unauthorizedResponse(message: string = 'Admin authorization required'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'UNAUTHORIZED',
    },
    { status: 401 }
  );
}
