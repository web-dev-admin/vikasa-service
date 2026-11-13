import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // If Supabase is connected, optionally sync services
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { data: dbServices, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && Array.isArray(dbServices) && dbServices.length > 0) {
          for (const s of dbServices) {
            dataStore.addCustomService({
              id: s.id,
              name: s.name,
              category_id: s.category_id,
              description: s.description,
              price_estimate: s.price_estimate,
              is_active: s.is_active,
              sort_order: s.sort_order,
            });
          }
        }
      } catch (e) {
        console.warn('Supabase services sync warning:', e);
      }
    }

    const services = dataStore.getAllServices();
    return NextResponse.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to add services');
    }

    const body = await request.json();
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Service name is required (min 2 letters)' },
        { status: 400 }
      );
    }

    const cleanName = body.name.trim();
    const cleanSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const serviceId = body.id || `srv-${cleanSlug}`;

    // 1. Save to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        await supabase.from('services').upsert({
          id: serviceId,
          category_id: body.category_id || 'cat-other',
          name: cleanName,
          slug: cleanSlug,
          description: body.description?.trim() || `${cleanName} doorstep service`,
          price_estimate: body.price_estimate?.trim() || 'Custom Quote',
          is_active: body.is_active !== false,
          sort_order: body.sort_order || 10,
        });
      } catch (dbErr) {
        console.warn('Supabase service save warning:', dbErr);
      }
    }

    // 2. Save to local dataStore
    const created = dataStore.addCustomService({
      id: serviceId,
      name: cleanName,
      category_id: body.category_id,
      description: body.description,
      price_estimate: body.price_estimate,
      is_active: body.is_active,
      sort_order: body.sort_order,
    });

    return NextResponse.json({
      success: true,
      message: `Service "${cleanName}" added successfully`,
      data: created,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to delete services');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        await supabase.from('worker_services').delete().eq('service_id', id);
        await supabase.from('services').delete().eq('id', id);
      } catch (dbErr) {
        console.warn('Supabase service delete warning:', dbErr);
      }
    }

    dataStore.deleteCustomService(id);

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
