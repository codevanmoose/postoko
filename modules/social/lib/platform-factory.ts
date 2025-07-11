import { PlatformAPI, SocialAccount, PostContent } from '../types';
import { InstagramAPI } from './platforms/instagram';
import { TwitterAPI } from './platforms/twitter';
import { PinterestAPI } from './platforms/pinterest';
import { LinkedInAPI } from './platforms/linkedin';
import { TikTokAPI } from './platforms/tiktok';

export class PlatformFactory {
  private static instances: Map<string, PlatformAPI> = new Map();

  static getPlatform(platformName: string): PlatformAPI {
    // Check if instance already exists
    if (this.instances.has(platformName)) {
      return this.instances.get(platformName)!;
    }

    // Create new instance based on platform
    let platform: PlatformAPI;
    
    switch (platformName) {
      case 'instagram':
        platform = new InstagramAPI();
        break;
      case 'twitter':
        platform = new TwitterAPI();
        break;
      case 'pinterest':
        platform = new PinterestAPI();
        break;
      case 'linkedin':
        platform = new LinkedInAPI();
        break;
      case 'tiktok':
        platform = new TikTokAPI();
        break;
      default:
        throw new Error(`Unsupported platform: ${platformName}`);
    }

    // Cache instance
    this.instances.set(platformName, platform);
    return platform;
  }

  // Post to multiple platforms
  static async postToMultiplePlatforms(
    accounts: SocialAccount[],
    content: PostContent
  ): Promise<{ accountId: string; result: any }[]> {
    const results = await Promise.allSettled(
      accounts.map(async (account) => {
        const platform = this.getPlatform(account.platform?.name || '');
        const result = await platform.createPost(account, content);
        return { accountId: account.id, result };
      })
    );

    return results.map((result, index) => ({
      accountId: accounts[index].id,
      result: result.status === 'fulfilled' ? result.value.result : {
        success: false,
        error: result.reason?.message || 'Unknown error',
      },
    }));
  }
}