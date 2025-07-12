'use client';

import { QueueProvider, QueueList, ScheduleBuilder, QueueCalendar } from '@postoko/queue';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Plus, Calendar, List, Settings } from 'lucide-react';

export default function QueuePage() {
  const [view, setView] = useState<'list' | 'calendar' | 'schedules'>('list');
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false);

  return (
    <QueueProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Content Queue</h1>
                <p className="text-gray-600 mt-1">
                  Manage your scheduled content and automated posting
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowScheduleBuilder(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Schedule
                </Button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setView('list')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  ${view === 'list' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <List className="h-4 w-4" />
                List View
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  ${view === 'calendar' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </button>
              <button
                onClick={() => setView('schedules')}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  ${view === 'schedules' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Settings className="h-4 w-4" />
                Schedules
              </button>
            </div>
          </div>

          {/* Content */}
          {view === 'list' && <QueueList />}
          
          {view === 'calendar' && (
            <QueueCalendar 
              onDateClick={(date, items) => {
                console.log('Date clicked:', date, items);
              }}
            />
          )}
          
          {view === 'schedules' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium">Active Schedules</h2>
              {/* Schedule list will be implemented here */}
              <div className="text-center py-12 text-gray-500">
                Schedule management coming soon...
              </div>
            </div>
          )}

          {/* Schedule Builder Modal */}
          {showScheduleBuilder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-6">Create New Schedule</h2>
                <ScheduleBuilder
                  onSave={() => {
                    setShowScheduleBuilder(false);
                  }}
                  onCancel={() => setShowScheduleBuilder(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </QueueProvider>
  );
}