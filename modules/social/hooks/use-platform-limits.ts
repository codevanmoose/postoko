'use client';

import { useCallback } from 'react';
import { useSocial } from '../context/social-context';
import { PlatformLimits, PostContent } from '../types';

export function usePlatformLimits() {
  const { platforms } = useSocial();

  // Get limits for a specific platform
  const getPlatformLimits = useCallback((platformName: string): PlatformLimits | undefined => {
    const platform = platforms.find(p => p.name === platformName);
    return platform?.limits;
  }, [platforms]);

  // Check if content is valid for a platform
  const validateContent = useCallback((platformName: string, content: PostContent) => {
    const limits = getPlatformLimits(platformName);
    if (!limits) return { valid: false, errors: ['Platform not found'] };

    const errors: string[] = [];

    // Check caption length
    const captionLimit = limits.caption_length || limits.post_length || limits.description_length;
    if (captionLimit && content.caption.length > captionLimit) {
      errors.push(`Caption exceeds ${captionLimit} character limit`);
    }

    // Check hashtag count
    if (limits.hashtag_count && content.hashtags && content.hashtags.length > limits.hashtag_count) {
      errors.push(`Too many hashtags (max ${limits.hashtag_count})`);
    }

    // Check media count
    if (limits.media_count && content.media_urls.length > limits.media_count) {
      errors.push(`Too many media files (max ${limits.media_count})`);
    }

    // Platform-specific checks
    if (platformName === 'tiktok' && content.media_urls.length === 0) {
      errors.push('TikTok requires a video');
    }

    if (platformName === 'pinterest' && !content.platform_settings?.board_id) {
      errors.push('Pinterest requires a board selection');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [getPlatformLimits]);

  // Format content for platform
  const formatForPlatform = useCallback((platformName: string, content: PostContent): PostContent => {
    const limits = getPlatformLimits(platformName);
    if (!limits) return content;

    const formatted = { ...content };

    // Truncate caption if needed
    const captionLimit = limits.caption_length || limits.post_length || limits.description_length;
    if (captionLimit && formatted.caption.length > captionLimit) {
      formatted.caption = formatted.caption.substring(0, captionLimit - 3) + '...';
    }

    // Limit hashtags
    if (limits.hashtag_count && formatted.hashtags && formatted.hashtags.length > limits.hashtag_count) {
      formatted.hashtags = formatted.hashtags.slice(0, limits.hashtag_count);
    }

    // Limit media
    if (limits.media_count && formatted.media_urls.length > limits.media_count) {
      formatted.media_urls = formatted.media_urls.slice(0, limits.media_count);
    }

    return formatted;
  }, [getPlatformLimits]);

  // Get character count info
  const getCharacterCount = useCallback((platformName: string, text: string) => {
    const limits = getPlatformLimits(platformName);
    const limit = limits?.caption_length || limits?.post_length || limits?.description_length || 0;
    
    return {
      current: text.length,
      limit,
      remaining: limit - text.length,
      percentage: limit > 0 ? (text.length / limit) * 100 : 0,
    };
  }, [getPlatformLimits]);

  return {
    getPlatformLimits,
    validateContent,
    formatForPlatform,
    getCharacterCount,
  };
}