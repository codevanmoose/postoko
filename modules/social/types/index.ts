export interface SocialPlatform {
  id: string;
  name: string;
  display_name: string;
  icon_url: string;
  auth_url_template: string;
  token_url: string;
  api_base_url: string;
  features: PlatformFeatures;
  limits: PlatformLimits;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformFeatures {
  feed_posts?: boolean;
  stories?: boolean;
  reels?: boolean;
  carousels?: boolean;
  tweets?: boolean;
  threads?: boolean;
  media_upload?: boolean;
  pins?: boolean;
  boards?: boolean;
  posts?: boolean;
  articles?: boolean;
  videos?: boolean;
}

export interface PlatformLimits {
  caption_length?: number;
  description_length?: number;
  post_length?: number;
  article_length?: number;
  tweet_length?: number;
  hashtag_count?: number;
  media_count?: number;
  image_size_mb?: number;
  video_size_mb?: number;
  video_duration_seconds?: number;
  image_types?: string[];
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform_id: string;
  account_id: string;
  username: string;
  display_name?: string;
  profile_image_url?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  permissions?: string[];
  account_type?: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  last_posted_at?: string;
  created_at: string;
  updated_at: string;
  platform?: SocialPlatform;
}

export interface RateLimit {
  id: string;
  social_account_id: string;
  endpoint: string;
  limit_count: number;
  limit_window: number;
  used_count: number;
  resets_at: string;
  created_at: string;
  updated_at: string;
}

export interface PostTemplate {
  id: string;
  user_id: string;
  platform_id: string;
  name: string;
  caption_template?: string;
  hashtag_sets?: string[][];
  settings?: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  platform?: SocialPlatform;
}

export interface ConnectAccountRequest {
  platform: string;
  redirect_uri?: string;
}

export interface OAuthCallback {
  code: string;
  state: string;
  error?: string;
}

export interface PostContent {
  caption: string;
  media_urls: string[];
  hashtags?: string[];
  platform_settings?: Record<string, any>;
}

export interface PostRequest {
  account_ids: string[];
  content: PostContent;
  schedule_at?: string;
  template_id?: string;
}

export interface PostResult {
  account_id: string;
  platform: string;
  success: boolean;
  post_id?: string;
  error?: string;
  url?: string;
}

export interface PlatformAuth {
  generateAuthUrl(redirectUri: string, state: string): string;
  handleCallback(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  }>;
  refreshToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in?: number;
  }>;
  getUserInfo(accessToken: string): Promise<{
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
    account_type?: string;
  }>;
}

export interface PlatformAPI {
  createPost(account: SocialAccount, content: PostContent): Promise<PostResult>;
  deletePost(account: SocialAccount, postId: string): Promise<boolean>;
  getPostInfo(account: SocialAccount, postId: string): Promise<any>;
  validateMedia(mediaUrl: string): Promise<{ valid: boolean; error?: string }>;
  getOptimalPostingTimes(account: SocialAccount): Promise<Date[]>;
}