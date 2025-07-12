import { createClient } from '@postoko/database';
import { SocialPoster } from '@postoko/social';
import { QueueManager } from './queue-manager';
import { ContentSelector } from './content-selector';
import { 
  QueueItem,
  PostingHistory,
  QueueSchedule
} from '../types';
import { isAfter } from 'date-fns';

export class QueueProcessor {
  private supabase = createClient();
  private queueManager = new QueueManager();
  private contentSelector = new ContentSelector();
  private socialPoster = new SocialPoster();
  private isProcessing = false;
  private processInterval: ReturnType<typeof setInterval> | null = null;

  // Start queue processing
  start(intervalMinutes: number = 5) {
    if (this.processInterval) {
      this.stop();
    }

    // Process immediately
    this.process();

    // Set up interval
    this.processInterval = setInterval(() => {
      this.process();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop queue processing
  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  // Main processing loop
  async process() {
    if (this.isProcessing) {
      console.log('Queue processor already running, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('Starting queue processing...');

    try {
      // Process scheduled items
      await this.processScheduledItems();

      // Process active schedules
      await this.processActiveSchedules();

      // Clean up old items
      await this.cleanupOldItems();
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
      console.log('Queue processing completed');
    }
  }

  // Process items ready for posting
  private async processScheduledItems() {
    try {
      const items = await this.queueManager.getItemsForProcessing(10);
      console.log(`Found ${items.length} items ready for processing`);

      for (const item of items) {
        await this.processQueueItem(item);
      }
    } catch (error) {
      console.error('Error processing scheduled items:', error);
    }
  }

  // Process a single queue item
  private async processQueueItem(item: QueueItem) {
    console.log(`Processing queue item ${item.id}`);

    try {
      // Mark as processing
      await this.queueManager.markAsProcessing(item.id);

      // Validate content availability
      if (item.content_id) {
        const isAvailable = await this.contentSelector.isContentAvailable(
          item.user_id,
          item.content_type,
          item.content_id
        );

        if (!isAvailable) {
          throw new Error('Content is no longer available');
        }
      }

      // Post to each platform
      const results: PostingHistory[] = [];
      const errors: string[] = [];

      for (const accountId of item.social_account_ids) {
        try {
          // Fetch the social account details
          const { data: account, error: accountError } = await this.supabase
            .from('social_accounts')
            .select('*, platform:social_platforms(*)')
            .eq('id', accountId)
            .single();

          if (accountError || !account) {
            throw new Error(`Failed to fetch social account: ${accountError?.message || 'Not found'}`);
          }

          const postResult = await this.socialPoster.postToAccount(account, {
            caption: item.caption || '',
            media_urls: item.media_urls || [],
            hashtags: item.hashtags || [],
          });

          results.push({
            id: crypto.randomUUID(),
            queue_item_id: item.id,
            social_account_id: accountId,
            success: postResult.success,
            platform_post_id: postResult.post_id,
            post_url: postResult.url,
            error_message: postResult.error,
            posted_at: new Date().toISOString(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${accountId}: ${errorMessage}`);

          results.push({
            id: crypto.randomUUID(),
            queue_item_id: item.id,
            social_account_id: accountId,
            success: false,
            error_message: errorMessage,
            posted_at: new Date().toISOString(),
          });
        }
      }

      // Update item status
      if (errors.length === 0) {
        await this.queueManager.markAsPosted(item.id, results);
        console.log(`Successfully posted item ${item.id}`);
      } else if (errors.length === item.social_account_ids.length) {
        // All platforms failed
        await this.queueManager.markAsFailed(item.id, errors.join('; '));
        console.error(`Failed to post item ${item.id}: ${errors.join('; ')}`);
      } else {
        // Partial success
        await this.queueManager.markAsPosted(item.id, results);
        console.warn(`Partially posted item ${item.id} with errors: ${errors.join('; ')}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.queueManager.markAsFailed(item.id, errorMessage);
      console.error(`Failed to process item ${item.id}:`, error);
    }
  }

  // Process active schedules to generate new queue items
  private async processActiveSchedules() {
    try {
      // Get all active schedules
      const { data: schedules, error } = await this.supabase
        .from('queue_schedules')
        .select('*')
        .eq('is_active', true);

      if (error || !schedules) {
        console.error('Error fetching active schedules:', error);
        return;
      }

      console.log(`Processing ${schedules.length} active schedules`);

      for (const schedule of schedules) {
        await this.processSchedule(schedule);
      }
    } catch (error) {
      console.error('Error processing active schedules:', error);
    }
  }

  // Process a single schedule
  private async processSchedule(schedule: QueueSchedule) {
    try {
      // Check if we need to generate items for this schedule
      const needsItems = await this.scheduleNeedsItems(schedule);
      
      if (!needsItems) {
        return;
      }

      // Generate queue items from schedule
      const scheduler = await import('./scheduler').then(m => new m.Scheduler());
      const queueItems = await scheduler.generateQueueItems(
        schedule.user_id,
        schedule.id,
        7 // Generate for next 7 days
      );

      console.log(`Generated ${queueItems.length} items for schedule ${schedule.id}`);

      // For each generated item, select content and add to queue
      for (const queueItem of queueItems) {
        try {
          // Select content
          const content = await this.contentSelector.selectContent(
            schedule.user_id,
            schedule.source_type,
            schedule.source_config
          );

          if (!content) {
            console.warn(`No content available for schedule ${schedule.id}`);
            continue;
          }

          // Add to queue with selected content
          await this.queueManager.addToQueue(schedule.user_id, {
            ...queueItem,
            content_type: content.content_type,
            content_id: content.content_id,
            caption: content.suggested_caption,
            hashtags: content.suggested_hashtags,
            media_urls: content.media_urls,
          });
        } catch (error) {
          console.error(`Error creating queue item for schedule ${schedule.id}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error processing schedule ${schedule.id}:`, error);
    }
  }

  // Check if schedule needs new items
  private async scheduleNeedsItems(schedule: QueueSchedule): Promise<boolean> {
    // Check if there are already enough scheduled items
    const { data: existingItems, error } = await this.supabase
      .from('queue_items')
      .select('id')
      .eq('user_id', schedule.user_id)
      .contains('social_account_ids', schedule.social_account_ids)
      .in('status', ['scheduled', 'processing'])
      .gte('scheduled_for', new Date().toISOString());

    if (error) {
      console.error('Error checking existing items:', error);
      return false;
    }

    // Generate items if we have less than 3 days worth
    const minItemsNeeded = schedule.max_posts_per_day * 3;
    return (existingItems?.length || 0) < minItemsNeeded;
  }

  // Clean up old items
  private async cleanupOldItems() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete old cancelled items
      const { error: cancelledError } = await this.supabase
        .from('queue_items')
        .delete()
        .eq('status', 'cancelled')
        .lt('updated_at', thirtyDaysAgo.toISOString());

      if (cancelledError) {
        console.error('Error cleaning up cancelled items:', cancelledError);
      }

      // Archive old posted items (move to posting_history if not already there)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { error: postedError } = await this.supabase
        .from('queue_items')
        .delete()
        .eq('status', 'posted')
        .lt('posted_at', ninetyDaysAgo.toISOString());

      if (postedError) {
        console.error('Error cleaning up old posted items:', postedError);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Process single item (for manual trigger)
  async processSingleItem(itemId: string): Promise<void> {
    const { data: item, error } = await this.supabase
      .from('queue_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !item) {
      throw new Error('Queue item not found');
    }

    await this.processQueueItem(item);
  }

  // Get processor status
  getStatus(): {
    is_running: boolean;
    interval_minutes: number | null;
  } {
    return {
      is_running: this.processInterval !== null,
      interval_minutes: this.processInterval ? 5 : null,
    };
  }
}