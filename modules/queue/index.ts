// Queue Module - Main exports

// Types
export * from './types';

// Core libraries
export { QueueManager } from './lib/queue-manager';
export { Scheduler } from './lib/scheduler';
export { ContentSelector } from './lib/content-selector';
export { QueueProcessor } from './lib/queue-processor';
export { AnalyticsEngine } from './lib/analytics-engine';

// Context and hooks
export { QueueProvider, useQueue } from './context/queue-context';
export { useQueueItems, useUpcomingPosts, useFailedPosts, useTodaysPosts } from './hooks/use-queue-items';
export { useSchedules, useSchedulePreview, useScheduleConflicts } from './hooks/use-schedules';
export { useQueueAnalytics, usePostingPatterns, useContentPerformance } from './hooks/use-queue-analytics';

// Components
export { QueueList } from './components/queue-list';
export { QueueItemCard } from './components/queue-item-card';
export { ScheduleBuilder } from './components/schedule-builder';
export { QueueCalendar } from './components/queue-calendar';