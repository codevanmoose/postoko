import { useState, useCallback, useEffect } from 'react';
import { useQueue } from '../context/queue-context';
import { QueueItem, QueueItemStatus } from '../types';
import { startOfDay, endOfDay, addDays } from 'date-fns';

interface UseQueueItemsOptions {
  status?: QueueItemStatus[];
  startDate?: Date;
  endDate?: Date;
  accountIds?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useQueueItems(options: UseQueueItemsOptions = {}) {
  const { 
    queueItems, 
    fetchQueueItems, 
    loadingQueue,
    error 
  } = useQueue();
  
  const [filteredItems, setFilteredItems] = useState<QueueItem[]>([]);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timer | null>(null);

  // Apply filters
  useEffect(() => {
    let items = [...queueItems];

    // Filter by status
    if (options.status && options.status.length > 0) {
      items = items.filter(item => options.status!.includes(item.status));
    }

    // Filter by date range
    if (options.startDate) {
      items = items.filter(item => 
        new Date(item.scheduled_for) >= startOfDay(options.startDate!)
      );
    }

    if (options.endDate) {
      items = items.filter(item => 
        new Date(item.scheduled_for) <= endOfDay(options.endDate!)
      );
    }

    // Filter by account IDs
    if (options.accountIds && options.accountIds.length > 0) {
      items = items.filter(item => 
        item.social_account_ids.some(id => options.accountIds!.includes(id))
      );
    }

    setFilteredItems(items);
  }, [queueItems, options.status, options.startDate, options.endDate, options.accountIds]);

  // Fetch with filters
  const refresh = useCallback(async () => {
    await fetchQueueItems({
      status: options.status,
      startDate: options.startDate,
      endDate: options.endDate,
      accountIds: options.accountIds,
    });
  }, [fetchQueueItems, options]);

  // Auto-refresh
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const timer = setInterval(() => {
        refresh();
      }, options.refreshInterval);

      setRefreshTimer(timer);

      return () => {
        clearInterval(timer);
      };
    }
  }, [options.autoRefresh, options.refreshInterval, refresh]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, []);

  // Grouped items by date
  const itemsByDate = filteredItems.reduce((groups, item) => {
    const date = format(new Date(item.scheduled_for), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, QueueItem[]>);

  // Stats
  const stats = {
    total: filteredItems.length,
    pending: filteredItems.filter(i => i.status === 'pending').length,
    scheduled: filteredItems.filter(i => i.status === 'scheduled').length,
    processing: filteredItems.filter(i => i.status === 'processing').length,
    posted: filteredItems.filter(i => i.status === 'posted').length,
    failed: filteredItems.filter(i => i.status === 'failed').length,
    cancelled: filteredItems.filter(i => i.status === 'cancelled').length,
  };

  // Next item to be posted
  const nextItem = filteredItems
    .filter(i => i.status === 'scheduled' && new Date(i.scheduled_for) > new Date())
    .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())[0];

  return {
    items: filteredItems,
    itemsByDate,
    stats,
    nextItem,
    loading: loadingQueue,
    error,
    refresh,
  };
}

// Hook for upcoming posts
export function useUpcomingPosts(days: number = 7) {
  const startDate = new Date();
  const endDate = addDays(startDate, days);

  return useQueueItems({
    status: ['scheduled', 'processing'],
    startDate,
    endDate,
    autoRefresh: true,
    refreshInterval: 60000, // Refresh every minute
  });
}

// Hook for failed posts
export function useFailedPosts() {
  return useQueueItems({
    status: ['failed'],
    autoRefresh: true,
    refreshInterval: 300000, // Refresh every 5 minutes
  });
}

// Hook for today's posts
export function useTodaysPosts() {
  const today = new Date();

  return useQueueItems({
    status: ['scheduled', 'processing', 'posted'],
    startDate: startOfDay(today),
    endDate: endOfDay(today),
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });
}

function format(date: Date, pattern: string): string {
  // Simple date formatting
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (pattern === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }
  
  return date.toISOString();
}