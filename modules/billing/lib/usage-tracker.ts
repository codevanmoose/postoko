import { createClient } from '@postoko/database';
import type { UsageTracking } from '../types';

const supabase = createClient();

export const usageTracker = {
  /**
   * Get current period usage for a user
   */
  async getCurrentPeriodUsage(userId: string): Promise<UsageTracking | null> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', periodStart.toISOString())
      .lt('period_end', periodEnd.toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No usage record found, create one
        return this.createUsageRecord(userId, periodStart, periodEnd);
      }
      throw error;
    }

    return data;
  },

  /**
   * Create usage record for a period
   */
  async createUsageRecord(
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UsageTracking> {
    const { data, error } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Increment usage for a specific field
   */
  async incrementUsage(
    userId: string,
    field: 'posts_count' | 'ai_generations_count',
    amount: number = 1
  ): Promise<void> {
    const usage = await this.getCurrentPeriodUsage(userId);
    if (!usage) throw new Error('No usage record found');

    const { error } = await supabase
      .from('usage_tracking')
      .update({ [field]: usage[field] + amount })
      .eq('id', usage.id);

    if (error) throw error;
  },

  /**
   * Update connected platforms count
   */
  async updatePlatformsCount(userId: string, count: number): Promise<void> {
    const usage = await this.getCurrentPeriodUsage(userId);
    if (!usage) throw new Error('No usage record found');

    const { error } = await supabase
      .from('usage_tracking')
      .update({ platforms_connected: count })
      .eq('id', usage.id);

    if (error) throw error;
  },

  /**
   * Update storage usage
   */
  async updateStorageUsage(userId: string, bytes: number): Promise<void> {
    const usage = await this.getCurrentPeriodUsage(userId);
    if (!usage) throw new Error('No usage record found');

    const { error } = await supabase
      .from('usage_tracking')
      .update({ storage_bytes: bytes })
      .eq('id', usage.id);

    if (error) throw error;
  },

  /**
   * Get usage history
   */
  async getUsageHistory(userId: string, months: number = 6): Promise<UsageTracking[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', startDate.toISOString())
      .order('period_start', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Check if user has reached limit
   */
  async checkLimit(
    userId: string,
    field: 'posts_count' | 'ai_generations_count' | 'platforms_connected',
    limit: number
  ): Promise<boolean> {
    if (limit === -1) return true; // Unlimited

    const usage = await this.getCurrentPeriodUsage(userId);
    if (!usage) return true;

    return usage[field] < limit;
  },

  /**
   * Get usage percentage
   */
  async getUsagePercentage(
    userId: string,
    field: 'posts_count' | 'ai_generations_count' | 'platforms_connected',
    limit: number
  ): Promise<number> {
    if (limit === -1) return 0; // Unlimited

    const usage = await this.getCurrentPeriodUsage(userId);
    if (!usage) return 0;

    return Math.min(100, Math.round((usage[field] / limit) * 100));
  },
};