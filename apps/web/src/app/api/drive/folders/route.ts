import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { createClient } from '@postoko/database';
import { DriveClient } from '@postoko/drive/server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('account_id');
    const parentId = searchParams.get('parent_id');
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing account_id' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Get account
    const { data: account, error: accountError } = await supabase
      .from('drive_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();
    
    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Get folders from Drive
    const driveClient = await DriveClient.forAccount(account);
    const folders = await driveClient.listFolders(parentId || undefined);
    
    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('List folders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list folders' },
      { status: 500 }
    );
  }
}