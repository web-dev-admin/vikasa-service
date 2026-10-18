import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const session = await authenticateAdmin(request);

  if (!session) {
    return unauthorizedResponse('Active admin session not found');
  }

  return NextResponse.json({
    success: true,
    data: {
      email: session.email,
      role: session.role,
      authenticated: true,
    },
  });
}
