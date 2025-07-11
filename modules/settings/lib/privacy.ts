import { createClient } from '@postoko/database';
import type { PrivacySettings, UpdatePrivacyDTO } from '../types';

const supabase = createClient();

export const privacyLib = {
  /**
   * Get privacy settings
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  },

  /**
   * Create default privacy settings
   */
  async createDefaultPrivacy(userId: string): Promise<PrivacySettings> {
    const { data, error } = await supabase
      .from('privacy_settings')
      .insert({
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    updates: UpdatePrivacyDTO
  ): Promise<PrivacySettings> {
    const { data, error } = await supabase
      .from('privacy_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get or create privacy settings
   */
  async getOrCreatePrivacy(userId: string): Promise<PrivacySettings> {
    const existing = await this.getPrivacySettings(userId);
    if (existing) return existing;
    
    return this.createDefaultPrivacy(userId);
  },

  /**
   * Export user data
   */
  async exportUserData(userId: string): Promise<any> {
    // Collect all user data from various tables
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);

    const { data: notifications } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    const { data: privacy } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('user_id', userId);

    // In production, would also collect from other tables
    // and format as downloadable file

    return {
      user: userData,
      preferences,
      notifications,
      privacy,
      exported_at: new Date().toISOString(),
    };
  },

  /**
   * Schedule account deletion
   */
  async scheduleAccountDeletion(userId: string): Promise<void> {
    // In production, this would:
    // 1. Mark account for deletion
    // 2. Send confirmation email
    // 3. Schedule deletion job for 30 days
    // 4. Allow cancellation within grace period
    
    console.log(`Account deletion scheduled for user ${userId}`);
  },
};