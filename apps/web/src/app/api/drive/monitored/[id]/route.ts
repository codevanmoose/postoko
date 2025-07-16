import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { createClient } from '@postoko/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const folderId = params.id;
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('monitored_folders')
      .select(`
        *,
        drive_accounts (
          id,
          email,
          user_name
        ),
        scan_history (
          id,
          status,
          started_at,
          completed_at,
          results
        )
      `)
      .eq('id', folderId)
      .eq('drive_accounts.user_id', user.id)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Monitored folder not found' },
        { status: 404 }
      );
    }
    
    // Get file statistics
    const { data: stats } = await supabase
      .from('drive_files')
      .select('status')
      .eq('monitored_folder_id', folderId);
    
    const fileStats = {
      total: stats?.length || 0,
      available: stats?.filter(f => f.status === 'available').length || 0,
      scheduled: stats?.filter(f => f.status === 'scheduled').length || 0,
      posted: stats?.filter(f => f.status === 'posted').length || 0,
      skipped: stats?.filter(f => f.status === 'skipped').length || 0,
      error: stats?.filter(f => f.status === 'error').length || 0,
    };
    
    return NextResponse.json({
      ...data,
      file_stats: fileStats,
      last_scan: data.scan_history?.[0] || null,
    });
  } catch (error: any) {
    console.error('Get monitored folder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get monitored folder' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const folderId = params.id;
    const body = await request.json();
    const supabase = createClient();
    
    // Verify ownership
    const { data: folder, error: folderError } = await supabase
      .from('monitored_folders')
      .select(`
        id,
        drive_accounts!inner (user_id)
      `)
      .eq('id', folderId)
      .eq('drive_accounts.user_id', user.id)
      .single();
    
    if (folderError || !folder) {
      return NextResponse.json(
        { error: 'Monitored folder not found' },
        { status: 404 }
      );
    }
    
    // Update folder
    const allowedFields = ['is_active', 'priority', 'settings'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }
    
    const { data, error } = await supabase
      .from('monitored_folders')
      .update(updateData)
      .eq('id', folderId)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Update monitored folder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update monitored folder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const folderId = params.id;
    const supabase = createClient();
    
    // Verify ownership
    const { data: folder, error: folderError } = await supabase
      .from('monitored_folders')
      .select(`
        id,
        drive_accounts!inner (user_id)
      `)
      .eq('id', folderId)
      .eq('drive_accounts.user_id', user.id)
      .single();
    
    if (folderError || !folder) {
      return NextResponse.json(
        { error: 'Monitored folder not found' },
        { status: 404 }
      );
    }
    
    // Delete folder (cascades to files)
    const { error } = await supabase
      .from('monitored_folders')
      .delete()
      .eq('id', folderId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete monitored folder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete monitored folder' },
      { status: 500 }
    );
  }
}