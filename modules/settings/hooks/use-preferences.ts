import { useSettings } from '../context/settings-context';

export function usePreferences() {
  const { settings, updatePreferences, loading, error } = useSettings();
  
  return {
    preferences: settings?.preferences || null,
    updatePreferences,
    loading,
    error,
  };
}

export function useNotifications() {
  const { settings, updateNotifications, loading, error } = useSettings();
  
  return {
    notifications: settings?.notifications || null,
    updateNotifications,
    loading,
    error,
  };
}

export function usePrivacy() {
  const { settings, updatePrivacy, loading, error } = useSettings();
  
  return {
    privacy: settings?.privacy || null,
    updatePrivacy,
    loading,
    error,
  };
}