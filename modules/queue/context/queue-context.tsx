'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  QueueItem, 
  QueueSchedule, 
  QueueStatus,
  CreateQueueItemRequest,
  UpdateQueueItemRequest,
  CreateScheduleRequest,
  QueueAnalytics,
  OptimalTime
} from '../types';
import { useAuth } from '@postoko/auth';

interface QueueContextType {
  // Queue items
  queueItems: QueueItem[];
  queueStatus: QueueStatus | null;
  loadingQueue: boolean;
  
  // Schedules
  schedules: QueueSchedule[];
  activeSchedules: QueueSchedule[];
  loadingSchedules: boolean;
  
  // Analytics
  analytics: QueueAnalytics | null;
  optimalTimes: OptimalTime[];
  loadingAnalytics: boolean;
  
  // Actions - Queue
  fetchQueueItems: (filters?: any) => Promise<void>;
  addToQueue: (request: CreateQueueItemRequest) => Promise<QueueItem>;
  updateQueueItem: (itemId: string, updates: UpdateQueueItemRequest) => Promise<void>;
  removeFromQueue: (itemId: string) => Promise<void>;
  retryFailedItem: (itemId: string) => Promise<void>;
  bulkUpdateStatus: (itemIds: string[], status: 'cancelled' | 'scheduled') => Promise<void>;
  
  // Actions - Schedules
  fetchSchedules: () => Promise<void>;
  createSchedule: (request: CreateScheduleRequest) => Promise<QueueSchedule>;
  updateSchedule: (scheduleId: string, updates: Partial<CreateScheduleRequest>) => Promise<void>;
  toggleSchedule: (scheduleId: string, isActive: boolean) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  previewSchedule: (scheduleId: string) => Promise<any>;
  
  // Actions - Analytics
  fetchAnalytics: (days?: number) => Promise<void>;
  fetchOptimalTimes: () => Promise<void>;
  
  // Utilities
  refreshQueue: () => Promise<void>;
  clearErrors: () => void;
  error: string | null;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Queue state
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  
  // Schedule state
  const [schedules, setSchedules] = useState<QueueSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  
  // Analytics state
  const [analytics, setAnalytics] = useState<QueueAnalytics | null>(null);
  const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Fetch queue items
  const fetchQueueItems = useCallback(async (filters?: any) => {
    if (!user) return;
    
    setLoadingQueue(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status.join(','));
      if (filters?.startDate) params.append('start_date', filters.startDate.toISOString());
      if (filters?.endDate) params.append('end_date', filters.endDate.toISOString());
      if (filters?.accountIds) params.append('account_ids', filters.accountIds.join(','));
      
      const response = await fetch(`/api/queue/items?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch queue items');
      
      const data = await response.json();
      setQueueItems(data.items);
      
      // Also fetch status
      const statusResponse = await fetch('/api/queue/status', {
        credentials: 'include',
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setQueueStatus(statusData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queue items');
    } finally {
      setLoadingQueue(false);
    }
  }, [user]);

  // Add to queue
  const addToQueue = useCallback(async (request: CreateQueueItemRequest): Promise<QueueItem> => {
    if (!user) throw new Error('Not authenticated');
    
    setError(null);
    
    try {
      const response = await fetch('/api/queue/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add item to queue');
      }
      
      const newItem = await response.json();
      setQueueItems(prev => [...prev, newItem].sort((a, b) => 
        new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      ));
      
      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item to queue';
      setError(message);
      throw err;
    }
  }, [user]);

  // Update queue item
  const updateQueueItem = useCallback(async (itemId: string, updates: UpdateQueueItemRequest) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch(`/api/queue/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update queue item');
      
      const updatedItem = await response.json();
      setQueueItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ).sort((a, b) => 
        new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update queue item');
      throw err;
    }
  }, [user]);

  // Remove from queue
  const removeFromQueue = useCallback(async (itemId: string) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch(`/api/queue/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to remove item from queue');
      
      setQueueItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item from queue');
      throw err;
    }
  }, [user]);

  // Retry failed item
  const retryFailedItem = useCallback(async (itemId: string) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch(`/api/queue/items/${itemId}/retry`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to retry item');
      
      const updatedItem = await response.json();
      setQueueItems(prev => prev.map(item => 
        item.id === itemId ? updatedItem : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry item');
      throw err;
    }
  }, [user]);

  // Bulk update status
  const bulkUpdateStatus = useCallback(async (itemIds: string[], status: 'cancelled' | 'scheduled') => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch('/api/queue/items/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ item_ids: itemIds, status }),
      });
      
      if (!response.ok) throw new Error('Failed to update items');
      
      // Refresh queue items
      await fetchQueueItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update items');
      throw err;
    }
  }, [user, fetchQueueItems]);

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    if (!user) return;
    
    setLoadingSchedules(true);
    setError(null);
    
    try {
      const response = await fetch('/api/queue/schedules', {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch schedules');
      
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
    } finally {
      setLoadingSchedules(false);
    }
  }, [user]);

  // Create schedule
  const createSchedule = useCallback(async (request: CreateScheduleRequest): Promise<QueueSchedule> => {
    if (!user) throw new Error('Not authenticated');
    
    setError(null);
    
    try {
      const response = await fetch('/api/queue/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(request),
      });
      
      if (!response.ok) throw new Error('Failed to create schedule');
      
      const newSchedule = await response.json();
      setSchedules(prev => [...prev, newSchedule]);
      
      return newSchedule;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create schedule';
      setError(message);
      throw err;
    }
  }, [user]);

  // Update schedule
  const updateSchedule = useCallback(async (scheduleId: string, updates: Partial<CreateScheduleRequest>) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch(`/api/queue/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update schedule');
      
      const updatedSchedule = await response.json();
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? updatedSchedule : schedule
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
      throw err;
    }
  }, [user]);

  // Toggle schedule
  const toggleSchedule = useCallback(async (scheduleId: string, isActive: boolean) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch(`/api/queue/schedules/${scheduleId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: isActive }),
      });
      
      if (!response.ok) throw new Error('Failed to toggle schedule');
      
      setSchedules(prev => prev.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, is_active: isActive } : schedule
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle schedule');
      throw err;
    }
  }, [user]);

  // Delete schedule
  const deleteSchedule = useCallback(async (scheduleId: string) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch(`/api/queue/schedules/${scheduleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete schedule');
      
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
      throw err;
    }
  }, [user]);

  // Preview schedule
  const previewSchedule = useCallback(async (scheduleId: string) => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch(`/api/queue/schedules/${scheduleId}/preview`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to preview schedule');
      
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview schedule');
      throw err;
    }
  }, [user]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async (days: number = 30) => {
    if (!user) return;
    
    setLoadingAnalytics(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/queue/analytics?days=${days}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  }, [user]);

  // Fetch optimal times
  const fetchOptimalTimes = useCallback(async () => {
    if (!user) return;
    
    setError(null);
    
    try {
      const response = await fetch('/api/queue/analytics/optimal-times', {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch optimal times');
      
      const data = await response.json();
      setOptimalTimes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch optimal times');
    }
  }, [user]);

  // Refresh queue
  const refreshQueue = useCallback(async () => {
    await Promise.all([
      fetchQueueItems(),
      fetchSchedules(),
    ]);
  }, [fetchQueueItems, fetchSchedules]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (user) {
      refreshQueue();
    }
  }, [user, refreshQueue]);

  // Computed values
  const activeSchedules = schedules.filter(s => s.is_active);

  const value: QueueContextType = {
    // State
    queueItems,
    queueStatus,
    loadingQueue,
    schedules,
    activeSchedules,
    loadingSchedules,
    analytics,
    optimalTimes,
    loadingAnalytics,
    error,
    
    // Actions
    fetchQueueItems,
    addToQueue,
    updateQueueItem,
    removeFromQueue,
    retryFailedItem,
    bulkUpdateStatus,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    toggleSchedule,
    deleteSchedule,
    previewSchedule,
    fetchAnalytics,
    fetchOptimalTimes,
    refreshQueue,
    clearErrors,
  };

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}