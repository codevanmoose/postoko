import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { createClient } from '@postoko/database';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('account_id');
    const isActive = searchParams.get('active');
    
    const supabase = createClient();
    
    // Build query
    let query = supabase
      .from('monitored_folders')
      .select(`
        *,
        drive_accounts (
          id,
          email,
          user_name
        ),
        _count:drive_files(count)
      `)
      .eq('drive_accounts.user_id', user.id)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (accountId) {
      query = query.eq('drive_account_id', accountId);
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Get file counts for each folder
    const folderIds = data?.map(f => f.id) || [];
    const { data: fileCounts } = await supabase
      .from('drive_files')
      .select('monitored_folder_id, status')
      .in('monitored_folder_id', folderIds);
    
    // Calculate counts by status
    const countsByFolder = folderIds.reduce((acc, folderId) => {
      const folderFiles = fileCounts?.filter(f => f.monitored_folder_id === folderId) || [];
      acc[folderId] = {
        total: folderFiles.length,
        available: folderFiles.filter(f => f.status === 'available').length,
        scheduled: folderFiles.filter(f => f.status === 'scheduled').length,
        posted: folderFiles.filter(f => f.status === 'posted').length,
      };
      return acc;
    }, {} as Record<string, any>);
    
    // Format response
    const folders = data?.map(folder => ({
      ...folder,
      file_counts: countsByFolder[folder.id] || {
        total: 0,
        available: 0,
        scheduled: 0,
        posted: 0,
      },
    })) || [];
    
    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('List monitored folders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list monitored folders' },
      { status: 500 }
    );
  }
}