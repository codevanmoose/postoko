// Database types generated from Supabase schema
// This file will be auto-generated in production using: supabase gen types typescript

export type SubscriptionTier = 'starter' | 'pro' | 'growth' | 'studio' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type PostStatus = 'queued' | 'processing' | 'posted' | 'failed' | 'archived';
export type PlatformType = 'google' | 'instagram' | 'twitter' | 'pinterest' | 'threads' | 'tiktok';
export type QueueMode = 'sequential_old' | 'sequential_new' | 'random' | 'smart_mix' | 'weighted';
export type CaptionSource = 'file' | 'ai' | 'manual' | 'template';
export type GenerationType = 'caption' | 'image' | 'hashtags';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          subscription_tier: SubscriptionTier;
          subscription_status: SubscriptionStatus;
          subscription_current_period_end: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus;
          subscription_current_period_end?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_status?: SubscriptionStatus;
          subscription_current_period_end?: string | null;
          timezone?: string;
          updated_at?: string;
        };
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: PlatformType;
          account_id: string;
          account_name: string | null;
          account_avatar: string | null;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: PlatformType;
          account_id: string;
          account_name?: string | null;
          account_avatar?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_name?: string | null;
          account_avatar?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      monitored_folders: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string;
          folder_name: string | null;
          folder_path: string | null;
          brand_name: string | null;
          last_scanned: string | null;
          queue_mode: QueueMode;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id: string;
          folder_name?: string | null;
          folder_path?: string | null;
          brand_name?: string | null;
          last_scanned?: string | null;
          queue_mode?: QueueMode;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          folder_name?: string | null;
          folder_path?: string | null;
          brand_name?: string | null;
          last_scanned?: string | null;
          queue_mode?: QueueMode;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          folder_id: string;
          file_id: string;
          file_name: string;
          file_url: string | null;
          thumbnail_url: string | null;
          caption: string | null;
          caption_source: CaptionSource;
          hashtags: string[] | null;
          scheduled_for: string | null;
          posted_at: string | null;
          status: PostStatus;
          is_ai_generated: boolean;
          source_post_id: string | null;
          retry_count: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          folder_id: string;
          file_id: string;
          file_name: string;
          file_url?: string | null;
          thumbnail_url?: string | null;
          caption?: string | null;
          caption_source?: CaptionSource;
          hashtags?: string[] | null;
          scheduled_for?: string | null;
          posted_at?: string | null;
          status?: PostStatus;
          is_ai_generated?: boolean;
          source_post_id?: string | null;
          retry_count?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          caption?: string | null;
          caption_source?: CaptionSource;
          hashtags?: string[] | null;
          scheduled_for?: string | null;
          posted_at?: string | null;
          status?: PostStatus;
          retry_count?: number;
          error_message?: string | null;
          updated_at?: string;
        };
      };
      platform_posts: {
        Row: {
          id: string;
          post_id: string;
          platform: PlatformType;
          account_id: string;
          platform_post_id: string | null;
          platform_url: string | null;
          status: PostStatus;
          error_message: string | null;
          engagement_data: Record<string, any> | null;
          posted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          platform: PlatformType;
          account_id: string;
          platform_post_id?: string | null;
          platform_url?: string | null;
          status?: PostStatus;
          error_message?: string | null;
          engagement_data?: Record<string, any> | null;
          posted_at?: string | null;
          created_at?: string;
        };
        Update: {
          platform_post_id?: string | null;
          platform_url?: string | null;
          status?: PostStatus;
          error_message?: string | null;
          engagement_data?: Record<string, any> | null;
          posted_at?: string | null;
        };
      };
      ai_generations: {
        Row: {
          id: string;
          user_id: string;
          source_post_id: string | null;
          generation_type: GenerationType;
          model: string;
          prompt: string | null;
          style_analysis: Record<string, any> | null;
          result_url: string | null;
          result_text: string | null;
          safety_score: number | null;
          credits_used: number;
          performance_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_post_id?: string | null;
          generation_type: GenerationType;
          model: string;
          prompt?: string | null;
          style_analysis?: Record<string, any> | null;
          result_url?: string | null;
          result_text?: string | null;
          safety_score?: number | null;
          credits_used?: number;
          performance_score?: number | null;
          created_at?: string;
        };
        Update: {
          performance_score?: number | null;
        };
      };
      ai_style_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          base_prompt: string | null;
          style_parameters: Record<string, any> | null;
          sample_images: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          base_prompt?: string | null;
          style_parameters?: Record<string, any> | null;
          sample_images?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          base_prompt?: string | null;
          style_parameters?: Record<string, any> | null;
          sample_images?: string[] | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      ai_usage: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          images_generated: number;
          captions_generated: number;
          hashtags_generated: number;
          credits_used: number;
          credits_remaining: number | null;
          tier_limit: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          images_generated?: number;
          captions_generated?: number;
          hashtags_generated?: number;
          credits_used?: number;
          credits_remaining?: number | null;
          tier_limit?: number | null;
          created_at?: string;
        };
        Update: {
          images_generated?: number;
          captions_generated?: number;
          hashtags_generated?: number;
          credits_used?: number;
          credits_remaining?: number | null;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          posting_times: Record<string, any>;
          caption_personas: string[] | null;
          default_hashtag_sets: Record<string, any> | null;
          empty_queue_behavior: string;
          ai_style_preference: string;
          notification_preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          posting_times?: Record<string, any>;
          caption_personas?: string[] | null;
          default_hashtag_sets?: Record<string, any> | null;
          empty_queue_behavior?: string;
          ai_style_preference?: string;
          notification_preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          posting_times?: Record<string, any>;
          caption_personas?: string[] | null;
          default_hashtag_sets?: Record<string, any> | null;
          empty_queue_behavior?: string;
          ai_style_preference?: string;
          notification_preferences?: Record<string, any>;
          updated_at?: string;
        };
      };
      hashtag_analytics: {
        Row: {
          id: string;
          user_id: string;
          hashtag: string;
          platform: PlatformType;
          usage_count: number;
          total_reach: number;
          total_engagement: number;
          competition_level: string | null;
          last_used: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hashtag: string;
          platform: PlatformType;
          usage_count?: number;
          total_reach?: number;
          total_engagement?: number;
          competition_level?: string | null;
          last_used?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          usage_count?: number;
          total_reach?: number;
          total_engagement?: number;
          competition_level?: string | null;
          last_used?: string | null;
          updated_at?: string;
        };
      };
      subscription_events: {
        Row: {
          id: string;
          user_id: string;
          stripe_event_id: string | null;
          event_type: string;
          tier: SubscriptionTier | null;
          amount: number | null;
          currency: string;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_event_id?: string | null;
          event_type: string;
          tier?: SubscriptionTier | null;
          amount?: number | null;
          currency?: string;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          metadata?: Record<string, any> | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      post_status: PostStatus;
      platform_type: PlatformType;
      queue_mode: QueueMode;
      caption_source: CaptionSource;
      generation_type: GenerationType;
    };
  };
}