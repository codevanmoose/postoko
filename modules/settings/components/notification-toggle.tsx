'use client';

import { Switch } from '@/components/ui/switch';
import { useNotifications } from '../hooks/use-preferences';
import type { UpdateNotificationsDTO } from '../types';

interface NotificationToggleProps {
  field: keyof UpdateNotificationsDTO;
  label: string;
  description?: string;
}

export function NotificationToggle({ field, label, description }: NotificationToggleProps) {
  const { notifications, updateNotifications } = useNotifications();
  
  if (!notifications) return null;
  
  const checked = notifications[field] as boolean;
  
  const handleChange = async (value: boolean) => {
    await updateNotifications({ [field]: value });
  };
  
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <label className="text-sm font-medium">{label}</label>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
      />
    </div>
  );
}