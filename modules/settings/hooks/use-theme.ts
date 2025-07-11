import { useEffect } from 'react';
import { useSettings } from '../context/settings-context';
import type { Theme } from '../types';

export function useTheme() {
  const { settings, updatePreferences } = useSettings();
  const theme = settings?.preferences.theme || 'system';

  useEffect(() => {
    applyTheme(theme);

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    await updatePreferences({ theme: newTheme });
  };

  return {
    theme,
    setTheme,
  };
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
  
  // Store in localStorage for initial load
  localStorage.setItem('theme', theme);
}