import { createClient } from '@postoko/database';
import { 
  QueueSchedule, 
  CreateScheduleRequest, 
  TimeSlot,
  QueueItem,
  CreateQueueItemRequest
} from '../types';
import { 
  addDays, 
  setHours, 
  setMinutes, 
  isAfter, 
  isBefore,
  addHours,
  startOfDay,
  endOfDay,
  format,
  getDay
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export class Scheduler {
  private supabase = createClient();

  // Create a new schedule
  async createSchedule(userId: string, request: CreateScheduleRequest): Promise<QueueSchedule> {
    const { data, error } = await this.supabase
      .from('queue_schedules')
      .insert({
        user_id: userId,
        ...request,
        max_posts_per_day: request.max_posts_per_day || 3,
        min_hours_between_posts: request.min_hours_between_posts || 4,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update schedule
  async updateSchedule(
    userId: string,
    scheduleId: string,
    updates: Partial<CreateScheduleRequest>
  ): Promise<QueueSchedule> {
    const { data, error } = await this.supabase
      .from('queue_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Toggle schedule active status
  async toggleSchedule(userId: string, scheduleId: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('queue_schedules')
      .update({ is_active: isActive })
      .eq('id', scheduleId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Delete schedule
  async deleteSchedule(userId: string, scheduleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('queue_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Get user schedules
  async getSchedules(userId: string, activeOnly = false): Promise<QueueSchedule[]> {
    let query = this.supabase
      .from('queue_schedules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  // Get next scheduled times
  async getNextScheduledTimes(
    schedule: QueueSchedule,
    startDate: Date,
    days: number = 7
  ): Promise<Date[]> {
    const scheduledTimes: Date[] = [];
    const endDate = addDays(startDate, days);
    let currentDate = startDate;

    while (isBefore(currentDate, endDate)) {
      // Check if this day is included in the schedule
      if (this.isDayIncluded(schedule, currentDate)) {
        // Add all time slots for this day
        for (const slot of schedule.time_slots) {
          const scheduledTime = this.getScheduledTime(currentDate, slot);
          
          // Only include future times
          if (isAfter(scheduledTime, new Date())) {
            scheduledTimes.push(scheduledTime);
          }
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }

    return scheduledTimes.sort((a, b) => a.getTime() - b.getTime());
  }

  // Generate queue items from schedule
  async generateQueueItems(
    userId: string,
    scheduleId: string,
    days: number = 7
  ): Promise<CreateQueueItemRequest[]> {
    const schedule = await this.getSchedule(userId, scheduleId);
    if (!schedule || !schedule.is_active) {
      throw new Error('Schedule not found or inactive');
    }

    const scheduledTimes = await this.getNextScheduledTimes(schedule, new Date(), days);
    const queueItems: CreateQueueItemRequest[] = [];

    // Get existing queue items to check for conflicts
    const existingItems = await this.getExistingQueueItems(
      userId,
      schedule.social_account_ids,
      startOfDay(new Date()),
      endOfDay(addDays(new Date(), days))
    );

    // Check daily limits
    const dailyCounts = this.countItemsByDay(existingItems);

    for (const scheduledTime of scheduledTimes) {
      const dayKey = format(scheduledTime, 'yyyy-MM-dd');
      const dayCount = dailyCounts.get(dayKey) || 0;

      // Skip if daily limit reached
      if (dayCount >= schedule.max_posts_per_day) {
        continue;
      }

      // Check minimum spacing
      const hasTooClosePost = existingItems.some(item => {
        const itemTime = new Date(item.scheduled_for);
        const hoursDiff = Math.abs(itemTime.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60);
        return hoursDiff < schedule.min_hours_between_posts;
      });

      if (!hasTooClosePost) {
        queueItems.push({
          content_type: 'drive_file', // Will be determined by content selector
          scheduled_for: scheduledTime.toISOString(),
          social_account_ids: schedule.social_account_ids,
          metadata: {
            schedule_id: scheduleId,
            auto_generated: true,
          },
        });

        // Update daily count
        dailyCounts.set(dayKey, dayCount + 1);
      }
    }

    return queueItems;
  }

  // Preview schedule
  async previewSchedule(
    schedule: QueueSchedule,
    days: number = 7
  ): Promise<{
    scheduled_times: Date[];
    total_posts: number;
    posts_per_day: Map<string, number>;
  }> {
    const scheduledTimes = await this.getNextScheduledTimes(schedule, new Date(), days);
    const postsPerDay = new Map<string, number>();

    for (const time of scheduledTimes) {
      const dayKey = format(time, 'yyyy-MM-dd');
      postsPerDay.set(dayKey, (postsPerDay.get(dayKey) || 0) + 1);
    }

    // Apply daily limits
    const limitedTimes: Date[] = [];
    const limitedPostsPerDay = new Map<string, number>();

    for (const time of scheduledTimes) {
      const dayKey = format(time, 'yyyy-MM-dd');
      const dayCount = limitedPostsPerDay.get(dayKey) || 0;

      if (dayCount < schedule.max_posts_per_day) {
        limitedTimes.push(time);
        limitedPostsPerDay.set(dayKey, dayCount + 1);
      }
    }

    return {
      scheduled_times: limitedTimes,
      total_posts: limitedTimes.length,
      posts_per_day: limitedPostsPerDay,
    };
  }

  // Private helper methods
  private async getSchedule(userId: string, scheduleId: string): Promise<QueueSchedule | null> {
    const { data, error } = await this.supabase
      .from('queue_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  private isDayIncluded(schedule: QueueSchedule, date: Date): boolean {
    if (schedule.schedule_type === 'daily') {
      return true;
    }

    if (schedule.schedule_type === 'weekly' && schedule.days_of_week) {
      const dayOfWeek = getDay(date);
      return schedule.days_of_week.includes(dayOfWeek);
    }

    // Custom schedules - implement custom logic here
    return true;
  }

  private getScheduledTime(date: Date, slot: TimeSlot): Date {
    // Convert to the slot's timezone
    const zonedDate = utcToZonedTime(date, slot.timezone);
    
    // Set the time
    const scheduledTime = setMinutes(setHours(zonedDate, slot.hour), slot.minute);
    
    // Convert back to UTC
    return zonedTimeToUtc(scheduledTime, slot.timezone);
  }

  private async getExistingQueueItems(
    userId: string,
    accountIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<QueueItem[]> {
    const { data, error } = await this.supabase
      .from('queue_items')
      .select('*')
      .eq('user_id', userId)
      .contains('social_account_ids', accountIds)
      .in('status', ['scheduled', 'processing'])
      .gte('scheduled_for', startDate.toISOString())
      .lte('scheduled_for', endDate.toISOString());

    if (error) throw error;
    return data || [];
  }

  private countItemsByDay(items: QueueItem[]): Map<string, number> {
    const counts = new Map<string, number>();

    for (const item of items) {
      const dayKey = format(new Date(item.scheduled_for), 'yyyy-MM-dd');
      counts.set(dayKey, (counts.get(dayKey) || 0) + 1);
    }

    return counts;
  }

  // Find optimal posting times based on analytics
  async findOptimalTimes(
    userId: string,
    platformId?: string
  ): Promise<TimeSlot[]> {
    // Query analytics for best performing hours
    const { data, error } = await this.supabase
      .from('queue_analytics')
      .select('best_performing_hours, platform_metrics')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (error || !data || data.length === 0) {
      // Return default optimal times
      return this.getDefaultOptimalTimes();
    }

    // Aggregate best hours across recent analytics
    const hourScores = new Map<number, number>();

    for (const analytics of data) {
      if (analytics.best_performing_hours) {
        for (const hour of analytics.best_performing_hours) {
          hourScores.set(hour, (hourScores.get(hour) || 0) + 1);
        }
      }
    }

    // Sort hours by score
    const sortedHours = Array.from(hourScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour]) => hour);

    // Convert to time slots (assuming user's local timezone for now)
    return sortedHours.map(hour => ({
      hour,
      minute: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }));
  }

  private getDefaultOptimalTimes(): TimeSlot[] {
    // Industry standard optimal posting times
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return [
      { hour: 8, minute: 0, timezone },   // Morning
      { hour: 12, minute: 0, timezone },  // Lunch
      { hour: 17, minute: 0, timezone },  // End of work
      { hour: 19, minute: 0, timezone },  // Evening
    ];
  }
}