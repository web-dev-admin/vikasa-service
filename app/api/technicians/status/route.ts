import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { sanitizeIndianMobile10 } from '@/lib/utils/phone';
import { supabase, isLocalMockMode } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone');

    if (!rawPhone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const cleanPhone = sanitizeIndianMobile10(rawPhone);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: 'Valid 10-digit Indian mobile number is required' },
        { status: 400 }
      );
    }

    // 1. Check local dataStore
    let worker = dataStore.getWorkers().find((w) => {
      const p = w.phone.replace(/\D/g, '').slice(-10);
      return p === cleanPhone;
    });

    // 2. Check Supabase if connected
    if (!worker && !isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { data } = await supabase
          .from('workers')
          .select('full_name, verification_status, district, created_at')
          .ilike('phone', `%${cleanPhone}`)
          .maybeSingle();

        if (data) {
          return NextResponse.json({
            success: true,
            data: {
              fullName: data.full_name,
              verificationStatus: data.verification_status,
              district: data.district,
              appliedAt: data.created_at,
            },
          });
        }
      } catch (e) {
        console.warn('Supabase worker status lookup warning:', e);
      }
    }

    if (!worker) {
      return NextResponse.json({
        success: false,
        error: 'No technician application found with this mobile number.',
      });
    }

    // Return safe public status representation only
    return NextResponse.json({
      success: true,
      data: {
        fullName: worker.full_name,
        verificationStatus: worker.verification_status,
        district: worker.district,
        appliedAt: worker.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

