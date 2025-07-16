import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { OAuthManager } from '@postoko/social';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    const { platform, redirect_uri } = body;
    
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }
    
    const oauthManager = new OAuthManager();
    const redirectUri = redirect_uri || new URL('/api/social/auth/callback', request.url).toString();
    
    try {
      const authUrl = await oauthManager.generateAuthUrl(
        user.id,
        platform,
        redirectUri
      );
      
      return NextResponse.json({ auth_url: authUrl });
    } catch (error: any) {
      console.error('Generate auth URL error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate authorization URL' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Connect social account error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect social account' },
      { status: 500 }
    );
  }
}