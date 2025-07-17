import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@postoko/database';
import { OAuthManager } from '@postoko/social';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      // User denied access
      return NextResponse.redirect(
        new URL('/settings/social?error=access_denied', request.url)
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/social?error=invalid_request', request.url)
      );
    }
    
    // Decode state to get user ID and platform
    let userId: string;
    let platform: string;
    
    try {
      const decoded = Buffer.from(state, 'base64').toString();
      [userId, platform] = decoded.split(':');
    } catch {
      return NextResponse.redirect(
        new URL('/settings/social?error=invalid_state', request.url)
      );
    }
    
    if (!userId || !platform) {
      return NextResponse.redirect(
        new URL('/settings/social?error=invalid_state', request.url)
      );
    }
    
    const oauthManager = new OAuthManager();
    const redirectUri = new URL('/api/social/auth/callback', request.url).toString();
    
    try {
      // Handle the callback and save the account
      await oauthManager.handleCallback(
        userId,
        platform,
        { code, state },
        redirectUri
      );
      
      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/settings/social?connected=${platform}`, request.url)
      );
    } catch (err: any) {
      console.error('Social callback error:', err);
      return NextResponse.redirect(
        new URL('/settings/social?error=connection_failed', request.url)
      );
    }
  } catch (error: any) {
    console.error('Social callback error:', error);
    return NextResponse.redirect(
      new URL('/settings/social?error=server_error', request.url)
    );
  }
}