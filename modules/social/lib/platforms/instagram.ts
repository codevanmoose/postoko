import { BasePlatformAPI } from './base';
import { SocialAccount, PostContent, PostResult } from '../../types';

export class InstagramAPI extends BasePlatformAPI {
  platformName = 'instagram';

  async createPost(account: SocialAccount, content: PostContent): Promise<PostResult> {
    try {
      // Check rate limits
      const canPost = await this.checkRateLimit(account.id, 'media/publish');
      if (!canPost) {
        return {
          account_id: account.id,
          platform: this.platformName,
          success: false,
          error: 'Rate limit exceeded',
        };
      }

      // Validate media
      for (const mediaUrl of content.media_urls) {
        const validation = await this.validateMedia(mediaUrl);
        if (!validation.valid) {
          return {
            account_id: account.id,
            platform: this.platformName,
            success: false,
            error: validation.error,
          };
        }
      }

      // Format caption with hashtags
      const hashtags = content.hashtags ? this.formatHashtags(content.hashtags) : '';
      const caption = this.truncateText(
        `${content.caption}${hashtags ? '\n\n' + hashtags : ''}`,
        2200 // Instagram caption limit
      );

      // Instagram Graph API workflow:
      // 1. Create media container
      // 2. Publish the container
      
      const accessToken = account.access_token; // Should be decrypted
      const igUserId = account.metadata?.instagram_business_account_id;

      if (!igUserId) {
        throw new Error('Instagram business account ID not found');
      }

      // Step 1: Create media container
      const containerResponse = await this.createMediaContainer(
        igUserId,
        accessToken,
        content.media_urls[0], // Instagram supports single image for now
        caption
      );

      if (!containerResponse.id) {
        throw new Error('Failed to create media container');
      }

      // Step 2: Publish the container
      const publishResponse = await this.publishMediaContainer(
        igUserId,
        accessToken,
        containerResponse.id
      );

      // Update rate limit
      await this.updateRateLimit(account.id, 'media/publish');

      // Update last posted timestamp
      await this.supabase
        .from('social_accounts')
        .update({ last_posted_at: new Date().toISOString() })
        .eq('id', account.id);

      return {
        account_id: account.id,
        platform: this.platformName,
        success: true,
        post_id: publishResponse.id,
        url: `https://www.instagram.com/p/${publishResponse.id}/`,
      };
    } catch (error: any) {
      return {
        account_id: account.id,
        platform: this.platformName,
        success: false,
        error: error.message || 'Failed to create post',
      };
    }
  }

  async deletePost(account: SocialAccount, postId: string): Promise<boolean> {
    try {
      const accessToken = account.access_token;
      const response = await fetch(
        `https://graph.instagram.com/${postId}?access_token=${accessToken}`,
        { method: 'DELETE' }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async getPostInfo(account: SocialAccount, postId: string): Promise<any> {
    const accessToken = account.access_token;
    const response = await fetch(
      `https://graph.instagram.com/${postId}?fields=id,caption,media_url,permalink,timestamp&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get post info');
    }
    
    return response.json();
  }

  async validateMedia(mediaUrl: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Fetch media metadata
      const response = await fetch(mediaUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        return { valid: false, error: 'Unable to access media URL' };
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(contentType)) {
        return { valid: false, error: 'Invalid file type. Instagram accepts JPG and PNG.' };
      }

      // Check file size (8MB for images)
      if (!this.validateImageSize(contentLength, 8)) {
        return { valid: false, error: 'File size exceeds 8MB limit' };
      }

      // TODO: Check image dimensions (min 320px, max 1080px width)

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Failed to validate media' };
    }
  }

  async getOptimalPostingTimes(account: SocialAccount): Promise<Date[]> {
    // Instagram optimal posting times (general guidelines)
    // These would ideally be personalized based on audience insights
    const now = new Date();
    const times: Date[] = [];

    // Best times: 6-9 AM and 5-6 PM in user's timezone
    const morningHour = 7; // 7 AM
    const eveningHour = 17; // 5 PM

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Morning slot
      date.setHours(morningHour, 0, 0, 0);
      times.push(new Date(date));
      
      // Evening slot
      date.setHours(eveningHour, 30, 0, 0);
      times.push(new Date(date));
    }

    return times;
  }

  // Instagram-specific methods
  private async createMediaContainer(
    igUserId: string,
    accessToken: string,
    imageUrl: string,
    caption: string
  ): Promise<{ id: string }> {
    const params = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.instagram.com/${igUserId}/media?${params}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create media container');
    }

    return response.json();
  }

  private async publishMediaContainer(
    igUserId: string,
    accessToken: string,
    creationId: string
  ): Promise<{ id: string }> {
    const params = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.instagram.com/${igUserId}/media_publish?${params}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to publish media');
    }

    return response.json();
  }
}