# Settings Module

The Settings module provides comprehensive user preference management for Postoko, including theme customization, notification preferences, privacy controls, and API key management.

## Features

- **Theme Management**: Light/Dark/System mode with automatic switching
- **User Preferences**: Language, timezone, UI density customization
- **Notification Settings**: Granular control over email and push notifications
- **Privacy Controls**: Data management, analytics opt-out, API access logs
- **API Key Management**: Generate and manage personal API keys

## Installation

```bash
pnpm add @postoko/settings
```

## Usage

### Basic Setup

Wrap your app with the SettingsProvider:

```tsx
import { SettingsProvider } from '@postoko/settings';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </AuthProvider>
  );
}
```

### Using Settings Hooks

```tsx
import { useTheme, usePreferences, useNotifications } from '@postoko/settings';

function MyComponent() {
  // Theme management
  const { theme, setTheme } = useTheme();
  
  // User preferences
  const { preferences, updatePreferences } = usePreferences();
  
  // Notification settings
  const { notifications, updateNotifications } = useNotifications();
  
  return (
    <div>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark Mode
      </button>
      
      <select 
        value={preferences?.language} 
        onChange={(e) => updatePreferences({ language: e.target.value })}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
}
```

### Components

```tsx
import { ThemeSelector, NotificationToggle } from '@postoko/settings';

function SettingsPage() {
  return (
    <div>
      <ThemeSelector />
      
      <NotificationToggle
        field="email_marketing"
        label="Marketing Emails"
        description="Receive updates about new features"
      />
    </div>
  );
}
```

## API Reference

### Hooks

#### useSettings()
Access the full settings context with all preferences, notifications, and privacy settings.

#### useTheme()
Manage theme preferences with automatic persistence and system detection.

#### usePreferences()
Access and update user preferences like language, timezone, and UI density.

#### useNotifications()
Manage notification preferences for email and push notifications.

#### usePrivacy()
Control privacy settings including analytics and data retention.

### Types

```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  accent_color: string;
  ui_density: 'compact' | 'comfortable' | 'spacious';
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
}

interface NotificationPreferences {
  email_marketing: boolean;
  email_product_updates: boolean;
  email_posting_success: boolean;
  email_posting_failure: boolean;
  push_enabled: boolean;
  push_posting_success: boolean;
  push_posting_failure: boolean;
  sound_effects: boolean;
}

interface PrivacySettings {
  analytics_enabled: boolean;
  data_retention_days: number;
  show_api_logs: boolean;
}
```

## Database Schema

The module creates four tables:
- `user_preferences` - UI and localization preferences
- `notification_preferences` - Email and push notification settings
- `privacy_settings` - Privacy and data controls
- `api_keys` - Personal API key management

All tables include automatic timestamp management and row-level security.

## Security

- API keys are hashed using bcrypt before storage
- Row-level security ensures users can only access their own settings
- Automatic settings creation on user signup
- Rate limiting on API key generation

## Integration

The Settings module integrates seamlessly with:
- **Auth Module**: Auto-creates settings on signup
- **UI Components**: Theme changes apply immediately
- **API Routes**: Respect user preferences for responses
- **Notification System**: Honor user notification preferences

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## License

MIT