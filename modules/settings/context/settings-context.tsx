'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@postoko/auth';
import type {
  SettingsContextValue,
  UserSettings,
  UpdatePreferencesDTO,
  UpdateNotificationsDTO,
  UpdatePrivacyDTO,
} from '../types';
import { preferencesLib } from '../lib/preferences';
import { notificationsLib } from '../lib/notifications';
import { privacyLib } from '../lib/privacy';

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load all settings in parallel
      const [preferences, notifications, privacy] = await Promise.all([
        preferencesLib.getOrCreatePreferences(user.id),
        notificationsLib.getOrCreateNotifications(user.id),
        privacyLib.getOrCreatePrivacy(user.id),
      ]);

      setSettings({
        preferences,
        notifications,
        privacy,
      });
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (data: UpdatePreferencesDTO) => {
    if (!user || !settings) throw new Error('No user or settings');

    try {
      setError(null);
      const updated = await preferencesLib.updatePreferences(user.id, data);
      
      setSettings({
        ...settings,
        preferences: updated,
      });

      // Apply theme changes immediately
      if (data.theme) {
        applyTheme(data.theme);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateNotifications = async (data: UpdateNotificationsDTO) => {
    if (!user || !settings) throw new Error('No user or settings');

    try {
      setError(null);
      const updated = await notificationsLib.updateNotificationPreferences(user.id, data);
      
      setSettings({
        ...settings,
        notifications: updated,
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updatePrivacy = async (data: UpdatePrivacyDTO) => {
    if (!user || !settings) throw new Error('No user or settings');

    try {
      setError(null);
      const updated = await privacyLib.updatePrivacySettings(user.id, data);
      
      setSettings({
        ...settings,
        privacy: updated,
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const resetToDefaults = async () => {
    if (!user) throw new Error('No user');

    try {
      setError(null);
      const preferences = await preferencesLib.resetToDefaults(user.id);
      
      if (settings) {
        setSettings({
          ...settings,
          preferences,
        });
      }

      // Apply default theme
      applyTheme('system');
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const value: SettingsContextValue = {
    settings,
    loading,
    error,
    updatePreferences,
    updateNotifications,
    updatePrivacy,
    resetToDefaults,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Helper function to apply theme
function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}