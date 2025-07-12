import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuth } from '@postoko/drive/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      // User denied access
      return NextResponse.redirect(
        new URL('/settings/drive?error=access_denied', request.url)
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/drive?error=invalid_request', request.url)
      );
    }
    
    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const userId = stateData.user_id;
    
    if (!userId) {
      return NextResponse.redirect(
        new URL('/settings/drive?error=invalid_state', request.url)
      );
    }
    
    const googleAuth = getGoogleAuth();
    const redirectUri = new URL('/api/drive/auth/callback', request.url).toString();
    
    try {
      // Handle the callback and save the account
      await googleAuth.handleCallback(
        userId,
        { code, state },
        redirectUri
      );
      
      // Redirect to success page
      return NextResponse.redirect(
        new URL('/settings/drive?connected=true', request.url)
      );
    } catch (err) {
      console.error('Drive callback error:', err);
      return NextResponse.redirect(
        new URL('/settings/drive?error=connection_failed', request.url)
      );
    }
  } catch (error: any) {
    console.error('Drive callback error:', error);
    return NextResponse.redirect(
      new URL('/settings/drive?error=server_error', request.url)
    );
  }
}