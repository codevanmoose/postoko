'use client';

import React, { useState } from 'react';
import { CreateScheduleRequest, TimeSlot, ScheduleType } from '../types';
import { Button } from '../../../apps/web/src/components/ui/button';
import { Input } from '../../../apps/web/src/components/ui/input';
import { Label } from '../../../apps/web/src/components/ui/label';
import { useQueue } from '../context/queue-context';
import { useSocial } from '@postoko/social';
import { useDrive } from '@postoko/drive';
import { Clock, Plus, X, Folder, Sparkles } from 'lucide-react';

interface ScheduleBuilderProps {
  onSave?: (schedule: CreateScheduleRequest) => void;
  onCancel?: () => void;
}

export function ScheduleBuilder({ onSave, onCancel }: ScheduleBuilderProps) {
  const { createSchedule } = useQueue();
  const { accounts: socialAccounts } = useSocial();
  const { folders } = useDrive();
  
  const [name, setName] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { hour: 9, minute: 0, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  ]);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [sourceType, setSourceType] = useState<'drive_folders' | 'ai_prompt'>('drive_folders');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [maxPostsPerDay, setMaxPostsPerDay] = useState(3);
  const [minHoursBetween, setMinHoursBetween] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, {
      hour: 12,
      minute: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleTimeSlotChange = (index: number, field: keyof TimeSlot, value: any) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a schedule name');
      return;
    }

    if (timeSlots.length === 0) {
      setError('Please add at least one time slot');
      return;
    }

    if (selectedAccounts.length === 0) {
      setError('Please select at least one social account');
      return;
    }

    if (sourceType === 'drive_folders' && selectedFolders.length === 0) {
      setError('Please select at least one folder');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const request: CreateScheduleRequest = {
        name,
        schedule_type: scheduleType,
        time_slots: timeSlots,
        days_of_week: scheduleType === 'weekly' ? daysOfWeek : undefined,
        source_type: sourceType,
        source_config: {
          folder_ids: sourceType === 'drive_folders' ? selectedFolders : undefined,
          selection_strategy: 'random',
        },
        social_account_ids: selectedAccounts,
        max_posts_per_day: maxPostsPerDay,
        min_hours_between_posts: minHoursBetween,
      };

      const schedule = await createSchedule(request);
      
      if (onSave) {
        onSave(request);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Name */}
      <div>
        <Label htmlFor="name">Schedule Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Daily Morning Posts"
        />
      </div>

      {/* Schedule Type */}
      <div>
        <Label>Schedule Type</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {(['daily', 'weekly', 'custom'] as ScheduleType[]).map(type => (
            <button
              key={type}
              onClick={() => setScheduleType(type)}
              className={`
                px-4 py-2 rounded-lg border text-sm font-medium capitalize
                ${scheduleType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Days of Week (for weekly schedule) */}
      {scheduleType === 'weekly' && (
        <div>
          <Label>Days of Week</Label>
          <div className="flex gap-2 mt-2">
            {weekDays.map(day => (
              <button
                key={day.value}
                onClick={() => {
                  if (daysOfWeek.includes(day.value)) {
                    setDaysOfWeek(daysOfWeek.filter(d => d !== day.value));
                  } else {
                    setDaysOfWeek([...daysOfWeek, day.value].sort());
                  }
                }}
                className={`
                  w-12 h-12 rounded-lg border text-sm font-medium
                  ${daysOfWeek.includes(day.value)
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time Slots */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Posting Times</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddTimeSlot}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Time
          </Button>
        </div>
        
        <div className="space-y-2">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <Input
                type="number"
                min="0"
                max="23"
                value={slot.hour}
                onChange={(e) => handleTimeSlotChange(index, 'hour', parseInt(e.target.value))}
                className="w-20"
              />
              <span>:</span>
              <Input
                type="number"
                min="0"
                max="59"
                step="15"
                value={slot.minute}
                onChange={(e) => handleTimeSlotChange(index, 'minute', parseInt(e.target.value))}
                className="w-20"
              />
              <select
                value={slot.timezone}
                onChange={(e) => handleTimeSlotChange(index, 'timezone', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
              {timeSlots.length > 1 && (
                <button
                  onClick={() => handleRemoveTimeSlot(index)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Source */}
      <div>
        <Label>Content Source</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => setSourceType('drive_folders')}
            className={`
              px-4 py-3 rounded-lg border text-sm font-medium flex items-center gap-2
              ${sourceType === 'drive_folders'
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <Folder className="h-4 w-4" />
            Google Drive
          </button>
          <button
            onClick={() => setSourceType('ai_prompt')}
            disabled
            className={`
              px-4 py-3 rounded-lg border text-sm font-medium flex items-center gap-2
              ${sourceType === 'ai_prompt'
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-200 hover:border-gray-300 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <Sparkles className="h-4 w-4" />
            AI Generated
          </button>
        </div>
      </div>

      {/* Folder Selection */}
      {sourceType === 'drive_folders' && (
        <div>
          <Label>Select Folders</Label>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {folders.filter(f => f.is_active).map(folder => (
              <label key={folder.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFolders.includes(folder.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFolders([...selectedFolders, folder.id]);
                    } else {
                      setSelectedFolders(selectedFolders.filter(id => id !== folder.id));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{folder.folder_name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Social Accounts */}
      <div>
        <Label>Post to Platforms</Label>
        <div className="mt-2 space-y-2">
          {socialAccounts.filter(acc => acc.is_active).map(account => (
            <label key={account.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAccounts.includes(account.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAccounts([...selectedAccounts, account.id]);
                  } else {
                    setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">
                {account.platform?.display_name || 'Unknown'} - @{account.username}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Posting Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max-posts">Max Posts Per Day</Label>
          <Input
            id="max-posts"
            type="number"
            min="1"
            max="10"
            value={maxPostsPerDay}
            onChange={(e) => setMaxPostsPerDay(parseInt(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="min-hours">Min Hours Between Posts</Label>
          <Input
            id="min-hours"
            type="number"
            min="1"
            max="24"
            step="0.5"
            value={minHoursBetween}
            onChange={(e) => setMinHoursBetween(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Creating...' : 'Create Schedule'}
        </Button>
      </div>
    </div>
  );
}