import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { createClient } from '@postoko/database';

import { getGoogleAuth } from '@postoko/drive/server';

export const dynamic = 'force-dynamic';


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const accountId = params.id;
    const supabase = createClient();
    
    // Verify account belongs to user
    const { data: account, error: fetchError } = await supabase
      .from('drive_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Disconnect account
    const googleAuth = getGoogleAuth();
    await googleAuth.disconnectAccount(accountId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
