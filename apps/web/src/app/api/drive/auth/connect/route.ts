import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { getGoogleAuth } from '@postoko/drive/server';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    
    const { redirect_uri } = body;
    
    if (!redirect_uri) {
      return NextResponse.json(
        { error: 'Missing redirect_uri' },
        { status: 400 }
      );
    }
    
    const googleAuth = getGoogleAuth();
    const state = Buffer.from(JSON.stringify({ user_id: user.id })).toString('base64');
    const authUrl = googleAuth.generateAuthUrl(redirect_uri, state);
    
    return NextResponse.json({ auth_url: authUrl });
  } catch (error: any) {
    console.error('Drive connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Drive connection' },
      { status: 500 }
    );
  }
}