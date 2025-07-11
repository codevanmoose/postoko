import { createClient } from '@postoko/database';
import type { APIKey, CreateAPIKeyDTO, APIKeyResponse } from '../types';
import crypto from 'crypto';

const supabase = createClient();

export const apiKeysLib = {
  /**
   * Generate a secure API key
   */
  generateAPIKey(): string {
    // Generate 32 bytes of random data and convert to base64
    return `pk_${crypto.randomBytes(32).toString('base64url')}`;
  },

  /**
   * Hash an API key for storage
   */
  hashAPIKey(key: string): string {
    // In production, use bcrypt or argon2
    // For now, using SHA-256 as a placeholder
    return crypto.createHash('sha256').update(key).digest('hex');
  },

  /**
   * Get all API keys for a user
   */
  async getAPIKeys(userId: string): Promise<APIKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new API key
   */
  async createAPIKey(
    userId: string,
    { name, permissions = { read: true, write: false }, expires_in_days }: CreateAPIKeyDTO
  ): Promise<APIKeyResponse> {
    const key = this.generateAPIKey();
    const keyHash = this.hashAPIKey(key);
    const keyPrefix = key.substring(0, 8);
    
    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      key, // Only returned on creation
      key_id: data.id,
      name: data.name,
      key_prefix: data.key_prefix,
      permissions: data.permissions,
      expires_at: data.expires_at,
    };
  },

  /**
   * Delete an API key
   */
  async deleteAPIKey(userId: string, keyId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Update API key last used timestamp
   */
  async updateLastUsed(keyHash: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash);

    if (error) throw error;
  },

  /**
   * Validate an API key
   */
  async validateAPIKey(key: string): Promise<APIKey | null> {
    const keyHash = this.hashAPIKey(key);
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single();

    if (error || !data) return null;

    // Check if key is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    // Update last used
    await this.updateLastUsed(keyHash);

    return data;
  },
};