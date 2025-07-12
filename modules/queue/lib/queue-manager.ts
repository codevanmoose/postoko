import { createClient } from '@postoko/database';
import { 
  QueueItem, 
  CreateQueueItemRequest, 
  UpdateQueueItemRequest,
  QueueStatus,
  PostingHistory
} from '../types';
import { addHours, isAfter, isBefore } from 'date-fns';

export class QueueManager {
  private supabase = createClient();

  // Add item to queue
  async addToQueue(userId: string, request: CreateQueueItemRequest): Promise<QueueItem> {
    // Validate scheduling time
    const scheduledTime = new Date(request.scheduled_for);
    if (isBefore(scheduledTime, new Date())) {
      throw new Error('Cannot schedule posts in the past');
    }

    // Check for conflicts
    const hasConflict = await this.checkSchedulingConflict(
      userId,
      request.social_account_ids,
      scheduledTime
    );

    if (hasConflict) {
      throw new Error('Another post is already scheduled too close to this time');
    }

    const { data, error } = await this.supabase
      .from('queue_items')
      .insert({
        user_id: userId,
        ...request,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update queue item
  async updateQueueItem(
    userId: string,
    itemId: string,
    updates: UpdateQueueItemRequest
  ): Promise<QueueItem> {
    // If rescheduling, check for conflicts
    if (updates.scheduled_for) {
      const scheduledTime = new Date(updates.scheduled_for);
      
      const { data: item } = await this.supabase
        .from('queue_items')
        .select('social_account_ids')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (item) {
        const hasConflict = await this.checkSchedulingConflict(
          userId,
          item.social_account_ids,
          scheduledTime,
          itemId // Exclude current item from conflict check
        );

        if (hasConflict) {
          throw new Error('Another post is already scheduled too close to this time');
        }
      }
    }

    const { data, error } = await this.supabase
      .from('queue_items')
      .update(updates)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Remove from queue
  async removeFromQueue(userId: string, itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('queue_items')
      .update({ status: 'cancelled' })
      .eq('id', itemId)
      .eq('user_id', userId)
      .in('status', ['pending', 'scheduled']);

    if (error) throw error;
  }

  // Get queue items
  async getQueueItems(
    userId: string,
    filters?: {
      status?: string[];
      startDate?: Date;
      endDate?: Date;
      accountIds?: string[];
    }
  ): Promise<QueueItem[]> {
    let query = this.supabase
      .from('queue_items')
      .select('*')
      .eq('user_id', userId)
      .order('scheduled_for', { ascending: true });

    if (filters?.status) {
      query = query.in('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('scheduled_for', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('scheduled_for', filters.endDate.toISOString());
    }

    if (filters?.accountIds && filters.accountIds.length > 0) {
      query = query.contains('social_account_ids', filters.accountIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  // Get queue status
  async getQueueStatus(userId: string): Promise<QueueStatus> {
    const { data, error } = await this.supabase
      .from('queue_items')
      .select('status, scheduled_for')
      .eq('user_id', userId)
      .in('status', ['pending', 'scheduled', 'processing', 'failed']);

    if (error) throw error;

    const items = data || [];
    const now = new Date();

    const status: QueueStatus = {
      pending_count: items.filter(i => i.status === 'pending').length,
      scheduled_count: items.filter(i => i.status === 'scheduled').length,
      processing_count: items.filter(i => i.status === 'processing').length,
      failed_count: items.filter(i => i.status === 'failed').length,
      is_healthy: true,
      errors: [],
    };

    // Find next post time
    const futureItems = items
      .filter(i => i.status === 'scheduled' && new Date(i.scheduled_for) > now)
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());

    if (futureItems.length > 0) {
      status.next_post_time = futureItems[0].scheduled_for;
    }

    // Check health
    if (status.failed_count > 5) {
      status.is_healthy = false;
      status.errors?.push('High number of failed posts');
    }

    if (status.processing_count > 10) {
      status.is_healthy = false;
      status.errors?.push('Too many items stuck in processing');
    }

    return status;
  }

  // Get posting history
  async getPostingHistory(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      accountId?: string;
      success?: boolean;
    }
  ): Promise<PostingHistory[]> {
    let query = this.supabase
      .from('posting_history')
      .select(`
        *,
        queue_items!inner (user_id)
      `)
      .eq('queue_items.user_id', userId)
      .order('posted_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('posted_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('posted_at', filters.endDate.toISOString());
    }

    if (filters?.accountId) {
      query = query.eq('social_account_id', filters.accountId);
    }

    if (filters?.success !== undefined) {
      query = query.eq('success', filters.success);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  // Check for scheduling conflicts
  private async checkSchedulingConflict(
    userId: string,
    accountIds: string[],
    scheduledTime: Date,
    excludeItemId?: string
  ): Promise<boolean> {
    // Check within 30 minutes before and after
    const windowStart = addHours(scheduledTime, -0.5);
    const windowEnd = addHours(scheduledTime, 0.5);

    let query = this.supabase
      .from('queue_items')
      .select('id, social_account_ids, scheduled_for')
      .eq('user_id', userId)
      .in('status', ['scheduled', 'processing'])
      .gte('scheduled_for', windowStart.toISOString())
      .lte('scheduled_for', windowEnd.toISOString());

    if (excludeItemId) {
      query = query.neq('id', excludeItemId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Check if any items share social accounts
    return (data || []).some(item => {
      const sharedAccounts = item.social_account_ids.filter((id: string) => 
        accountIds.includes(id)
      );
      return sharedAccounts.length > 0;
    });
  }

  // Retry failed item
  async retryFailedItem(userId: string, itemId: string): Promise<QueueItem> {
    const { data: item, error: fetchError } = await this.supabase
      .from('queue_items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', userId)
      .eq('status', 'failed')
      .single();

    if (fetchError || !item) {
      throw new Error('Failed item not found');
    }

    // Reset for retry
    const { data, error } = await this.supabase
      .from('queue_items')
      .update({
        status: 'scheduled',
        attempts: 0,
        error_message: null,
        next_retry_at: null,
        scheduled_for: new Date().toISOString(), // Schedule for immediate retry
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Bulk operations
  async bulkUpdateStatus(
    userId: string,
    itemIds: string[],
    status: 'cancelled' | 'scheduled'
  ): Promise<void> {
    const { error } = await this.supabase
      .from('queue_items')
      .update({ status })
      .eq('user_id', userId)
      .in('id', itemIds)
      .in('status', ['pending', 'scheduled', 'failed']);

    if (error) throw error;
  }

  // Get items ready for processing
  async getItemsForProcessing(limit: number = 10): Promise<QueueItem[]> {
    const now = new Date();

    const { data, error } = await this.supabase
      .from('queue_items')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Mark item as processing
  async markAsProcessing(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('queue_items')
      .update({
        status: 'processing',
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('status', 'scheduled');

    if (error) throw error;
  }

  // Mark item as posted
  async markAsPosted(itemId: string, results: PostingHistory[]): Promise<void> {
    const { error } = await this.supabase
      .from('queue_items')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) throw error;

    // Record posting history
    if (results.length > 0) {
      await this.supabase
        .from('posting_history')
        .insert(results);
    }
  }

  // Mark item as failed
  async markAsFailed(itemId: string, error: string): Promise<void> {
    const { data: item } = await this.supabase
      .from('queue_items')
      .select('attempts')
      .eq('id', itemId)
      .single();

    const attempts = (item?.attempts || 0) + 1;
    const nextRetry = attempts < 3 
      ? addHours(new Date(), Math.pow(2, attempts)) // Exponential backoff
      : null;

    await this.supabase
      .from('queue_items')
      .update({
        status: attempts >= 3 ? 'failed' : 'scheduled',
        attempts,
        error_message: error,
        next_retry_at: nextRetry?.toISOString(),
        scheduled_for: nextRetry?.toISOString() || undefined,
      })
      .eq('id', itemId);
  }
}