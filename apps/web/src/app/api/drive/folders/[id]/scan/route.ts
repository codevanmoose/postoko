import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { createClient } from '@postoko/database';

import { FolderScanner } from '@postoko/drive/server';

export const dynamic = 'force-dynamic';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id: folderId } = await params;
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
    const { DriveClient } = await import('@postoko/drive/server');
    const driveClient = await DriveClient.forAccount(folder.drive_accounts);
    const scanner = new FolderScanner(driveClient, folder.drive_accounts, folder);
    const scanResult = await scanner.scan('manual');
    
    return NextResponse.json({
      success: true,
      scan: scanResult,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id: folderId } = await params;
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
