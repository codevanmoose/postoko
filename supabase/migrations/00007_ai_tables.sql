-- AI Module Tables

-- AI generations
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

-- AI templates
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

-- AI usage analytics
CREATE TABLE ai_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Usage metrics
  caption_generations INTEGER DEFAULT 0,
  image_generations INTEGER DEFAULT 0,
  enhancement_requests INTEGER DEFAULT 0,
  
  -- Cost tracking
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  
  -- Quality metrics
  avg_quality_score DECIMAL,
  success_rate DECIMAL,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_ai_generations_user_type ON ai_generations(user_id, type);
CREATE INDEX idx_ai_generations_created_at ON ai_generations(created_at);
CREATE INDEX idx_ai_templates_user_type ON ai_templates(user_id, type);
CREATE INDEX idx_ai_templates_public ON ai_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_brand_voices_user_default ON brand_voices(user_id, is_default);
CREATE INDEX idx_ai_usage_analytics_user_date ON ai_usage_analytics(user_id, date);

-- RLS Policies
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI generations"
  ON ai_generations FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own templates"
  ON ai_templates FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public templates"
  ON ai_templates FOR SELECT TO authenticated
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their own brand voices"
  ON brand_voices FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own analytics"
  ON ai_usage_analytics FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
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

-- Function to update AI analytics
CREATE OR REPLACE FUNCTION update_ai_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily analytics when AI generation is created
  IF TG_OP = 'INSERT' THEN
    INSERT INTO ai_usage_analytics (
      user_id, 
      date,
      caption_generations,
      image_generations,
      enhancement_requests,
      total_tokens,
      total_cost_cents
    )
    VALUES (
      NEW.user_id,
      CURRENT_DATE,
      CASE WHEN NEW.type = 'caption' THEN 1 ELSE 0 END,
      CASE WHEN NEW.type = 'image' THEN 1 ELSE 0 END,
      CASE WHEN NEW.type = 'enhancement' THEN 1 ELSE 0 END,
      COALESCE(NEW.tokens_used, 0),
      COALESCE(NEW.cost_cents, 0)
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      caption_generations = ai_usage_analytics.caption_generations + 
        CASE WHEN NEW.type = 'caption' THEN 1 ELSE 0 END,
      image_generations = ai_usage_analytics.image_generations + 
        CASE WHEN NEW.type = 'image' THEN 1 ELSE 0 END,
      enhancement_requests = ai_usage_analytics.enhancement_requests + 
        CASE WHEN NEW.type = 'enhancement' THEN 1 ELSE 0 END,
      total_tokens = ai_usage_analytics.total_tokens + COALESCE(NEW.tokens_used, 0),
      total_cost_cents = ai_usage_analytics.total_cost_cents + COALESCE(NEW.cost_cents, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_analytics_trigger
  AFTER INSERT ON ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_analytics();

-- Function to ensure only one default brand voice per user
CREATE OR REPLACE FUNCTION ensure_single_default_brand_voice()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this voice as default, unset others
  IF NEW.is_default = true THEN
    UPDATE brand_voices 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_brand_voice_trigger
  BEFORE INSERT OR UPDATE ON brand_voices
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_brand_voice();