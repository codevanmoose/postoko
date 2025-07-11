import { createClient } from '@postoko/database';
import CryptoJS from 'crypto-js';
import { SocialAccount, SocialPlatform, OAuthCallback } from '../types';

const ENCRYPTION_KEY = process.env.SOCIAL_ENCRYPTION_KEY || 'default-key-change-in-production';

export class OAuthManager {
  private supabase = createClient();

  // Encrypt sensitive tokens
  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  }

  // Decrypt tokens
  private decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Generate OAuth URL for a platform
  async generateAuthUrl(
    userId: string,
    platformName: string,
    redirectUri: string
  ): Promise<string> {
    // Get platform config
    const { data: platform, error } = await this.supabase
      .from('social_platforms')
      .select('*')
      .eq('name', platformName)
      .eq('is_active', true)
      .single();

    if (error || !platform) {
      throw new Error(`Platform ${platformName} not found or inactive`);
    }

    // Generate state for CSRF protection
    const state = this.generateState(userId, platformName);

    // Get platform-specific client ID
    const clientId = this.getClientId(platformName);
    const scope = this.getScope(platformName);

    // Build auth URL
    let authUrl = platform.auth_url_template
      .replace('{client_id}', clientId)
      .replace('{redirect_uri}', encodeURIComponent(redirectUri))
      .replace('{scope}', encodeURIComponent(scope))
      .replace('{state}', state);

    // Add platform-specific parameters
    if (platformName === 'twitter') {
      const codeChallenge = this.generateCodeChallenge();
      authUrl = authUrl.replace('{challenge}', codeChallenge);
      
      // Store code verifier for later use
      await this.storeCodeVerifier(userId, platformName, codeChallenge);
    }

    return authUrl;
  }

  // Handle OAuth callback
  async handleCallback(
    userId: string,
    platformName: string,
    callback: OAuthCallback,
    redirectUri: string
  ): Promise<SocialAccount> {
    // Verify state
    if (!this.verifyState(callback.state, userId, platformName)) {
      throw new Error('Invalid state parameter');
    }

    if (callback.error) {
      throw new Error(`OAuth error: ${callback.error}`);
    }

    // Get platform config
    const { data: platform } = await this.supabase
      .from('social_platforms')
      .select('*')
      .eq('name', platformName)
      .single();

    if (!platform) {
      throw new Error(`Platform ${platformName} not found`);
    }

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(
      platformName,
      callback.code,
      redirectUri
    );

    // Get user info from platform
    const userInfo = await this.getPlatformUserInfo(
      platformName,
      tokens.access_token
    );

    // Save or update social account
    const socialAccount = await this.saveAccount({
      userId,
      platform,
      tokens,
      userInfo,
    });

    return socialAccount;
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(
    platformName: string,
    code: string,
    redirectUri: string
  ) {
    const clientId = this.getClientId(platformName);
    const clientSecret = this.getClientSecret(platformName);

    const params: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    };

    // Platform-specific parameters
    if (platformName === 'twitter') {
      const codeVerifier = await this.getCodeVerifier(platformName);
      params.code_verifier = codeVerifier;
    }

    const { data: platform } = await this.supabase
      .from('social_platforms')
      .select('token_url')
      .eq('name', platformName)
      .single();

    const response = await fetch(platform!.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  // Get user info from platform
  private async getPlatformUserInfo(platformName: string, accessToken: string) {
    // This would be implemented by platform-specific classes
    // For now, return mock data
    return {
      id: 'platform-user-id',
      username: 'username',
      display_name: 'Display Name',
      profile_image_url: 'https://example.com/avatar.jpg',
      account_type: 'personal',
    };
  }

  // Save or update social account
  private async saveAccount({
    userId,
    platform,
    tokens,
    userInfo,
  }: {
    userId: string;
    platform: SocialPlatform;
    tokens: any;
    userInfo: any;
  }): Promise<SocialAccount> {
    const accountData = {
      user_id: userId,
      platform_id: platform.id,
      account_id: userInfo.id,
      username: userInfo.username,
      display_name: userInfo.display_name,
      profile_image_url: userInfo.profile_image_url,
      access_token: this.encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token ? this.encrypt(tokens.refresh_token) : null,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      permissions: tokens.scope ? tokens.scope.split(' ') : [],
      account_type: userInfo.account_type,
      metadata: userInfo.metadata || {},
      is_active: true,
    };

    const { data, error } = await this.supabase
      .from('social_accounts')
      .upsert(accountData, {
        onConflict: 'user_id,platform_id,account_id',
      })
      .select('*, platform:social_platforms(*)')
      .single();

    if (error) throw error;

    // Decrypt tokens for return
    return {
      ...data,
      access_token: this.decrypt(data.access_token),
      refresh_token: data.refresh_token ? this.decrypt(data.refresh_token) : null,
    };
  }

  // Refresh access token
  async refreshAccessToken(accountId: string): Promise<string> {
    const { data: account } = await this.supabase
      .from('social_accounts')
      .select('*, platform:social_platforms(*)')
      .eq('id', accountId)
      .single();

    if (!account || !account.refresh_token) {
      throw new Error('Cannot refresh token: no refresh token available');
    }

    const platform = account.platform;
    const clientId = this.getClientId(platform.name);
    const clientSecret = this.getClientSecret(platform.name);
    const refreshToken = this.decrypt(account.refresh_token);

    const response = await fetch(platform.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokens = await response.json();

    // Update stored tokens
    await this.supabase
      .from('social_accounts')
      .update({
        access_token: this.encrypt(tokens.access_token),
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
      })
      .eq('id', accountId);

    return tokens.access_token;
  }

  // Disconnect social account
  async disconnectAccount(accountId: string): Promise<void> {
    const { error } = await this.supabase
      .from('social_accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
  }

  // Helper methods
  private generateState(userId: string, platform: string): string {
    const data = `${userId}:${platform}:${Date.now()}`;
    return Buffer.from(data).toString('base64');
  }

  private verifyState(state: string, userId: string, platform: string): boolean {
    try {
      const decoded = Buffer.from(state, 'base64').toString();
      const [stateUserId, statePlatform] = decoded.split(':');
      return stateUserId === userId && statePlatform === platform;
    } catch {
      return false;
    }
  }

  private generateCodeChallenge(): string {
    // For Twitter OAuth 2.0 PKCE
    const verifier = CryptoJS.lib.WordArray.random(32).toString();
    const challenge = CryptoJS.SHA256(verifier).toString(CryptoJS.enc.Base64url);
    return challenge;
  }

  private async storeCodeVerifier(userId: string, platform: string, verifier: string) {
    // Store in temporary storage (could use Redis or database)
    // For now, using in-memory storage (not production-ready)
    const key = `${userId}:${platform}:verifier`;
    // This should be stored in Redis or similar
    globalThis[key] = verifier;
  }

  private async getCodeVerifier(platform: string): Promise<string> {
    // Retrieve from temporary storage
    // This is a placeholder - use proper storage in production
    return globalThis[`${platform}:verifier`] || '';
  }

  private getClientId(platform: string): string {
    const envKey = `${platform.toUpperCase()}_CLIENT_ID`;
    return process.env[envKey] || '';
  }

  private getClientSecret(platform: string): string {
    const envKey = `${platform.toUpperCase()}_CLIENT_SECRET`;
    return process.env[envKey] || '';
  }

  private getScope(platform: string): string {
    const scopes: Record<string, string> = {
      instagram: 'user_profile,user_media',
      twitter: 'tweet.read tweet.write users.read offline.access',
      pinterest: 'boards:read boards:write pins:read pins:write',
      linkedin: 'r_liteprofile r_emailaddress w_member_social',
      tiktok: 'user.info.basic video.upload',
    };
    return scopes[platform] || '';
  }
}