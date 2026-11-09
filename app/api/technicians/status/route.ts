import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { sanitizeIndianMobile10 } from '@/lib/utils/phone';
import { supabase, isLocalMockMode } from '@/lib/supabase/client';

/**
 * GET: Secure Technician Application Status Lookup.
 * SECURITY RULE:
 * 1. Must never expose technician personal details through phone number alone.
 * 2. Requires a confidential, non-enumerable application tracking token.
 * 3. Never leaks customer or technician PII (no phone, no full address, no ID document URLs).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token')?.trim();
    const rawPhone = searchParams.get('phone')?.trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application tracking token is required to protect applicant privacy.',
        },
        { status: 400 }
      );
    }

    // Token format validation (minimum 8 characters, non-trivial)
    if (token.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Invalid application tracking token format.' },
        { status: 400 }
      );
    }

    const cleanPhone = rawPhone ? sanitizeIndianMobile10(rawPhone) : null;

    // 1. Check local dataStore
    let worker = dataStore.getWorkers().find((w) => {
      const tokenMatch = w.application_token === token || w.id === token;
      if (!tokenMatch) return false;
      if (cleanPhone) {
        const p = w.phone.replace(/\D/g, '').slice(-10);
        return p === cleanPhone;
      }
      return true;
    });

    // 2. Check Supabase if connected
    if (!worker && !isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        let query = supabase
          .from('workers')
          .select('skills, verification_status, district, created_at, application_token')
          .or(`application_token.eq.${token},id.eq.${token}`);

        if (cleanPhone) {
          query = query.ilike('phone', `%${cleanPhone}`);
        }

        const { data } = await query.maybeSingle();

        if (data) {
          return NextResponse.json({
            success: true,
            data: {
              applicationReference: `VT-${token.slice(-6).toUpperCase()}`,
              verificationStatus: data.verification_status,
              trade: data.skills?.[0] || 'Technician',
              district: data.district || 'Erode',
              appliedAt: data.created_at,
            },
          });
        }
      } catch (e) {
        console.warn('Supabase worker secure status lookup warning:', e);
      }
    }

    if (!worker) {
      return NextResponse.json(
        {
          success: false,
          error: 'No application found matching this token and phone number.',
        },
        { status: 404 }
      );
    }

    // Return strictly non-PII operational status
    return NextResponse.json({
      success: true,
      data: {
        applicationReference: `VT-${token.slice(-6).toUpperCase()}`,
        verificationStatus: worker.verification_status,
        trade: worker.skills?.[0] || 'Technician',
        district: worker.district || 'Erode',
        appliedAt: worker.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to verify application status' },
      { status: 500 }
    );
  }
}
