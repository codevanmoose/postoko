import { PlatformAPI, SocialAccount, PostContent, PostResult } from '../../types';
import { createClient } from '@postoko/database';

export abstract class BasePlatformAPI implements PlatformAPI {
  protected supabase = createClient();
  
  abstract platformName: string;
  abstract createPost(account: SocialAccount, content: PostContent): Promise<PostResult>;
  abstract deletePost(account: SocialAccount, postId: string): Promise<boolean>;
  abstract getPostInfo(account: SocialAccount, postId: string): Promise<any>;
  abstract validateMedia(mediaUrl: string): Promise<{ valid: boolean; error?: string }>;
  abstract getOptimalPostingTimes(account: SocialAccount): Promise<Date[]>;

  // Common rate limiting check
  protected async checkRateLimit(accountId: string, endpoint: string): Promise<boolean> {
    const { data: rateLimit } = await this.supabase
      .from('rate_limits')
      .select('*')
      .eq('social_account_id', accountId)
      .eq('endpoint', endpoint)
      .single();

    if (!rateLimit) return true;

    const now = new Date();
    const resetTime = new Date(rateLimit.resets_at);

    // If rate limit window has passed, reset
    if (now > resetTime) {
      await this.supabase
        .from('rate_limits')
        .update({
          used_count: 0,
          resets_at: new Date(now.getTime() + rateLimit.limit_window * 1000).toISOString(),
        })
        .eq('id', rateLimit.id);
      return true;
    }

    // Check if we've hit the limit
    return rateLimit.used_count < rateLimit.limit_count;
  }

  // Update rate limit usage
  protected async updateRateLimit(accountId: string, endpoint: string): Promise<void> {
    const { data: rateLimit } = await this.supabase
      .from('rate_limits')
      .select('*')
      .eq('social_account_id', accountId)
      .eq('endpoint', endpoint)
      .single();

    if (rateLimit) {
      await this.supabase
        .from('rate_limits')
        .update({
          used_count: rateLimit.used_count + 1,
        })
        .eq('id', rateLimit.id);
    }
  }

  // Common media validation
  protected validateImageSize(sizeBytes: number, maxSizeMB: number): boolean {
    return sizeBytes <= maxSizeMB * 1024 * 1024;
  }

  protected validateImageType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => mimeType.includes(type));
  }

  // Format hashtags
  protected formatHashtags(hashtags: string[]): string {
    return hashtags
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      .join(' ');
  }

  // Truncate text to platform limits
  protected truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}