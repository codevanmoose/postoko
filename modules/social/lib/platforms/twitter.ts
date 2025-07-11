import { BasePlatformAPI } from './base';
import { SocialAccount, PostContent, PostResult } from '../../types';

export class TwitterAPI extends BasePlatformAPI {
  platformName = 'twitter';

  async createPost(account: SocialAccount, content: PostContent): Promise<PostResult> {
    try {
      // Check rate limits
      const canPost = await this.checkRateLimit(account.id, 'tweets');
      if (!canPost) {
        return {
          account_id: account.id,
          platform: this.platformName,
          success: false,
          error: 'Rate limit exceeded',
        };
      }

      // Format tweet text
      const hashtags = content.hashtags ? this.formatHashtags(content.hashtags) : '';
      const tweetText = this.truncateText(
        `${content.caption}${hashtags ? ' ' + hashtags : ''}`,
        280 // Twitter character limit
      );

      // TODO: Implement Twitter API v2 posting
      // 1. Upload media if present
      // 2. Create tweet with media IDs

      const mockTweetId = `mock_${Date.now()}`;

      // Update rate limit
      await this.updateRateLimit(account.id, 'tweets');

      return {
        account_id: account.id,
        platform: this.platformName,
        success: true,
        post_id: mockTweetId,
        url: `https://twitter.com/${account.username}/status/${mockTweetId}`,
      };
    } catch (error: any) {
      return {
        account_id: account.id,
        platform: this.platformName,
        success: false,
        error: error.message || 'Failed to create tweet',
      };
    }
  }

  async deletePost(account: SocialAccount, postId: string): Promise<boolean> {
    // TODO: Implement tweet deletion
    return true;
  }

  async getPostInfo(account: SocialAccount, postId: string): Promise<any> {
    // TODO: Implement tweet info retrieval
    return {
      id: postId,
      text: 'Mock tweet',
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

      // Check file type
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const allowedVideoTypes = ['video/mp4'];
      
      if (!allowedImageTypes.includes(contentType) && !allowedVideoTypes.includes(contentType)) {
        return { valid: false, error: 'Invalid file type for Twitter' };
      }

      // Check file size
      const isVideo = allowedVideoTypes.includes(contentType);
      const maxSize = isVideo ? 512 : 5; // 512MB for video, 5MB for images
      
      if (!this.validateImageSize(contentLength, maxSize)) {
        return { valid: false, error: `File size exceeds ${maxSize}MB limit` };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Failed to validate media' };
    }
  }

  async getOptimalPostingTimes(account: SocialAccount): Promise<Date[]> {
    // Twitter optimal posting times
    const now = new Date();
    const times: Date[] = [];

    // Best times: 8-10 AM and 7-9 PM
    const slots = [8, 9, 19, 20]; // 8 AM, 9 AM, 7 PM, 8 PM

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