import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { createClient } from '@postoko/database';

import { DriveClient, CacheManager } from '@postoko/drive/server';

export const dynamic = 'force-dynamic';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id: fileId } = await params;
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
      const cachedUrl = await cacheManager.getCachedUrl(file.file_id);
      if (cachedUrl) {
        // If we have a cached URL, redirect to it
        return NextResponse.redirect(cachedUrl);
      }
    }
    
    // Download from Drive
    const driveClient = await DriveClient.forAccount(file.monitored_folders.drive_accounts);
    
    // Get file metadata first
    const fileMetadata = await driveClient.getFile(file.file_id);
    
    // Download file content
    const fileContent = await driveClient.downloadFile(file.file_id);
    
    // For now, return the file directly
    // In production, you would upload to Supabase Storage and cache the URL
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': fileMetadata.mimeType || file.mime_type || 'application/octet-stream',
        'Content-Length': fileMetadata.size || fileContent.length.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-Cache': forceRefresh ? 'REFRESH' : 'MISS',
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
