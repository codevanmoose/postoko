import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { createClient } from '@postoko/database';
import { FolderScanner, type ScanProgress } from '@postoko/drive/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const folderId = params.id;
    const supabase = createClient();
    
    // Get monitored folder with account
    const { data: folder, error: folderError } = await supabase
      .from('monitored_folders')
      .select(`
        *,
        drive_accounts (*)
      `)
      .eq('id', folderId)
      .single();
    
    if (folderError || !folder) {
      return NextResponse.json(
        { error: 'Monitored folder not found' },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (folder.drive_accounts.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Check if scan is already running
    const { data: activeScan } = await supabase
      .from('scan_history')
      .select('id')
      .eq('monitored_folder_id', folderId)
      .eq('status', 'running')
      .single();
    
    if (activeScan) {
      return NextResponse.json(
        { error: 'Scan already in progress' },
        { status: 409 }
      );
    }
    
    // Start scan
    const scanner = new FolderScanner();
    const scanResult = await scanner.scanFolder(
      folder.drive_accounts,
      folder,
      async (progress: ScanProgress) => {
        // Could send SSE updates here if needed
        console.log(`Scan progress: ${progress.percentage}%`);
      }
    );
    
    return NextResponse.json({
      success: true,
      scan_id: scanResult.scan_id,
      results: scanResult.results,
    });
  } catch (error: any) {
    console.error('Scan folder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan folder' },
      { status: 500 }
    );
  }
}

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
    
    // Get scan history
    const { data: scans, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('monitored_folder_id', folderId)
      .order('started_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return NextResponse.json(scans || []);
  } catch (error: any) {
    console.error('Get scan history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get scan history' },
      { status: 500 }
    );
  }
}