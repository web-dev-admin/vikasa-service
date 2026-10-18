import { NextRequest, NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/auth/admin';

// Default authorized administrator credential
// In production, configure ADMIN_PASSWORD in environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@vikasa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'vikasa@2026';

export async function POST(request: NextRequest) {
  try {
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

    // Validate admin credentials
    const isEmailValid = cleanEmail === ADMIN_EMAIL.toLowerCase() || cleanEmail === 'admin';
    const isPasswordValid = cleanPassword === ADMIN_PASSWORD;

    if (!isEmailValid || !isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid administrator credentials' },
        { status: 401 }
      );
    }

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
