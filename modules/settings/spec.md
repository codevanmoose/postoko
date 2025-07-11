# Settings Module Specification

## Overview
The Settings module provides user preference management, application customization, and account-level configurations. It integrates with the auth module and serves as the foundation for personalized user experiences across Postoko.

## Features

### 1. User Preferences
- **Theme Settings**
  - Light/Dark/System mode selection
  - Custom accent color selection
  - UI density preferences (compact/comfortable/spacious)
  
- **Localization**
  - Language selection
  - Timezone configuration
  - Date/time format preferences
  - Number format preferences

### 2. Notification Settings
- **Email Notifications**
  - Marketing emails opt-in/out
  - Product updates
  - Security alerts (always on)
  - Posting success/failure notifications
  
- **In-App Notifications**
  - Desktop notifications permission
  - Sound effects toggle
  - Notification grouping preferences

### 3. Privacy & Security
- **Data Management**
  - Download my data
  - Delete my account
  - Data retention preferences
  
- **Privacy Controls**
  - Analytics opt-out
  - Third-party integrations visibility
  - API access logs

### 4. Account Settings
- **Connected Accounts** (preview - full implementation in social module)
  - View connected social platforms
  - Disconnect accounts
  
- **API Keys**
  - Generate personal API keys
  - Manage key permissions
  - View key usage

### 5. Application Settings
- **Dashboard Preferences**
  - Default dashboard view
  - Widget visibility
  - Data refresh intervals
  
- **Posting Defaults**
  - Default posting times
  - Default hashtag sets
  - Watermark preferences

## Database Schema

### user_preferences table
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  accent_color TEXT DEFAULT 'blue',
  ui_density TEXT DEFAULT 'comfortable' CHECK (ui_density IN ('compact', 'comfortable', 'spacious')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### notification_preferences table
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_marketing BOOLEAN DEFAULT true,
  email_product_updates BOOLEAN DEFAULT true,
  email_posting_success BOOLEAN DEFAULT true,
  email_posting_failure BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  push_posting_success BOOLEAN DEFAULT true,
  push_posting_failure BOOLEAN DEFAULT true,
  sound_effects BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### privacy_settings table
```sql
CREATE TABLE privacy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analytics_enabled BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 365,
  show_api_logs BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### api_keys table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  permissions JSONB DEFAULT '{"read": true, "write": false}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key_hash)
);
```

## API Endpoints

### Preferences
- `GET /api/settings/preferences` - Get all user preferences
- `PATCH /api/settings/preferences` - Update preferences
- `POST /api/settings/preferences/reset` - Reset to defaults

### Notifications
- `GET /api/settings/notifications` - Get notification settings
- `PATCH /api/settings/notifications` - Update notification settings
- `POST /api/settings/notifications/test` - Send test notification

### Privacy
- `GET /api/settings/privacy` - Get privacy settings
- `PATCH /api/settings/privacy` - Update privacy settings
- `POST /api/settings/privacy/export-data` - Request data export
- `DELETE /api/settings/privacy/delete-account` - Delete account

### API Keys
- `GET /api/settings/api-keys` - List all API keys
- `POST /api/settings/api-keys` - Create new API key
- `DELETE /api/settings/api-keys/:id` - Revoke API key

## Module Structure
```
modules/settings/
├── package.json
├── index.ts
├── types/
│   └── index.ts
├── lib/
│   ├── preferences.ts
│   ├── notifications.ts
│   ├── privacy.ts
│   └── api-keys.ts
├── hooks/
│   ├── use-preferences.ts
│   ├── use-theme.ts
│   └── use-notifications.ts
├── components/
│   ├── theme-selector.tsx
│   ├── language-selector.tsx
│   ├── timezone-selector.tsx
│   └── notification-toggle.tsx
└── context/
    └── settings-context.tsx
```

## Integration Points

### With Auth Module
- Auto-create default preferences on user signup
- Respect privacy settings in user data queries
- Use theme preferences in AuthProvider

### With Other Modules
- **Billing**: Respect notification preferences for billing emails
- **Posting**: Use default posting times and preferences
- **Analytics**: Respect analytics opt-out settings
- **Dashboard**: Apply UI density and theme preferences

## Security Considerations
- API keys are hashed before storage (bcrypt)
- Only show first/last 4 characters of API keys
- Rate limit API key generation (max 10 per user)
- Audit log for all setting changes
- Require password confirmation for account deletion
- 30-day grace period for account deletion

## Testing Requirements
- Unit tests for preference management logic
- Integration tests for API endpoints
- E2E tests for settings UI flows
- Test theme switching without flicker
- Test timezone conversions
- Test notification delivery

## Performance Considerations
- Cache user preferences in memory/Redis
- Lazy load timezone data
- Debounce preference updates
- Use CSS variables for theme switching
- Minimize settings payload size

## Accessibility
- Keyboard navigation for all settings
- Screen reader announcements for changes
- High contrast mode support
- Reduced motion preferences
- Focus management in modals

## Future Enhancements
- Import/export settings
- Settings profiles/presets
- Team-wide default settings (admin module)
- Webhook preferences
- Custom theme creator
- Keyboard shortcuts customization