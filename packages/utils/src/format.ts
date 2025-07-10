/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // Assuming amounts are in cents
}

/**
 * Format large numbers with abbreviations (1.2K, 3.4M, etc.)
 */
export function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format platform names for display
 */
export function formatPlatformName(platform: string): string {
  const platformNames: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'X (Twitter)',
    pinterest: 'Pinterest',
    threads: 'Threads',
    tiktok: 'TikTok',
    google: 'Google Drive',
  };
  
  return platformNames[platform] || platform;
}

/**
 * Format subscription tier names
 */
export function formatTierName(tier: string): string {
  const tierNames: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    growth: 'Growth',
    studio: 'Studio',
    enterprise: 'Enterprise',
  };
  
  return tierNames[tier] || tier;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format hashtags (ensure they start with #)
 */
export function formatHashtag(tag: string): string {
  const cleaned = tag.trim().replace(/[^a-zA-Z0-9_]/g, '');
  return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
}

/**
 * Format array of hashtags
 */
export function formatHashtags(tags: string[]): string[] {
  return tags.map(formatHashtag).filter(tag => tag.length > 1);
}

/**
 * Get platform-specific character limits
 */
export function getCharacterLimit(platform: string): number {
  const limits: Record<string, number> = {
    instagram: 2200,
    twitter: 280,
    pinterest: 500,
    threads: 500,
    tiktok: 2200,
  };
  
  return limits[platform] || 2000;
}