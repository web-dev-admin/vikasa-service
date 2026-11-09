import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/auth/admin';
import { supabase, isLocalMockMode } from '@/lib/supabase/client';
import { DEFAULT_WEBSITE_CONTENT } from '@/lib/data/website_content';
import { WebsiteContent } from '@/types';

// GET: Public retrieval of current website content for homepage & components
export async function GET() {
  try {
    let content: WebsiteContent = dataStore.getWebsiteContent();

    // Check remote Supabase if connected
    if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { data, error } = await supabase
          .from('website_content')
          .select('key, content');

        if (!error && Array.isArray(data) && data.length > 0) {
          const cmsMap: Record<string, unknown> = {};
          for (const row of data) {
            cmsMap[row.key] = row.content;
          }
          content = {
            ...DEFAULT_WEBSITE_CONTENT,
            ...cmsMap,
          };
          dataStore.updateWebsiteContent(content);
        }
      } catch (e) {
        console.warn('Supabase website_content fetch warning, using store:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve website content' },
      { status: 500 }
    );
  }
}

// PUT: Protected update of website content (Website Editor CMS)
export async function PUT(request: NextRequest) {
  try {
    const session = await authenticateAdmin(request);
    if (!session) {
      return unauthorizedResponse('Administrator session required to edit website content');
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid content payload' },
        { status: 400 }
      );
    }

    // 1. Update in dataStore
    const updated = dataStore.updateWebsiteContent(body);

    // 2. Persist to Supabase if connected
    if (!isLocalMockMode && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const keys = Object.keys(body);
        for (const key of keys) {
          await supabase.from('website_content').upsert(
            {
              key,
              content: body[key],
              updated_at: new Date().toISOString(),
              updated_by: session.email,
            },
            { onConflict: 'key' }
          );
        }
      } catch (dbErr) {
        console.warn('Supabase website_content upsert warning:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Website content successfully updated and published',
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update website content' },
      { status: 500 }
    );
  }
}

