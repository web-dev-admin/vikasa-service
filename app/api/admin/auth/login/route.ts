import { NextRequest, NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/auth/admin';

// Default authorized administrator credential
// In production, configure ADMIN_PASSWORD in environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vikasa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'vikasa@2026';

// In-memory rate-limiter against brute-force attacks
interface LoginAttemptRecord {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'localhost';

    const now = Date.now();
    const clientRecord = loginAttempts.get(clientIp);

    // 1. Check if client is currently locked out
    if (clientRecord?.blockedUntil && clientRecord.blockedUntil > now) {
      const remainingMinutes = Math.ceil((clientRecord.blockedUntil - now) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. For security, access is temporarily locked. Please retry in ${remainingMinutes} minute(s).`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((clientRecord.blockedUntil - now) / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 2. Validate admin credentials
    const isEmailValid = cleanEmail === ADMIN_EMAIL.toLowerCase() || cleanEmail === 'admin';
    const isPasswordValid = cleanPassword === ADMIN_PASSWORD;

    if (!isEmailValid || !isPasswordValid) {
      // Record failed attempt
      const existing = loginAttempts.get(clientIp);
      if (!existing || now - existing.firstAttemptTime > ATTEMPT_WINDOW_MS) {
        loginAttempts.set(clientIp, { attempts: 1, firstAttemptTime: now });
      } else {
        existing.attempts += 1;
        if (existing.attempts >= MAX_FAILED_ATTEMPTS) {
          existing.blockedUntil = now + LOCKOUT_DURATION_MS;
        }
        loginAttempts.set(clientIp, existing);
      }

      const remainingTries = Math.max(0, MAX_FAILED_ATTEMPTS - (loginAttempts.get(clientIp)?.attempts || 1));
      return NextResponse.json(
        {
          success: false,
          error: remainingTries > 0
            ? `Invalid administrator credentials. ${remainingTries} attempt(s) remaining.`
            : 'Too many failed login attempts. Access is locked for 15 minutes.',
        },
        { status: 401 }
      );
    }

    // 3. Clear failed attempts on successful login
    loginAttempts.delete(clientIp);

    const token = signAdminToken(cleanEmail, 'admin');

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      data: {
        email: cleanEmail,
        role: 'admin',
        token,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'vikasa_admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
