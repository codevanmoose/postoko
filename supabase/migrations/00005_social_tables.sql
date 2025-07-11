-- Social Module Tables

-- Social platform configurations
CREATE TABLE social_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon_url TEXT,
  auth_url_template TEXT NOT NULL,
  token_url TEXT NOT NULL,
  api_base_url TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Connected social accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES social_platforms(id),
  account_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  permissions TEXT[],
  account_type TEXT,
  metadata JSONB DEFAULT '{}',
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
  limit_window INTEGER NOT NULL,
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
  caption_template TEXT,
  hashtag_sets TEXT[][],
  settings JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Platform webhooks for real-time updates
CREATE TABLE social_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id UUID NOT NULL REFERENCES social_platforms(id),
  webhook_id TEXT NOT NULL,
  webhook_secret TEXT,
  events TEXT[],
  endpoint_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform_id, webhook_id)
);

-- Indexes
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform_id ON social_accounts(platform_id);
CREATE INDEX idx_social_accounts_is_active ON social_accounts(is_active);
CREATE INDEX idx_rate_limits_social_account_id ON rate_limits(social_account_id);
CREATE INDEX idx_rate_limits_resets_at ON rate_limits(resets_at);
CREATE INDEX idx_post_templates_user_id ON post_templates(user_id);
CREATE INDEX idx_post_templates_platform_id ON post_templates(platform_id);

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

-- Insert default platform configurations
INSERT INTO social_platforms (name, display_name, icon_url, auth_url_template, token_url, api_base_url, features, limits) VALUES
  ('instagram', 'Instagram', '📷', 
   'https://api.instagram.com/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&response_type=code&state={state}',
   'https://api.instagram.com/oauth/access_token',
   'https://graph.instagram.com',
   '{"feed_posts": true, "stories": true, "reels": true, "carousels": true}',
   '{"caption_length": 2200, "hashtag_count": 30, "image_size_mb": 8, "video_size_mb": 100, "video_duration_seconds": 60}'
  ),
  
  ('twitter', 'Twitter/X', '🐦',
   'https://twitter.com/i/oauth2/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&state={state}&code_challenge={challenge}&code_challenge_method=S256',
   'https://api.twitter.com/2/oauth2/token',
   'https://api.twitter.com/2',
   '{"tweets": true, "threads": true, "media_upload": true}',
   '{"tweet_length": 280, "media_count": 4, "image_size_mb": 5, "video_size_mb": 512, "video_duration_seconds": 140}'
  ),
  
  ('pinterest', 'Pinterest', '📌',
   'https://www.pinterest.com/oauth/?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}&state={state}',
   'https://api.pinterest.com/v5/oauth/token',
   'https://api.pinterest.com/v5',
   '{"pins": true, "boards": true}',
   '{"description_length": 500, "image_size_mb": 20, "image_types": ["jpg", "png"]}'
  ),
  
  ('linkedin', 'LinkedIn', '💼',
   'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&state={state}',
   'https://www.linkedin.com/oauth/v2/accessToken',
   'https://api.linkedin.com/v2',
   '{"posts": true, "articles": true, "media_upload": true}',
   '{"post_length": 3000, "article_length": 125000, "image_size_mb": 10, "video_size_mb": 200}'
  ),
  
  ('tiktok', 'TikTok', '🎵',
   'https://www.tiktok.com/auth/authorize?client_key={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}&state={state}',
   'https://open-api.tiktok.com/oauth/access_token/',
   'https://open-api.tiktok.com',
   '{"videos": true}',
   '{"caption_length": 2200, "video_size_mb": 287, "video_duration_seconds": 180}'
  );

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_social_platforms_updated_at
  BEFORE UPDATE ON social_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

CREATE TRIGGER update_post_templates_updated_at
  BEFORE UPDATE ON post_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();