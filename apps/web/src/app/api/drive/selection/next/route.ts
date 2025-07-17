import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { createClient } from '@postoko/database';

import { SelectionEngine } from '@postoko/drive/server';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    const { 
      folder_ids,
      count = 1,
      strategy = 'random',
      filters = {}
    } = body;
    
    if (!folder_ids || !Array.isArray(folder_ids) || folder_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid folder_ids' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Verify all folders belong to user
    const { data: folders, error: foldersError } = await supabase
      .from('monitored_folders')
      .select(`
        id,
        drive_accounts!inner (user_id)
      `)
      .in('id', folder_ids)
      .eq('drive_accounts.user_id', user.id);
    
    if (foldersError || !folders || folders.length !== folder_ids.length) {
      return NextResponse.json(
        { error: 'One or more folders not found' },
        { status: 404 }
      );
    }
    
    // Use selection engine to pick files
    const engine = new SelectionEngine();
    const selections = await engine.selectFiles(
      user.id,
      folder_ids,
      count,
      {
        strategy,
        filters,
      }
    );
    
    if (selections.length === 0) {
      return NextResponse.json(
        { 
          error: 'No available files found',
          suggestions: [
            'Try scanning your folders for new content',
            'Check if files are already scheduled or posted',
            'Adjust your selection filters',
          ]
        },
        { status: 404 }
      );
    }
    
    // Mark files as scheduled
    const fileIds = selections.map(s => s.id);
    await supabase
      .from('drive_files')
      .update({ status: 'scheduled' })
      .in('id', fileIds);
    
    return NextResponse.json({
      selections,
      count: selections.length,
    });
  } catch (error: any) {
    console.error('File selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to select files' },
      { status: 500 }
    );
  }
}

// Get selection history
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const supabase = createClient();
    
    // Get recently selected files
    const { data, error } = await supabase
      .from('drive_files')
      .select(`
        *,
        monitored_folders (
          id,
          folder_name
        )
      `)
      .eq('monitored_folders.drive_accounts.user_id', user.id)
      .in('status', ['scheduled', 'posted'])
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Get selection history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get selection history' },
      { status: 500 }
    );
  }
}
