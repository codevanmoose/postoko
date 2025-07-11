// Theme types
export type Theme = 'light' | 'dark' | 'system';
export type UIDensity = 'compact' | 'comfortable' | 'spacious';
export type TimeFormat = '12h' | '24h';

// User Preferences
export interface UserPreferences {
  id: string;
  user_id: string;
  theme: Theme;
  accent_color: string;
  ui_density: UIDensity;
  language: string;
  timezone: string;
  date_format: string;
  time_format: TimeFormat;
  created_at: string;
  updated_at: string;
}

// Notification Preferences
export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_marketing: boolean;
  email_product_updates: boolean;
  email_posting_success: boolean;
  email_posting_failure: boolean;
  push_enabled: boolean;
  push_posting_success: boolean;
  push_posting_failure: boolean;
  sound_effects: boolean;
  created_at: string;
  updated_at: string;
}

// Privacy Settings
export interface PrivacySettings {
  id: string;
  user_id: string;
  analytics_enabled: boolean;
  data_retention_days: number;
  show_api_logs: boolean;
  created_at: string;
  updated_at: string;
}

// API Key
export interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  permissions: {
    read: boolean;
    write: boolean;
  };
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

// Combined Settings
export interface UserSettings {
  preferences: UserPreferences;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

// Update DTOs
export interface UpdatePreferencesDTO {
  theme?: Theme;
  accent_color?: string;
  ui_density?: UIDensity;
  language?: string;
  timezone?: string;
  date_format?: string;
  time_format?: TimeFormat;
}

export interface UpdateNotificationsDTO {
  email_marketing?: boolean;
  email_product_updates?: boolean;
  email_posting_success?: boolean;
  email_posting_failure?: boolean;
  push_enabled?: boolean;
  push_posting_success?: boolean;
  push_posting_failure?: boolean;
  sound_effects?: boolean;
}

export interface UpdatePrivacyDTO {
  analytics_enabled?: boolean;
  data_retention_days?: number;
  show_api_logs?: boolean;
}

// API Key creation
export interface CreateAPIKeyDTO {
  name: string;
  permissions?: {
    read: boolean;
    write: boolean;
  };
  expires_in_days?: number;
}

export interface APIKeyResponse {
  key: string; // Only returned on creation
  key_id: string;
  name: string;
  key_prefix: string;
  permissions: {
    read: boolean;
    write: boolean;
  };
  expires_at?: string;
}

// Context types
export interface SettingsContextValue {
  settings: UserSettings | null;
  loading: boolean;
  error: Error | null;
  updatePreferences: (data: UpdatePreferencesDTO) => Promise<void>;
  updateNotifications: (data: UpdateNotificationsDTO) => Promise<void>;
  updatePrivacy: (data: UpdatePrivacyDTO) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}