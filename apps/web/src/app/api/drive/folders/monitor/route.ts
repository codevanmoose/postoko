import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { createClient } from '@postoko/database';

import { DriveClient } from '@postoko/drive/server';
import type { AddMonitoredFolderRequest } from '@postoko/drive';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body: AddMonitoredFolderRequest = await request.json();
    const supabase = createClient();
    
    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('drive_accounts')
      .select('*')
      .eq('id', body.drive_account_id)
      .eq('user_id', user.id)
      .single();
    
    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Get folder path if not provided
    let folderPath = body.folder_path;
    if (!folderPath) {
      const driveClient = await DriveClient.forAccount(account);
      folderPath = await driveClient.getFolderPath(body.folder_id);
    }
    
    // Add monitored folder
    const { data, error } = await supabase
      .from('monitored_folders')
      .insert({
        drive_account_id: body.drive_account_id,
        folder_id: body.folder_id,
        folder_name: body.folder_name,
        folder_path: folderPath,
        parent_folder_id: body.parent_folder_id,
        priority: body.priority || 0,
        settings: body.settings || {},
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Folder already monitored' },
          { status: 409 }
        );
      }
      throw error;
    }
    
    // Start initial scan in background
    fetch(`/api/drive/folders/${data.id}/scan`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    }).catch(console.error);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Add monitored folder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add monitored folder' },
      { status: 500 }
    );
  }
}
