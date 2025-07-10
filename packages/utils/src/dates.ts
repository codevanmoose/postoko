import { format, formatDistance, formatRelative, isAfter, isBefore, parseISO } from 'date-fns';

/**
 * Format a date string to a human-readable format
 */
export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format date for display in different contexts
 */
export function formatDisplayDate(date: string | Date, context: 'short' | 'long' | 'relative' = 'short'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  switch (context) {
    case 'short':
      return format(dateObj, 'MMM d, yyyy');
    case 'long':
      return format(dateObj, 'MMMM d, yyyy \'at\' h:mm a');
    case 'relative':
      return formatRelative(dateObj, new Date());
    default:
      return format(dateObj, 'PPP');
  }
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Convert timezone-aware date to local time
 */
export function toLocalTime(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj;
}

/**
 * Get the next scheduled time based on daily posting times
 */
export function getNextScheduledTime(postingTimes: string[], timezone: string = 'UTC'): Date | null {
  if (!postingTimes || postingTimes.length === 0) {
    return null;
  }

  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  
  // Try today's posting times
  for (const time of postingTimes) {
    const scheduledTime = parseISO(`${today}T${time}:00`);
    if (isAfter(scheduledTime, now)) {
      return scheduledTime;
    }
  }
  
  // If all today's times have passed, use tomorrow's first time
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
  return parseISO(`${tomorrowStr}T${postingTimes[0]}:00`);
}