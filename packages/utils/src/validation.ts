/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Password validation
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate image file
 */
export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  const maxSize = 20 * 1024 * 1024; // 20MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Supported: JPG, PNG, WebP, HEIC' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 20MB' };
  }
  
  return { valid: true };
}

/**
 * Validate hashtag
 */
export function isValidHashtag(tag: string): boolean {
  // Remove # if present
  const cleaned = tag.startsWith('#') ? tag.slice(1) : tag;
  
  // Check if it contains only valid characters
  const hashtagRegex = /^[a-zA-Z0-9_]+$/;
  return hashtagRegex.test(cleaned) && cleaned.length > 0 && cleaned.length <= 100;
}

/**
 * Validate timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate cron expression
 */
export function isValidCron(expression: string): boolean {
  // Simple validation for basic cron expressions
  const parts = expression.split(' ');
  return parts.length === 5 || parts.length === 6;
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validate platform username/handle
 */
export function isValidPlatformHandle(handle: string, platform: string): boolean {
  const patterns: Record<string, RegExp> = {
    instagram: /^[a-zA-Z0-9._]{1,30}$/,
    twitter: /^[a-zA-Z0-9_]{1,15}$/,
    pinterest: /^[a-zA-Z0-9_]{3,30}$/,
  };
  
  const pattern = patterns[platform];
  return pattern ? pattern.test(handle) : true;
}