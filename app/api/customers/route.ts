import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const district = searchParams.get('district') || undefined;
    const service = searchParams.get('service') || undefined;

    const customers = dataStore.getCustomers({ search, district, service });
    return NextResponse.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.full_name || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Full name and mobile number are required' },
        { status: 400 }
      );
    }

    const customer = dataStore.upsertCustomer(body);
    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to save customer' },
      { status: 500 }
    );
  }
}
