// Shared type definitions for Postoko

import type { Database } from '@postoko/database';

// User types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// Post types
export type Post = Database['public']['Tables']['posts']['Row'];
export type PostInsert = Database['public']['Tables']['posts']['Insert'];
export type PostUpdate = Database['public']['Tables']['posts']['Update'];

// Platform types
export type ConnectedAccount = Database['public']['Tables']['connected_accounts']['Row'];
export type PlatformPost = Database['public']['Tables']['platform_posts']['Row'];

// AI types
export type AIGeneration = Database['public']['Tables']['ai_generations']['Row'];
export type AIStyleTemplate = Database['public']['Tables']['ai_style_templates']['Row'];

// Settings types
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type MonitoredFolder = Database['public']['Tables']['monitored_folders']['Row'];

// Analytics types
export type HashtagAnalytics = Database['public']['Tables']['hashtag_analytics']['Row'];
export type AIUsage = Database['public']['Tables']['ai_usage']['Row'];

// Subscription types
export type SubscriptionEvent = Database['public']['Tables']['subscription_events']['Row'];

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Auth types
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Feature-specific types
export interface PostingSchedule {
  daily?: string[];
  timezone: string;
}

export interface CaptionPersona {
  id: string;
  name: string;
  description: string;
  tone: string;
  includeEmojis: boolean;
  includeHashtags: boolean;
  maxLength: number;
}

export interface HashtagSet {
  id: string;
  name: string;
  platform: Database['public']['Enums']['platform_type'];
  hashtags: string[];
  isDefault: boolean;
}

export interface AIGenerationRequest {
  type: Database['public']['Enums']['generation_type'];
  sourcePostId?: string;
  prompt?: string;
  model?: string;
  styleTemplateId?: string;
}

export interface PostQueueItem extends Post {
  folder: MonitoredFolder;
  platformAccounts: ConnectedAccount[];
}

// Tier limits
export const TIER_LIMITS = {
  starter: {
    postsPerDay: 1,
    aiImagesPerMonth: 0,
    folders: 1,
    accountsPerPlatform: 1,
  },
  pro: {
    postsPerDay: 3,
    aiImagesPerMonth: 30,
    folders: 1,
    accountsPerPlatform: 1,
  },
  growth: {
    postsPerDay: 10,
    aiImagesPerMonth: 150,
    folders: 3,
    accountsPerPlatform: 2,
  },
  studio: {
    postsPerDay: 25,
    aiImagesPerMonth: 450,
    folders: 10,
    accountsPerPlatform: 5,
  },
  enterprise: {
    postsPerDay: -1, // Unlimited
    aiImagesPerMonth: -1, // Unlimited
    folders: -1, // Unlimited
    accountsPerPlatform: -1, // Unlimited
  },
} as const;