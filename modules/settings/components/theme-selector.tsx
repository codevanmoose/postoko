'use client';

import { useTheme } from '../hooks/use-theme';
import type { Theme } from '../types';

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Theme</label>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
              ${theme === t.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }
            `}
          >
            <span className="text-2xl mb-1">{t.icon}</span>
            <span className="text-sm">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}