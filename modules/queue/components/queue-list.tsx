'use client';

import React, { useState } from 'react';
import { useQueueItems } from '../hooks/use-queue-items';
import { QueueItemCard } from './queue-item-card';
import { Button } from '@postoko/ui/components/button';
import { LoadingSpinner } from '@postoko/ui/components/loading-spinner';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { QueueItemStatus } from '../types';
import { format } from 'date-fns';

interface QueueListProps {
  status?: QueueItemStatus[];
  showFilters?: boolean;
  showStats?: boolean;
}

export function QueueList({ 
  status = ['scheduled', 'processing', 'failed'],
  showFilters = true,
  showStats = true 
}: QueueListProps) {
  const [selectedStatus, setSelectedStatus] = useState<QueueItemStatus[]>(status);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { 
    items, 
    itemsByDate, 
    stats, 
    nextItem,
    loading, 
    error, 
    refresh 
  } = useQueueItems({
    status: selectedStatus,
    startDate: selectedDate || undefined,
  });

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const statusOptions: Array<{ value: QueueItemStatus; label: string; color: string }> = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
    { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
    { value: 'processing', label: 'Processing', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'posted', label: 'Posted', color: 'bg-green-100 text-green-700' },
    { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex gap-2">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (selectedStatus.includes(option.value)) {
                      setSelectedStatus(selectedStatus.filter(s => s !== option.value));
                    } else {
                      setSelectedStatus([...selectedStatus, option.value]);
                    }
                  }}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium transition-all
                    ${selectedStatus.includes(option.value) 
                      ? option.color 
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Total Items</div>
            <div className="text-2xl font-semibold">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Scheduled</div>
            <div className="text-2xl font-semibold text-blue-600">{stats.scheduled}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Failed</div>
            <div className="text-2xl font-semibold text-red-600">{stats.failed}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-500">Next Post</div>
            <div className="text-sm font-medium">
              {nextItem ? format(new Date(nextItem.scheduled_for), 'MMM d, h:mm a') : 'None'}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No queue items</h3>
          <p className="text-sm text-gray-500">
            {selectedStatus.length === 0 
              ? 'Select a status filter to view items'
              : 'No items found matching your filters'}
          </p>
        </div>
      )}

      {/* Queue items grouped by date */}
      {Object.entries(itemsByDate).map(([date, dateItems]) => (
        <div key={date} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="space-y-3">
            {dateItems.map(item => (
              <QueueItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}

      {/* Loading more indicator */}
      {loading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}