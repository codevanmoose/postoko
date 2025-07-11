export type QueueItemStatus = 'pending' | 'scheduled' | 'processing' | 'posted' | 'failed' | 'cancelled';
export type ContentType = 'drive_file' | 'ai_generated' | 'manual';
export type ScheduleType = 'daily' | 'weekly' | 'custom';
export type SourceType = 'drive_folders' | 'ai_prompt';

export interface QueueItem {
  id: string;
  user_id: string;
  status: QueueItemStatus;
  priority: number;
  
  // Content
  content_type: ContentType;
  content_id?: string;
  caption?: string;
  hashtags?: string[];
  media_urls?: string[];
  
  // Scheduling
  scheduled_for: string;
  posted_at?: string;
  
  // Target platforms
  social_account_ids: string[];
  
  // Processing
  attempts: number;
  last_attempt_at?: string;
  next_retry_at?: string;
  error_message?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface QueueSchedule {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  
  // Schedule configuration
  schedule_type: ScheduleType;
  time_slots: TimeSlot[];
  days_of_week?: number[]; // 0-6 for Sunday-Saturday
  
  // Content source
  source_type: SourceType;
  source_config: SourceConfig;
  
  // Target configuration
  social_account_ids: string[];
  template_id?: string;
  
  // Settings
  max_posts_per_day: number;
  min_hours_between_posts: number;
  
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  hour: number; // 0-23
  minute: number; // 0-59
  timezone: string; // e.g., 'America/New_York'
}

export interface SourceConfig {
  // For drive_folders
  folder_ids?: string[];
  selection_strategy?: 'random' | 'oldest' | 'newest';
  
  // For ai_prompt
  prompt?: string;
  style?: string;
  
  // Common
  filters?: {
    min_size?: number;
    max_size?: number;
    mime_types?: string[];
  };
}

export interface PostingHistory {
  id: string;
  queue_item_id: string;
  social_account_id: string;
  
  // Result
  success: boolean;
  platform_post_id?: string;
  post_url?: string;
  error_message?: string;
  
  // Metrics
  initial_engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  
  posted_at: string;
}

export interface QueueAnalytics {
  id: string;
  user_id: string;
  date: string;
  
  // Metrics
  items_queued: number;
  items_posted: number;
  items_failed: number;
  
  // Performance by platform
  platform_metrics: Record<string, PlatformMetrics>;
  
  // Timing analysis
  best_performing_hours?: number[];
  
  created_at: string;
}

export interface PlatformMetrics {
  posted: number;
  failed: number;
  avg_engagement?: number;
}

export interface CreateQueueItemRequest {
  content_type: ContentType;
  content_id?: string;
  caption?: string;
  hashtags?: string[];
  media_urls?: string[];
  scheduled_for: string;
  social_account_ids: string[];
  priority?: number;
  metadata?: Record<string, any>;
}

export interface UpdateQueueItemRequest {
  status?: QueueItemStatus;
  caption?: string;
  hashtags?: string[];
  scheduled_for?: string;
  priority?: number;
}

export interface CreateScheduleRequest {
  name: string;
  schedule_type: ScheduleType;
  time_slots: TimeSlot[];
  days_of_week?: number[];
  source_type: SourceType;
  source_config: SourceConfig;
  social_account_ids: string[];
  template_id?: string;
  max_posts_per_day?: number;
  min_hours_between_posts?: number;
}

export interface QueueStatus {
  pending_count: number;
  scheduled_count: number;
  processing_count: number;
  failed_count: number;
  next_post_time?: string;
  is_healthy: boolean;
  errors?: string[];
}

export interface OptimalTime {
  platform: string;
  day_of_week: number;
  hour: number;
  engagement_score: number;
}

export interface ContentSelectionResult {
  content_id: string;
  content_type: ContentType;
  media_urls: string[];
  suggested_caption?: string;
  suggested_hashtags?: string[];
}