import { createClient } from '@postoko/database';
import type { NotificationPreferences, UpdateNotificationsDTO } from '../types';

const supabase = createClient();

export const notificationsLib = {
  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
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
   * Create default notification preferences
   */
  async createDefaultNotifications(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    updates: UpdateNotificationsDTO
  ): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get or create notification preferences
   */
  async getOrCreateNotifications(userId: string): Promise<NotificationPreferences> {
    const existing = await this.getNotificationPreferences(userId);
    if (existing) return existing;
    
    return this.createDefaultNotifications(userId);
  },

  /**
   * Test notification delivery
   */
  async sendTestNotification(userId: string, type: 'email' | 'push'): Promise<void> {
    // This would integrate with your notification service
    // For now, just a placeholder
    console.log(`Sending test ${type} notification to user ${userId}`);
    
    // In production, this would:
    // 1. Check user's notification preferences
    // 2. Send via appropriate channel (email service, push service)
    // 3. Log the test notification
  },
};