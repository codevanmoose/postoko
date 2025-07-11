# Social Module Specification

## Overview
The Social module manages connections to social media platforms (Instagram, Twitter/X, Pinterest, LinkedIn, etc.) and provides a unified interface for posting content across platforms.

## Core Features

### 1. Platform Authentication
- OAuth 2.0 flows for each platform
- Token storage and refresh management
- Secure credential handling
- Platform-specific permission scopes

### 2. Account Management
- Connect/disconnect social accounts
- Multiple accounts per platform
- Account health monitoring
- Rate limit tracking

### 3. Posting Interface
- Unified API for cross-platform posting
- Platform-specific formatting
- Media upload handling
- Caption and hashtag management

### 4. Platform Features
- Platform-specific requirements (aspect ratios, character limits)
- Supported content types per platform
- Optimal posting times
- Platform-specific features (stories, reels, carousels)

## Supported Platforms

### Instagram (via Instagram Basic Display API & Instagram Graph API)
- **Auth**: OAuth 2.0
- **Features**: Feed posts, Stories, Reels, Carousels
- **Media**: Images (JPG, PNG), Videos (MP4)
- **Limits**: 2200 char captions, 30 hashtags
- **Aspect Ratios**: 1:1, 4:5, 1.91:1

### Twitter/X (via Twitter API v2)
- **Auth**: OAuth 2.0
- **Features**: Tweets with media
- **Media**: Images (JPG, PNG, GIF), Videos (MP4)
- **Limits**: 280 chars (or subscription limit)
- **Aspect Ratios**: 16:9, 1:1

### Pinterest (via Pinterest API)
- **Auth**: OAuth 2.0
- **Features**: Pin creation
- **Media**: Images (JPG, PNG)
- **Limits**: 500 char descriptions
- **Aspect Ratios**: 2:3 optimal

### LinkedIn (via LinkedIn API)
- **Auth**: OAuth 2.0
- **Features**: Posts with media
- **Media**: Images (JPG, PNG), Videos (MP4)
- **Limits**: 3000 chars
- **Aspect Ratios**: 1.91:1, 1:1

### TikTok (via TikTok Display API)
- **Auth**: OAuth 2.0
- **Features**: Video posts
- **Media**: Videos (MP4)
- **Limits**: 2200 char captions
- **Aspect Ratios**: 9:16

## Database Schema

```sql
-- Social platform configurations
CREATE TABLE social_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- instagram, twitter, pinterest, etc.
  display_name TEXT NOT NULL,
  icon_url TEXT,
  auth_url_template TEXT NOT NULL,
  token_url TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '{}', -- supported features
  limits JSONB NOT NULL DEFAULT '{}', -- character limits, file sizes, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Connected social accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES social_platforms(id),
  account_id TEXT NOT NULL, -- platform-specific ID
  username TEXT NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  access_token TEXT NOT NULL, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expires_at TIMESTAMPTZ,
  permissions TEXT[], -- granted scopes
  account_type TEXT, -- personal, business, creator
  metadata JSONB DEFAULT '{}', -- platform-specific data
  is_active BOOLEAN DEFAULT true,
  last_posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, platform_id, account_id)
);

-- Platform-specific rate limits
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  limit_count INTEGER NOT NULL,
  limit_window INTEGER NOT NULL, -- seconds
  used_count INTEGER DEFAULT 0,
  resets_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(social_account_id, endpoint)
);

-- Post templates for different platforms
CREATE TABLE post_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES social_platforms(id),
  name TEXT NOT NULL,
  caption_template TEXT, -- with variables like {description}, {hashtags}
  hashtag_sets TEXT[][], -- multiple sets to rotate
  settings JSONB DEFAULT '{}', -- platform-specific settings
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Platform webhooks for real-time updates
CREATE TABLE social_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id UUID NOT NULL REFERENCES social_platforms(id),
  webhook_id TEXT NOT NULL, -- platform's webhook ID
  webhook_secret TEXT, -- for verification
  events TEXT[], -- subscribed events
  endpoint_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform_id, webhook_id)
);

-- RLS Policies
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own social accounts"
  ON social_accounts FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their rate limits"
  ON rate_limits FOR SELECT TO authenticated
  USING (social_account_id IN (
    SELECT id FROM social_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their post templates"
  ON post_templates FOR ALL TO authenticated
  USING (user_id = auth.uid());
```

## API Endpoints

### Authentication
- `POST /api/social/auth/connect` - Initiate OAuth flow
- `GET /api/social/auth/callback` - Handle OAuth callback
- `POST /api/social/auth/refresh` - Refresh access token

### Account Management
- `GET /api/social/accounts` - List connected accounts
- `GET /api/social/accounts/:id` - Get account details
- `DELETE /api/social/accounts/:id` - Disconnect account
- `PUT /api/social/accounts/:id` - Update account settings

### Platform Information
- `GET /api/social/platforms` - List supported platforms
- `GET /api/social/platforms/:name` - Get platform details

### Posting
- `POST /api/social/post` - Create post across platforms
- `POST /api/social/post/preview` - Preview post formatting
- `GET /api/social/post/optimal-times` - Get optimal posting times

### Templates
- `GET /api/social/templates` - List post templates
- `POST /api/social/templates` - Create template
- `PUT /api/social/templates/:id` - Update template
- `DELETE /api/social/templates/:id` - Delete template

## Module Structure

```
modules/social/
├── package.json
├── index.ts
├── MODULE_SPEC.md
├── types/
│   └── index.ts
├── lib/
│   ├── platforms/
│   │   ├── instagram.ts
│   │   ├── twitter.ts
│   │   ├── pinterest.ts
│   │   ├── linkedin.ts
│   │   └── tiktok.ts
│   ├── oauth-manager.ts
│   ├── post-formatter.ts
│   ├── rate-limiter.ts
│   └── platform-factory.ts
├── context/
│   └── social-context.tsx
├── hooks/
│   ├── use-social-accounts.ts
│   ├── use-post-template.ts
│   └── use-platform-limits.ts
└── components/
    ├── account-connector.tsx
    ├── platform-selector.tsx
    ├── post-preview.tsx
    └── template-editor.tsx
```

## Security Considerations

1. **Token Storage**
   - Encrypt tokens at rest
   - Use secure key management
   - Implement token rotation

2. **API Security**
   - Validate webhook signatures
   - Implement rate limiting
   - Use least-privilege scopes

3. **Content Security**
   - Validate media before posting
   - Sanitize user input
   - Check for platform violations

## Testing Requirements

1. **Unit Tests**
   - OAuth flow mocking
   - Platform API mocking
   - Post formatting tests

2. **Integration Tests**
   - Token refresh flows
   - Rate limit handling
   - Error recovery

3. **E2E Tests**
   - Complete posting flow
   - Account connection/disconnection
   - Template management