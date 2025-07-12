import { PlatformFactory } from './platform-factory';
import type { SocialAccount, PostContent, PostResult } from '../types';

export class SocialPoster {
  /**
   * Post content to a single social account
   */
  async postToAccount(
    account: SocialAccount,
    content: PostContent
  ): Promise<PostResult> {
    try {
      // Get platform name from the platform object or throw error if not available
      if (!account.platform || !account.platform.name) {
        throw new Error('Account platform information is missing');
      }
      
      const platform = PlatformFactory.getPlatform(account.platform.name);
      return await platform.createPost(account, content);
    } catch (error) {
      return {
        account_id: account.id,
        platform: account.platform?.name || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Post content to multiple social accounts
   */
  async postToMultipleAccounts(
    accounts: SocialAccount[],
    content: PostContent
  ): Promise<Array<{ platform: string; result: PostResult }>> {
    const results = await PlatformFactory.postToMultiplePlatforms(accounts, content);
    
    // Transform the results to match the expected return type
    return results.map((r, index) => ({
      platform: accounts[index].platform?.name || 'unknown',
      result: r.result as PostResult
    }));
  }

  /**
   * Validate content for specific platform
   */
  async validateContent(
    platformName: string,
    content: PostContent
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const platform = PlatformFactory.getPlatform(platformName);
      // For now, just check media validation
      // TODO: Add proper content validation to PlatformAPI interface
      if (content.media_urls && content.media_urls.length > 0) {
        const results = await Promise.all(
          content.media_urls.map(url => platform.validateMedia(url))
        );
        const errors = results
          .filter(r => !r.valid)
          .map(r => r.error || 'Invalid media');
        
        return {
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined,
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
      };
    }
  }

  /**
   * Get optimal posting time for a platform
   */
  async getOptimalPostingTime(
    account: SocialAccount,
    timezone: string = 'UTC'
  ): Promise<Date> {
    if (!account.platform || !account.platform.name) {
      // Return a default time if platform info is missing
      return new Date();
    }
    
    const platform = PlatformFactory.getPlatform(account.platform.name);
    const times = await platform.getOptimalPostingTimes(account);
    
    // Return the first optimal time, or current time if none available
    return times.length > 0 ? times[0] : new Date();
  }
}