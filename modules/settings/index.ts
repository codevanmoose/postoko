// Settings Module Exports

// Context and Provider
export { SettingsProvider, useSettings } from './context/settings-context';

// Hooks
export { useTheme } from './hooks/use-theme';
export { usePreferences, useNotifications, usePrivacy } from './hooks/use-preferences';

// Components
export { ThemeSelector } from './components/theme-selector';
export { NotificationToggle } from './components/notification-toggle';

// Types
export * from './types';

// Libraries
export { preferencesLib } from './lib/preferences';
export { notificationsLib } from './lib/notifications';
export { privacyLib } from './lib/privacy';
export { apiKeysLib } from './lib/api-keys';

// Module metadata
export const MODULE_NAME = 'settings';
export const MODULE_VERSION = '0.1.0';