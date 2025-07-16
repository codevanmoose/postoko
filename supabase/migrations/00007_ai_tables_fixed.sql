-- AI Module Tables

-- First create tables without foreign key references

-- AI templates (created first as it's referenced by ai_generations)
CREATE TABLE ai_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  
  -- Template configuration
  prompt_template TEXT NOT NULL,
  default_parameters JSONB DEFAULT '{}',
  target_platforms TEXT[],
  
  -- Metadata
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_template_type CHECK (type IN ('caption', 'image', 'enhancement'))
);

-- Brand voice configurations
CREATE TABLE brand_voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Voice characteristics
  tone TEXT NOT NULL,
  style TEXT NOT NULL,
  personality_traits TEXT[],
  
  -- Content guidelines
  preferred_words TEXT[],
  avoided_words TEXT[],
  sample_content TEXT,
  writing_style_notes TEXT,
  
  -- Usage settings
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_tone CHECK (tone IN ('professional', 'casual', 'playful', 'authoritative', 'friendly', 'formal')),
  CONSTRAINT valid_style CHECK (style IN ('formal', 'conversational', 'humorous', 'inspirational', 'educational', 'promotional'))
);

-- AI generations (now can reference ai_templates)
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result JSONB NOT NULL,
  
  -- Configuration
  model TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  template_id UUID REFERENCES ai_templates(id),
  
  -- Content context
  source_image_url TEXT,
  target_platforms TEXT[],
  brand_voice TEXT,
  
  -- Quality and safety
  quality_score DECIMAL,
  safety_rating TEXT,
  flagged_content BOOLEAN DEFAULT false,
  
  -- Usage tracking
  tokens_used INTEGER,
  cost_cents INTEGER,
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_generation_type CHECK (type IN ('caption', 'image', 'hashtags', 'enhancement')),
  CONSTRAINT valid_model CHECK (model IN ('gpt-4', 'gpt-4-turbo', 'dall-e-3', 'gpt-3.5-turbo')),
  CONSTRAINT valid_safety_rating CHECK (safety_rating IN ('safe', 'low_risk', 'medium_risk', 'high_risk'))
);

-- AI usage analytics
CREATE TABLE ai_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Usage metrics
  total_generations INTEGER DEFAULT 0,
  caption_generations INTEGER DEFAULT 0,
  image_generations INTEGER DEFAULT 0,
  hashtag_generations INTEGER DEFAULT 0,
  
  -- Cost tracking
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  
  -- Performance metrics
  average_quality_score DECIMAL,
  successful_generations INTEGER DEFAULT 0,
  failed_generations INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Unique constraint to ensure one record per user per day
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_type ON ai_generations(type);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at DESC);
CREATE INDEX idx_ai_generations_template_id ON ai_generations(template_id);

CREATE INDEX idx_ai_templates_user_id ON ai_templates(user_id);
CREATE INDEX idx_ai_templates_type ON ai_templates(type);
CREATE INDEX idx_ai_templates_is_public ON ai_templates(is_public);

CREATE INDEX idx_brand_voices_user_id ON brand_voices(user_id);
CREATE INDEX idx_brand_voices_is_default ON brand_voices(is_default);

CREATE INDEX idx_ai_usage_analytics_user_date ON ai_usage_analytics(user_id, date);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_generations_updated_at
  BEFORE UPDATE ON ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_ai_templates_updated_at
  BEFORE UPDATE ON ai_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

CREATE TRIGGER update_brand_voices_updated_at
  BEFORE UPDATE ON brand_voices
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_updated_at();

-- Enable Row Level Security
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- ai_generations policies
CREATE POLICY "Users can view own generations"
  ON ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations"
  ON ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations"
  ON ai_generations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations"
  ON ai_generations FOR DELETE
  USING (auth.uid() = user_id);

-- ai_templates policies
CREATE POLICY "Users can view own and public templates"
  ON ai_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own templates"
  ON ai_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON ai_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON ai_templates FOR DELETE
  USING (auth.uid() = user_id);

-- brand_voices policies
CREATE POLICY "Users can view own brand voices"
  ON brand_voices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brand voices"
  ON brand_voices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand voices"
  ON brand_voices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand voices"
  ON brand_voices FOR DELETE
  USING (auth.uid() = user_id);

-- ai_usage_analytics policies
CREATE POLICY "Users can view own usage analytics"
  ON ai_usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage analytics"
  ON ai_usage_analytics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update usage analytics
CREATE OR REPLACE FUNCTION update_ai_usage_analytics(
  p_user_id UUID,
  p_type TEXT,
  p_tokens INTEGER,
  p_cost_cents INTEGER,
  p_success BOOLEAN,
  p_quality_score DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_usage_analytics (
    user_id,
    date,
    total_generations,
    caption_generations,
    image_generations,
    hashtag_generations,
    total_tokens,
    total_cost_cents,
    successful_generations,
    failed_generations,
    average_quality_score
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    1,
    CASE WHEN p_type = 'caption' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'image' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'hashtags' THEN 1 ELSE 0 END,
    p_tokens,
    p_cost_cents,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_quality_score
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_generations = ai_usage_analytics.total_generations + 1,
    caption_generations = ai_usage_analytics.caption_generations + CASE WHEN p_type = 'caption' THEN 1 ELSE 0 END,
    image_generations = ai_usage_analytics.image_generations + CASE WHEN p_type = 'image' THEN 1 ELSE 0 END,
    hashtag_generations = ai_usage_analytics.hashtag_generations + CASE WHEN p_type = 'hashtags' THEN 1 ELSE 0 END,
    total_tokens = ai_usage_analytics.total_tokens + p_tokens,
    total_cost_cents = ai_usage_analytics.total_cost_cents + p_cost_cents,
    successful_generations = ai_usage_analytics.successful_generations + CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_generations = ai_usage_analytics.failed_generations + CASE WHEN p_success THEN 0 ELSE 1 END,
    average_quality_score = CASE 
      WHEN p_quality_score IS NOT NULL THEN
        (COALESCE(ai_usage_analytics.average_quality_score, 0) * ai_usage_analytics.successful_generations + p_quality_score) / (ai_usage_analytics.successful_generations + 1)
      ELSE
        ai_usage_analytics.average_quality_score
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_ai_usage_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION update_ai_usage_analytics TO service_role;