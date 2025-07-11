import { BasePlatformAPI } from './base';
import { SocialAccount, PostContent, PostResult } from '../../types';

export class TikTokAPI extends BasePlatformAPI {
  platformName = 'tiktok';

  async createPost(account: SocialAccount, content: PostContent): Promise<PostResult> {
    try {
      // Check rate limits
      const canPost = await this.checkRateLimit(account.id, 'videos');
      if (!canPost) {
        return {
          account_id: account.id,
          platform: this.platformName,
          success: false,
          error: 'Rate limit exceeded',
        };
      }

      // TikTok only accepts videos
      if (content.media_urls.length === 0) {
        return {
          account_id: account.id,
          platform: this.platformName,
          success: false,
          error: 'TikTok requires a video file',
        };
      }

      // Validate video
      const validation = await this.validateMedia(content.media_urls[0]);
      if (!validation.valid) {
        return {
          account_id: account.id,
          platform: this.platformName,
          success: false,
          error: validation.error,
        };
      }

      // Format caption
      const hashtags = content.hashtags ? this.formatHashtags(content.hashtags) : '';
      const caption = this.truncateText(
        `${content.caption}${hashtags ? ' ' + hashtags : ''}`,
        2200 // TikTok caption limit
      );

      // TODO: Implement TikTok API video upload
      const mockVideoId = `mock_tiktok_${Date.now()}`;

      // Update rate limit
      await this.updateRateLimit(account.id, 'videos');

      return {
        account_id: account.id,
        platform: this.platformName,
        success: true,
        post_id: mockVideoId,
        url: `https://www.tiktok.com/@${account.username}/video/${mockVideoId}`,
      };
    } catch (error: any) {
      return {
        account_id: account.id,
        platform: this.platformName,
        success: false,
        error: error.message || 'Failed to create TikTok video',
      };
    }
  }

  async deletePost(account: SocialAccount, postId: string): Promise<boolean> {
    // TODO: Implement video deletion
    return true;
  }

  async getPostInfo(account: SocialAccount, postId: string): Promise<any> {
    // TODO: Implement video info retrieval
    return {
      id: postId,
      caption: 'Mock TikTok video',
      created_at: new Date().toISOString(),
    };
  }

  async validateMedia(mediaUrl: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(mediaUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        return { valid: false, error: 'Unable to access media URL' };
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      // Check file type (TikTok only accepts videos)
      const allowedTypes = ['video/mp4'];
      if (!allowedTypes.includes(contentType)) {
        return { valid: false, error: 'TikTok only accepts MP4 videos' };
      }

      // Check file size (287MB for videos)
      if (!this.validateImageSize(contentLength, 287)) {
        return { valid: false, error: 'Video size exceeds 287MB limit' };
      }

      // TODO: Check video duration (max 3 minutes)

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Failed to validate media' };
    }
  }

  async getOptimalPostingTimes(account: SocialAccount): Promise<Date[]> {
    // TikTok optimal posting times
    const now = new Date();
    const times: Date[] = [];

    // Best times: 6-10 AM and 7-11 PM
    const slots = [6, 7, 8, 9, 19, 20, 21, 22]; 

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      for (const hour of slots) {
        date.setHours(hour, 0, 0, 0);
        times.push(new Date(date));
      }
    }

    return times;
  }
}