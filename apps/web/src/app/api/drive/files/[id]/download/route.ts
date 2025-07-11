import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { createClient } from '@postoko/database';
import { DriveClient, CacheManager } from '@postoko/drive';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const fileId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const supabase = createClient();
    
    // Get file with account info
    const { data: file, error: fileError } = await supabase
      .from('drive_files')
      .select(`
        *,
        monitored_folders (
          drive_accounts (*)
        )
      `)
      .eq('id', fileId)
      .single();
    
    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (file.monitored_folders.drive_accounts.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Check cache first
    const cacheManager = new CacheManager();
    
    if (!forceRefresh) {
      const cachedData = await cacheManager.get(file.file_id);
      if (cachedData) {
        return new NextResponse(cachedData.data, {
          headers: {
            'Content-Type': cachedData.mimeType,
            'Content-Length': cachedData.size.toString(),
            'Cache-Control': 'private, max-age=3600',
            'X-Cache': 'HIT',
          },
        });
      }
    }
    
    // Download from Drive
    const driveClient = await DriveClient.forAccount(file.monitored_folders.drive_accounts);
    const downloadData = await driveClient.downloadFile(file.file_id);
    
    // Cache the file
    await cacheManager.set(file.file_id, {
      data: downloadData.data,
      mimeType: downloadData.mimeType,
      size: downloadData.size,
    });
    
    // Update file_cache table
    await supabase
      .from('file_cache')
      .upsert({
        drive_file_id: file.id,
        cache_key: file.file_id,
        size_bytes: downloadData.size,
        mime_type: downloadData.mimeType,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });
    
    return new NextResponse(downloadData.data, {
      headers: {
        'Content-Type': downloadData.mimeType,
        'Content-Length': downloadData.size.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download file' },
      { status: 500 }
    );
  }
}