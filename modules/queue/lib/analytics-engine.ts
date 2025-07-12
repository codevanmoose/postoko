import { createClient } from '@postoko/database';
import { 
  QueueAnalytics,
  OptimalTime,
  PlatformMetrics
} from '../types';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export class AnalyticsEngine {
  private supabase = createClient();

  // Get queue analytics for date range
  async getAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<QueueAnalytics[]> {
    const { data, error } = await this.supabase
      .from('queue_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get aggregated analytics
  async getAggregatedAnalytics(
    userId: string,
    days: number = 30
  ): Promise<{
    total_queued: number;
    total_posted: number;
    total_failed: number;
    success_rate: number;
    platform_breakdown: Record<string, PlatformMetrics>;
    daily_average: number;
  }> {
    const startDate = subDays(new Date(), days);
    const analytics = await this.getAnalytics(userId, startDate, new Date());

    // Aggregate metrics
    let totalQueued = 0;
    let totalPosted = 0;
    let totalFailed = 0;
    const platformMetrics: Record<string, PlatformMetrics> = {};

    for (const day of analytics) {
      totalQueued += day.items_queued;
      totalPosted += day.items_posted;
      totalFailed += day.items_failed;

      // Aggregate platform metrics
      for (const [platform, metrics] of Object.entries(day.platform_metrics || {})) {
        if (!platformMetrics[platform]) {
          platformMetrics[platform] = {
            posted: 0,
            failed: 0,
            avg_engagement: 0,
          };
        }

        const pm = metrics as PlatformMetrics;
        platformMetrics[platform].posted += pm.posted || 0;
        platformMetrics[platform].failed += pm.failed || 0;
      }
    }

    // Calculate averages
    const successRate = totalPosted > 0 
      ? (totalPosted / (totalPosted + totalFailed)) * 100 
      : 0;

    const dailyAverage = analytics.length > 0 
      ? totalPosted / analytics.length 
      : 0;

    return {
      total_queued: totalQueued,
      total_posted: totalPosted,
      total_failed: totalFailed,
      success_rate: Math.round(successRate),
      platform_breakdown: platformMetrics,
      daily_average: Math.round(dailyAverage * 10) / 10,
    };
  }

  // Calculate optimal posting times
  async calculateOptimalTimes(
    userId: string,
    platformId?: string
  ): Promise<OptimalTime[]> {
    // Get posting history with engagement data
    const { data: history, error } = await this.supabase
      .from('posting_history')
      .select(`
        *,
        queue_items!inner (
          user_id,
          scheduled_for
        ),
        social_accounts!inner (
          platform
        )
      `)
      .eq('queue_items.user_id', userId)
      .eq('success', true)
      .not('initial_engagement', 'is', null)
      .gte('posted_at', subDays(new Date(), 90).toISOString());

    if (error || !history || history.length === 0) {
      return this.getDefaultOptimalTimes();
    }

    // Calculate engagement scores by hour and day of week
    const hourlyScores = new Map<string, { total: number; count: number }>();

    for (const post of history) {
      const platform = (post as any).social_accounts?.platform || 'unknown';
      if (platformId && platform !== platformId) continue;

      const scheduledDate = new Date(post.queue_items.scheduled_for);
      const hour = scheduledDate.getHours();
      const dayOfWeek = scheduledDate.getDay();
      const key = `${platform}-${dayOfWeek}-${hour}`;

      // Calculate engagement score
      const engagement = post.initial_engagement || {};
      const score = (engagement.likes || 0) * 1 +
                   (engagement.comments || 0) * 2 +
                   (engagement.shares || 0) * 3 +
                   (engagement.views || 0) * 0.1;

      const current = hourlyScores.get(key) || { total: 0, count: 0 };
      hourlyScores.set(key, {
        total: current.total + score,
        count: current.count + 1,
      });
    }

    // Convert to optimal times
    const optimalTimes: OptimalTime[] = [];

    for (const [key, scores] of hourlyScores.entries()) {
      const [platform, dayOfWeek, hour] = key.split('-');
      const avgScore = scores.total / scores.count;

      optimalTimes.push({
        platform,
        day_of_week: parseInt(dayOfWeek),
        hour: parseInt(hour),
        engagement_score: Math.round(avgScore),
      });
    }

    // Sort by engagement score
    optimalTimes.sort((a, b) => b.engagement_score - a.engagement_score);

    // Return top times
    return optimalTimes.slice(0, 20);
  }

  // Get default optimal times based on industry standards
  private getDefaultOptimalTimes(): OptimalTime[] {
    const platforms = ['instagram', 'twitter', 'pinterest', 'linkedin', 'tiktok'];
    const defaultTimes: OptimalTime[] = [];

    const optimalHours = {
      instagram: [8, 12, 17, 19],
      twitter: [9, 12, 15, 17, 20],
      pinterest: [14, 20, 21],
      linkedin: [7, 10, 12, 17],
      tiktok: [6, 10, 19, 23],
    };

    for (const platform of platforms) {
      const hours = optimalHours[platform as keyof typeof optimalHours] || [12, 18];
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        for (const hour of hours) {
          defaultTimes.push({
            platform,
            day_of_week: dayOfWeek,
            hour,
            engagement_score: 100 - Math.abs(12 - hour) * 5, // Simple scoring
          });
        }
      }
    }

    return defaultTimes;
  }

  // Update best performing hours
  async updateBestPerformingHours(userId: string): Promise<void> {
    const today = new Date();
    const analytics = await this.calculateOptimalTimes(userId);

    // Extract unique hours with high engagement
    const bestHours = new Set<number>();
    analytics
      .slice(0, 10)
      .forEach(time => bestHours.add(time.hour));

    // Update today's analytics
    const { error } = await this.supabase
      .from('queue_analytics')
      .update({
        best_performing_hours: Array.from(bestHours),
      })
      .eq('user_id', userId)
      .eq('date', format(today, 'yyyy-MM-dd'));

    if (error) {
      console.error('Error updating best performing hours:', error);
    }
  }

  // Get posting patterns
  async getPostingPatterns(
    userId: string,
    days: number = 30
  ): Promise<{
    by_hour: Record<number, number>;
    by_day_of_week: Record<number, number>;
    by_platform: Record<string, number>;
    most_active_hour: number;
    most_active_day: number;
  }> {
    const { data: history, error } = await this.supabase
      .from('posting_history')
      .select(`
        posted_at,
        social_accounts!inner (platform)
      `)
      .gte('posted_at', subDays(new Date(), days).toISOString())
      .eq('success', true);

    if (error || !history) {
      throw error || new Error('Failed to fetch posting history');
    }

    // Initialize counters
    const byHour: Record<number, number> = {};
    const byDayOfWeek: Record<number, number> = {};
    const byPlatform: Record<string, number> = {};

    // Count posts
    for (const post of history) {
      const date = new Date(post.posted_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const platform = (post as any).social_accounts?.platform || 'unknown';

      byHour[hour] = (byHour[hour] || 0) + 1;
      byDayOfWeek[dayOfWeek] = (byDayOfWeek[dayOfWeek] || 0) + 1;
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    }

    // Find most active times
    const mostActiveHour = Object.entries(byHour)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 12;

    const mostActiveDay = Object.entries(byDayOfWeek)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 0;

    return {
      by_hour: byHour,
      by_day_of_week: byDayOfWeek,
      by_platform: byPlatform,
      most_active_hour: parseInt(mostActiveHour),
      most_active_day: parseInt(mostActiveDay),
    };
  }

  // Get content performance
  async getContentPerformance(
    userId: string,
    days: number = 30
  ): Promise<{
    by_content_type: Record<string, { count: number; avg_engagement: number }>;
    top_performing_posts: Array<{
      queue_item_id: string;
      caption?: string;
      total_engagement: number;
      posted_at: string;
    }>;
  }> {
    const { data: history, error } = await this.supabase
      .from('posting_history')
      .select(`
        *,
        queue_items!inner (
          user_id,
          content_type,
          caption
        )
      `)
      .eq('queue_items.user_id', userId)
      .eq('success', true)
      .gte('posted_at', subDays(new Date(), days).toISOString())
      .not('initial_engagement', 'is', null);

    if (error || !history) {
      throw error || new Error('Failed to fetch content performance');
    }

    // Analyze by content type
    const byContentType: Record<string, { total: number; count: number }> = {};
    const posts: Array<any> = [];

    for (const post of history) {
      const contentType = post.queue_items.content_type;
      const engagement = post.initial_engagement || {};
      const totalEngagement = (engagement.likes || 0) +
                            (engagement.comments || 0) * 2 +
                            (engagement.shares || 0) * 3;

      // Update content type stats
      if (!byContentType[contentType]) {
        byContentType[contentType] = { total: 0, count: 0 };
      }
      byContentType[contentType].total += totalEngagement;
      byContentType[contentType].count += 1;

      // Track individual posts
      posts.push({
        queue_item_id: post.queue_item_id,
        caption: post.queue_items.caption,
        total_engagement: totalEngagement,
        posted_at: post.posted_at,
      });
    }

    // Calculate averages and sort posts
    const contentTypeStats: Record<string, { count: number; avg_engagement: number }> = {};
    for (const [type, stats] of Object.entries(byContentType)) {
      contentTypeStats[type] = {
        count: stats.count,
        avg_engagement: Math.round(stats.total / stats.count),
      };
    }

    const topPosts = posts
      .sort((a, b) => b.total_engagement - a.total_engagement)
      .slice(0, 10);

    return {
      by_content_type: contentTypeStats,
      top_performing_posts: topPosts,
    };
  }
}