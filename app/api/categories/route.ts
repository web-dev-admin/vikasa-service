import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // If Supabase is connected, sync categories
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const { data: dbCategories, error } = await supabase
          .from('service_categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && Array.isArray(dbCategories) && dbCategories.length > 0) {
          for (const c of dbCategories) {
            dataStore.addCustomCategory({
              id: c.id,
              name: c.name,
              slug: c.slug,
              icon: c.icon,
              description: c.description,
              is_active: c.is_active,
              sort_order: c.sort_order,
            });
          }
        }
      } catch (e) {
        console.warn('Supabase categories sync warning:', e);
      }
    }

    const categories = dataStore.getAllCategories();
    return NextResponse.json(
      {
        success: true,
        count: categories.length,
        data: categories,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to add categories');
    }

    const body = await request.json();
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Category name is required (minimum 2 letters)' },
        { status: 400 }
      );
    }

    const cleanName = body.name.trim();
    const cleanSlug = (body.slug || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const categoryId = body.id || `cat-${cleanSlug}`;

    // 1. Save to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        await supabase.from('service_categories').upsert({
          id: categoryId,
          name: cleanName,
          slug: cleanSlug,
          icon: body.icon?.trim() || 'Layers',
          description: body.description?.trim() || `${cleanName} specialized home services`,
          is_active: body.is_active !== false,
          sort_order: body.sort_order || 10,
        });
      } catch (dbErr) {
        console.warn('Supabase category save warning:', dbErr);
      }
    }

    // 2. Save to local dataStore
    const created = dataStore.addCustomCategory({
      id: categoryId,
      name: cleanName,
      slug: cleanSlug,
      icon: body.icon,
      description: body.description,
      is_active: body.is_active,
      sort_order: body.sort_order,
    });

    return NextResponse.json({
      success: true,
      message: `Category "${cleanName}" created successfully`,
      data: created,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator authorization required to delete categories');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Prevent deletion of protected system categories if necessary, or allow with cascade
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        await supabase.from('service_categories').delete().eq('id', id);
      } catch (dbErr) {
        console.warn('Supabase category delete warning:', dbErr);
      }
    }

    dataStore.deleteCustomCategory(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

