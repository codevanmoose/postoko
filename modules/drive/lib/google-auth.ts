import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@postoko/database';
import { DRIVE_SCOPES } from '../types';
import type { DriveAccount, DriveAuthCallback } from '../types';

const supabase = createClient();

export class GoogleAuth {
  private oauth2Client: OAuth2Client;
  
  constructor() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Google Drive OAuth credentials not configured');
    }
    
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );
  }
  
  /**
   * Generate OAuth URL for user consent
   */
  generateAuthUrl(redirectUri: string, state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: DRIVE_SCOPES,
      redirect_uri: redirectUri,
      state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string, redirectUri: string) {
    const { tokens } = await this.oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    });
    
    return tokens;
  }
  
  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string) {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    
    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2',
    });
    
    const { data } = await oauth2.userinfo.get();
    
    return {
      id: data.id!,
      email: data.email!,
      name: data.name,
      picture: data.picture,
    };
  }
  
  /**
   * Save or update Drive account
   */
  async saveDriveAccount(
    userId: string,
    googleAccountId: string,
    email: string,
    displayName: string | null | undefined,
    tokens: any
  ): Promise<DriveAccount> {
    const tokenExpiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date).toISOString()
      : null;
    
    const { data, error } = await supabase
      .from('drive_accounts')
      .upsert({
        user_id: userId,
        google_account_id: googleAccountId,
        email,
        display_name: displayName || email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiresAt,
        scopes: tokens.scope ? tokens.scope.split(' ') : DRIVE_SCOPES,
        is_active: true,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    return credentials;
  }
  
  /**
   * Update tokens in database
   */
  async updateTokens(accountId: string, tokens: any) {
    const tokenExpiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date).toISOString()
      : null;
    
    const { error } = await supabase
      .from('drive_accounts')
      .update({
        access_token: tokens.access_token,
        token_expires_at: tokenExpiresAt,
      })
      .eq('id', accountId);
    
    if (error) throw error;
  }
  
  /**
   * Check if token needs refresh
   */
  needsRefresh(account: DriveAccount): boolean {
    if (!account.token_expires_at) return true;
    
    const expiresAt = new Date(account.token_expires_at);
    const now = new Date();
    const bufferMinutes = 5; // Refresh 5 minutes before expiry
    
    return expiresAt.getTime() - now.getTime() < bufferMinutes * 60 * 1000;
  }
  
  /**
   * Get valid OAuth client for account
   */
  async getAuthenticatedClient(account: DriveAccount): Promise<OAuth2Client> {
    let accessToken = account.access_token;
    
    // Refresh token if needed
    if (this.needsRefresh(account) && account.refresh_token) {
      const newTokens = await this.refreshAccessToken(account.refresh_token);
      await this.updateTokens(account.id, newTokens);
      accessToken = newTokens.access_token || accessToken;
    }
    
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET
    );
    
    client.setCredentials({
      access_token: accessToken,
      refresh_token: account.refresh_token,
    });
    
    return client;
  }
  
  /**
   * Disconnect Drive account
   */
  async disconnectAccount(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('drive_accounts')
      .update({ is_active: false })
      .eq('id', accountId);
    
    if (error) throw error;
  }
  
  /**
   * Handle OAuth callback
   */
  async handleCallback(
    userId: string,
    { code, state }: DriveAuthCallback,
    redirectUri: string
  ): Promise<DriveAccount> {
    // Exchange code for tokens
    const tokens = await this.getTokens(code, redirectUri);
    
    if (!tokens.access_token) {
      throw new Error('No access token received');
    }
    
    // Get user info
    const userInfo = await this.getUserInfo(tokens.access_token);
    
    // Save account
    const account = await this.saveDriveAccount(
      userId,
      userInfo.id,
      userInfo.email,
      userInfo.name,
      tokens
    );
    
    return account;
  }
}

// Singleton instance
let googleAuth: GoogleAuth | null = null;

export function getGoogleAuth(): GoogleAuth {
  if (!googleAuth) {
    googleAuth = new GoogleAuth();
  }
  return googleAuth;
}