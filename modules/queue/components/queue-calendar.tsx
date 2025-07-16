'use client';

import React, { useState } from 'react';
import { QueueItem } from '../types';
import { useQueueItems } from '../hooks/use-queue-items';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../apps/web/src/components/ui/button';
import { Spinner } from '../../../apps/web/src/components/ui/spinner';

interface QueueCalendarProps {
  onDateClick?: (date: Date, items: QueueItem[]) => void;
}

export function QueueCalendar({ onDateClick }: QueueCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const { items, loading } = useQueueItems({
    startDate: monthStart,
    endDate: monthEnd,
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // Group items by date
  const itemsByDate = items.reduce((acc, item) => {
    const dateKey = format(new Date(item.scheduled_for), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, QueueItem[]>);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0">
          {/* Empty cells for days before month start */}
          {Array.from({ length: startDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="h-24 border border-gray-100" />
          ))}

          {/* Month days */}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayItems = itemsByDate[dateKey] || [];
            const hasItems = dayItems.length > 0;
            const isCurrentDay = isToday(day);

            // Count items by status
            const statusCounts = dayItems.reduce((acc, item) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return (
              <div
                key={day.toISOString()}
                onClick={() => onDateClick && onDateClick(day, dayItems)}
                className={`
                  h-24 border border-gray-100 p-2 cursor-pointer
                  hover:bg-gray-50 transition-colors
                  ${isCurrentDay ? 'bg-blue-50' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {hasItems && (
                    <span className="text-xs text-gray-500">
                      {dayItems.length}
                    </span>
                  )}
                </div>

                {/* Status indicators */}
                {hasItems && (
                  <div className="space-y-1">
                    {statusCounts.scheduled && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-gray-600">
                          {statusCounts.scheduled}
                        </span>
                      </div>
                    )}
                    {statusCounts.posted && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600">
                          {statusCounts.posted}
                        </span>
                      </div>
                    )}
                    {statusCounts.failed && (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-gray-600">
                          {statusCounts.failed}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && items.length > 0 && (
        <div className="flex justify-center p-4 border-t border-gray-200">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}