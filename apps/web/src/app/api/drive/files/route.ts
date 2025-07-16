import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { createClient } from '@postoko/database';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folder_id');
    const status = searchParams.get('status') || 'available';
    const mimeType = searchParams.get('mime_type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const supabase = createClient();
    
    // Build query
    let query = supabase
      .from('drive_files')
      .select(`
        *,
        monitored_folders!inner (
          id,
          folder_name,
          drive_accounts!inner (
            user_id,
            email
          )
        )
      `)
      .eq('monitored_folders.drive_accounts.user_id', user.id);
    
    // Apply filters
    if (folderId) {
      query = query.eq('monitored_folder_id', folderId);
    }
    
    if (status === 'available') {
      query = query.eq('is_available', true).eq('is_blacklisted', false);
    } else if (status === 'unavailable') {
      query = query.eq('is_available', false);
    }
    
    if (mimeType) {
      query = query.ilike('mime_type', `%${mimeType}%`);
    }
    
    // Add pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Format response
    const files = data?.map(file => ({
      id: file.id,
      file_id: file.file_id,
      name: file.file_name,
      mime_type: file.mime_type,
      size: file.file_size,
      thumbnail_url: file.thumbnail_url,
      web_view_link: file.download_url,
      created_time: file.created_time,
      modified_time: file.modified_time,
      status: file.is_available ? 'available' : 'unavailable',
      use_count: file.use_count,
      last_used_at: file.last_used_at,
      metadata: file.metadata,
      folder: {
        id: file.monitored_folders.id,
        name: file.monitored_folders.folder_name,
      },
    })) || [];
    
    return NextResponse.json({
      files,
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });
  } catch (error: any) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: 500 }
    );
  }
}

// Update file usage
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    const { file_id, action } = body;
    
    if (!file_id || !action) {
      return NextResponse.json(
        { error: 'Missing file_id or action' },
        { status: 400 }
      );
    }
    
    const validActions = ['mark_used', 'blacklist', 'unblacklist'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Verify ownership
    const { data: file, error: fileError } = await supabase
      .from('drive_files')
      .select(`
        id,
        use_count,
        monitored_folders!inner (
          drive_accounts!inner (user_id)
        )
      `)
      .eq('id', file_id)
      .eq('monitored_folders.drive_accounts.user_id', user.id)
      .single();
    
    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Update based on action
    const updateData: any = {};
    
    if (action === 'mark_used') {
      updateData.use_count = file.use_count + 1;
      updateData.last_used_at = new Date().toISOString();
    } else if (action === 'blacklist') {
      updateData.is_blacklisted = true;
    } else if (action === 'unblacklist') {
      updateData.is_blacklisted = false;
    }
    
    const { data, error } = await supabase
      .from('drive_files')
      .update(updateData)
      .eq('id', file_id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update file' },
      { status: 500 }
    );
  }
}