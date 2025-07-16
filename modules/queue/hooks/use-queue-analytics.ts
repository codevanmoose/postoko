'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueue } from '../context/queue-context';
import { OptimalTime, PlatformMetrics } from '../types';

interface UseQueueAnalyticsOptions {
  days?: number;
  platform?: string;
  autoRefresh?: boolean;
}

export function useQueueAnalytics(options: UseQueueAnalyticsOptions = {}) {
  const { 
    analytics, 
    optimalTimes,
    fetchAnalytics,
    fetchOptimalTimes,
    loadingAnalytics,
    error 
  } = useQueue();

  const [platformOptimalTimes, setPlatformOptimalTimes] = useState<OptimalTime[]>([]);

  // Filter optimal times by platform
  useEffect(() => {
    if (options.platform) {
      setPlatformOptimalTimes(
        optimalTimes.filter(time => time.platform === options.platform)
      );
    } else {
      setPlatformOptimalTimes(optimalTimes);
    }
  }, [optimalTimes, options.platform]);

  // Refresh analytics
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchAnalytics(options.days || 30),
      fetchOptimalTimes(),
    ]);
  }, [fetchAnalytics, fetchOptimalTimes, options.days]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    refresh();

    if (options.autoRefresh) {
      const interval = setInterval(refresh, 300000); // Refresh every 5 minutes
      return () => clearInterval(interval);
    }
  }, [refresh, options.autoRefresh]);

  // Calculate best posting times by day of week
  const bestTimesByDay = platformOptimalTimes.reduce((acc, time) => {
    const key = time.day_of_week;
    if (!acc[key] || acc[key].engagement_score < time.engagement_score) {
      acc[key] = time;
    }
    return acc;
  }, {} as Record<number, OptimalTime>);

  // Get top performing platforms
  const topPlatforms = analytics?.platform_metrics
    ? Object.entries(analytics.platform_metrics)
        .map(([platform, metrics]) => ({
          platform,
          ...metrics as PlatformMetrics,
        }))
        .sort((a, b) => b.posted - a.posted)
        .slice(0, 5)
    : [];

  return {
    analytics,
    optimalTimes: platformOptimalTimes,
    bestTimesByDay,
    topPlatforms,
    loading: loadingAnalytics,
    error,
    refresh,
  };
}

// Hook for posting patterns
export function usePostingPatterns(days: number = 30) {
  const [patterns, setPatterns] = useState<{
    byHour: Record<number, number>;
    byDayOfWeek: Record<number, number>;
    byPlatform: Record<string, number>;
    mostActiveHour: number;
    mostActiveDay: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/queue/analytics/patterns?days=${days}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch patterns');

      const data = await response.json();
      setPatterns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patterns');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  return {
    patterns,
    loading,
    error,
    refresh: fetchPatterns,
  };
}

// Hook for content performance
export function useContentPerformance(days: number = 30) {
  const [performance, setPerformance] = useState<{
    byContentType: Record<string, { count: number; avgEngagement: number }>;
    topPerformingPosts: Array<{
      queueItemId: string;
      caption?: string;
      totalEngagement: number;
      postedAt: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/queue/analytics/content-performance?days=${days}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch performance');

      const data = await response.json();
      setPerformance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  // Calculate best content type
  const bestContentType = performance?.byContentType
    ? Object.entries(performance.byContentType)
        .sort(([, a], [, b]) => b.avgEngagement - a.avgEngagement)[0]?.[0]
    : null;

  return {
    performance,
    bestContentType,
    loading,
    error,
    refresh: fetchPerformance,
  };
}