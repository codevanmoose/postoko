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
      const platform = PlatformFactory.getPlatform(account.platform);
      return await platform.post(account, content);
    } catch (error) {
      return {
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
    return PlatformFactory.postToMultiple(accounts, content);
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
      const errors = await platform.validateContent(content);
      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
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
    platformName: string,
    timezone: string = 'UTC'
  ): Promise<Date> {
    const platform = PlatformFactory.getPlatform(platformName);
    return platform.getOptimalPostingTime(timezone);
  }
}