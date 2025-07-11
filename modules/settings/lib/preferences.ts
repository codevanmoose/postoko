import { createClient } from '@postoko/database';
import type { UserPreferences, UpdatePreferencesDTO } from '../types';

const supabase = createClient();

export const preferencesLib = {
  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return null
        return null;
      }
      throw error;
    }

    return data;
  },

  /**
   * Create default preferences for a user
   */
  async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    updates: UpdatePreferencesDTO
  ): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(userId: string): Promise<UserPreferences> {
    const defaults: UpdatePreferencesDTO = {
      theme: 'system',
      accent_color: 'blue',
      ui_density: 'comfortable',
      language: 'en',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
    };

    return this.updatePreferences(userId, defaults);
  },

  /**
   * Get or create preferences
   */
  async getOrCreatePreferences(userId: string): Promise<UserPreferences> {
    const existing = await this.getPreferences(userId);
    if (existing) return existing;
    
    return this.createDefaultPreferences(userId);
  },
};