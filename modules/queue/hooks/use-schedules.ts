'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueue } from '../context/queue-context';
import { QueueSchedule, TimeSlot } from '../types';

interface UseSchedulesOptions {
  activeOnly?: boolean;
  sourceType?: 'drive_folders' | 'ai_prompt';
}

export function useSchedules(options: UseSchedulesOptions = {}) {
  const { 
    schedules, 
    activeSchedules,
    fetchSchedules, 
    loadingSchedules,
    error 
  } = useQueue();

  const [filteredSchedules, setFilteredSchedules] = useState<QueueSchedule[]>([]);

  // Apply filters
  useEffect(() => {
    let items = options.activeOnly ? activeSchedules : schedules;

    // Filter by source type
    if (options.sourceType) {
      items = items.filter(schedule => schedule.source_type === options.sourceType);
    }

    setFilteredSchedules(items);
  }, [schedules, activeSchedules, options.activeOnly, options.sourceType]);

  // Refresh schedules
  const refresh = useCallback(async () => {
    await fetchSchedules();
  }, [fetchSchedules]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, []);

  // Calculate total posts per day across all schedules
  const totalPostsPerDay = filteredSchedules.reduce((total, schedule) => {
    if (!schedule.is_active) return total;
    return total + (schedule.time_slots.length * (schedule.days_of_week?.length || 7));
  }, 0);

  // Get all time slots across schedules
  const allTimeSlots = filteredSchedules.reduce((slots, schedule) => {
    if (!schedule.is_active) return slots;
    return [...slots, ...schedule.time_slots];
  }, [] as TimeSlot[]);

  // Check if any schedule is active
  const hasActiveSchedules = filteredSchedules.some(s => s.is_active);

  return {
    schedules: filteredSchedules,
    totalSchedules: filteredSchedules.length,
    activeCount: filteredSchedules.filter(s => s.is_active).length,
    totalPostsPerDay,
    allTimeSlots,
    hasActiveSchedules,
    loading: loadingSchedules,
    error,
    refresh,
  };
}

// Hook for schedule preview
export function useSchedulePreview(scheduleId: string | null) {
  const { previewSchedule } = useQueue();
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!scheduleId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await previewSchedule(scheduleId);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, previewSchedule]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  return {
    preview,
    loading,
    error,
    refresh: loadPreview,
  };
}

// Hook for schedule conflicts
export function useScheduleConflicts(scheduleId?: string) {
  const { schedules } = useQueue();
  const [conflicts, setConflicts] = useState<Array<{
    schedule1: QueueSchedule;
    schedule2: QueueSchedule;
    overlappingSlots: TimeSlot[];
  }>>([]);

  useEffect(() => {
    const checkConflicts = () => {
      const conflictList: typeof conflicts = [];
      const activeSchedules = schedules.filter(s => s.is_active);

      for (let i = 0; i < activeSchedules.length; i++) {
        for (let j = i + 1; j < activeSchedules.length; j++) {
          const schedule1 = activeSchedules[i];
          const schedule2 = activeSchedules[j];

          // Skip if checking specific schedule and neither match
          if (scheduleId && schedule1.id !== scheduleId && schedule2.id !== scheduleId) {
            continue;
          }

          // Check if they share social accounts
          const sharedAccounts = schedule1.social_account_ids.filter(id =>
            schedule2.social_account_ids.includes(id)
          );

          if (sharedAccounts.length === 0) continue;

          // Check for overlapping time slots
          const overlappingSlots: TimeSlot[] = [];

          for (const slot1 of schedule1.time_slots) {
            for (const slot2 of schedule2.time_slots) {
              // Check if slots are within 30 minutes of each other
              if (
                slot1.timezone === slot2.timezone &&
                Math.abs(slot1.hour * 60 + slot1.minute - (slot2.hour * 60 + slot2.minute)) < 30
              ) {
                overlappingSlots.push(slot1);
              }
            }
          }

          if (overlappingSlots.length > 0) {
            conflictList.push({
              schedule1,
              schedule2,
              overlappingSlots,
            });
          }
        }
      }

      setConflicts(conflictList);
    };

    checkConflicts();
  }, [schedules, scheduleId]);

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
  };
}