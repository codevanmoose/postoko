'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format, addDays, setHours, setMinutes, startOfDay } from 'date-fns';

interface SchedulePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  suggestedTimes?: Date[];
}

export default function SchedulePicker({
  value,
  onChange,
  minDate = new Date(),
  suggestedTimes = []
}: SchedulePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? startOfDay(value) : startOfDay(addDays(new Date(), 1))
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? format(value, 'HH:mm') : '09:00'
  );

  // Generate suggested times for the next 7 days
  const defaultSuggestedTimes = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(new Date(), i);
    // Morning (9 AM)
    defaultSuggestedTimes.push(setMinutes(setHours(date, 9), 0));
    // Evening (6 PM)
    defaultSuggestedTimes.push(setMinutes(setHours(date, 18), 0));
  }

  const timesToShow = suggestedTimes.length > 0 ? suggestedTimes : defaultSuggestedTimes;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setSelectedDate(date);
    updateDateTime(date, selectedTime);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value);
    updateDateTime(selectedDate, e.target.value);
  };

  const updateDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = setMinutes(setHours(date, hours), minutes);
    onChange(dateTime);
  };

  const selectSuggestedTime = (time: Date) => {
    setSelectedDate(startOfDay(time));
    setSelectedTime(format(time, 'HH:mm'));
    onChange(time);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="date">Date</Label>
          <div className="relative mt-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="date"
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              min={format(minDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="w-full pl-10 pr-3 py-2 rounded-md border border-input bg-background"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="time">Time</Label>
          <div className="relative mt-1">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="time"
              type="time"
              value={selectedTime}
              onChange={handleTimeChange}
              className="w-full pl-10 pr-3 py-2 rounded-md border border-input bg-background"
            />
          </div>
        </div>
      </div>

      {timesToShow.length > 0 && (
        <div>
          <Label>Suggested Times</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {timesToShow.slice(0, 6).map((time, index) => {
              const isSelected = value && time.getTime() === value.getTime();
              const isPast = time < new Date();
              
              if (isPast) return null;
              
              return (
                <Button
                  key={index}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectSuggestedTime(time)}
                  disabled={isPast}
                >
                  {format(time, 'EEE, MMM d')} at {format(time, 'h:mm a')}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            These are optimal posting times based on platform best practices
          </p>
        </div>
      )}

      {value && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">
            Scheduled for: <strong>{format(value, 'EEEE, MMMM d, yyyy at h:mm a')}</strong>
          </p>
        </div>
      )}
    </div>
  );
}