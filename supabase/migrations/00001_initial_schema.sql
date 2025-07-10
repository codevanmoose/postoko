-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('starter', 'pro', 'growth', 'studio', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE post_status AS ENUM ('queued', 'processing', 'posted', 'failed', 'archived');
CREATE TYPE platform_type AS ENUM ('google', 'instagram', 'twitter', 'pinterest', 'threads', 'tiktok');
CREATE TYPE queue_mode AS ENUM ('sequential_old', 'sequential_new', 'random', 'smart_mix', 'weighted');
CREATE TYPE caption_source AS ENUM ('file', 'ai', 'manual', 'template');
CREATE TYPE generation_type AS ENUM ('caption', 'image', 'hashtags');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  stripe_customer_id VARCHAR(255) UNIQUE,
  subscription_tier subscription_tier DEFAULT 'starter',
  subscription_status subscription_status DEFAULT 'active',
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected accounts for social platforms
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  account_avatar TEXT,
  access_token TEXT, -- Will be encrypted
  refresh_token TEXT, -- Will be encrypted
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id)
);

-- Google Drive folders being monitored
CREATE TABLE IF NOT EXISTS public.monitored_folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  folder_id VARCHAR(255) NOT NULL,
  folder_name VARCHAR(255),
  folder_path TEXT,
  brand_name VARCHAR(255), -- For multi-brand support
  last_scanned TIMESTAMP WITH TIME ZONE,
  queue_mode queue_mode DEFAULT 'sequential_old',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, folder_id)
);

-- Posts queue and history
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.monitored_folders(id) ON DELETE CASCADE,
  file_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  caption_source caption_source DEFAULT 'manual',
  hashtags TEXT[], -- Array of hashtags
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  status post_status DEFAULT 'queued',
  is_ai_generated BOOLEAN DEFAULT false,
  source_post_id UUID REFERENCES public.posts(id), -- For AI-generated posts
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform-specific post records
CREATE TABLE IF NOT EXISTS public.platform_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  platform_post_id VARCHAR(255),
  platform_url TEXT,
  status post_status DEFAULT 'queued',
  error_message TEXT,
  engagement_data JSONB, -- Likes, comments, shares, etc.
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, platform, account_id)
);

-- AI generations tracking
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_post_id UUID REFERENCES public.posts(id),
  generation_type generation_type NOT NULL,
  model VARCHAR(50) NOT NULL, -- 'dalle-3', 'sdxl', 'gpt-4', etc.
  prompt TEXT,
  style_analysis JSONB, -- Color palette, composition, etc.
  result_url TEXT, -- For images
  result_text TEXT, -- For captions/hashtags
  safety_score DECIMAL(3,2), -- 0.00 to 1.00
  credits_used INTEGER DEFAULT 1,
  performance_score DECIMAL(3,2), -- Track which generations work best
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI style templates for brand consistency
CREATE TABLE IF NOT EXISTS public.ai_style_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_prompt TEXT,
  style_parameters JSONB,
  sample_images TEXT[], -- URLs of reference images
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI usage tracking for billing
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  images_generated INTEGER DEFAULT 0,
  captions_generated INTEGER DEFAULT 0,
  hashtags_generated INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER,
  tier_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- User settings and preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  posting_times JSONB DEFAULT '{"daily": ["09:00"]}', -- Flexible scheduling
  caption_personas TEXT[], -- Array of selected personas
  default_hashtag_sets JSONB, -- Platform-specific hashtag sets
  empty_queue_behavior VARCHAR(50) DEFAULT 'pause', -- 'pause', 'generate', 'recycle'
  ai_style_preference VARCHAR(50) DEFAULT 'balanced', -- 'creative', 'balanced', 'realistic'
  notification_preferences JSONB DEFAULT '{"email": true, "slack": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Hashtag performance tracking
CREATE TABLE IF NOT EXISTS public.hashtag_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hashtag VARCHAR(100) NOT NULL,
  platform platform_type NOT NULL,
  usage_count INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  competition_level VARCHAR(20), -- 'low', 'medium', 'high'
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, hashtag, platform)
);

-- Subscription events for Stripe webhooks
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_event_id VARCHAR(255) UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  tier subscription_tier,
  amount INTEGER, -- In cents
  currency VARCHAR(3) DEFAULT 'USD',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_posts_user_status ON public.posts(user_id, status);
CREATE INDEX idx_posts_scheduled ON public.posts(scheduled_for) WHERE status = 'queued';
CREATE INDEX idx_platform_posts_status ON public.platform_posts(status, posted_at);
CREATE INDEX idx_ai_generations_user_date ON public.ai_generations(user_id, created_at);
CREATE INDEX idx_hashtag_analytics_user_platform ON public.hashtag_analytics(user_id, platform);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_style_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Connected accounts policies
CREATE POLICY "Users can view own connected accounts" ON public.connected_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own connected accounts" ON public.connected_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view own folders" ON public.monitored_folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own folders" ON public.monitored_folders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own posts" ON public.posts
  FOR ALL USING (auth.uid() = user_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connected_accounts_updated_at BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitored_folders_updated_at BEFORE UPDATE ON public.monitored_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_style_templates_updated_at BEFORE UPDATE ON public.ai_style_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hashtag_analytics_updated_at BEFORE UPDATE ON public.hashtag_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();