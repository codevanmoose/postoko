-- Queue Module Tables

-- Queue items
CREATE TABLE queue_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  
  -- Content
  content_type TEXT NOT NULL,
  content_id UUID,
  caption TEXT,
  hashtags TEXT[],
  media_urls TEXT[],
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  
  -- Target platforms
  social_account_ids UUID[],
  
  -- Processing
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'scheduled', 'processing', 'posted', 'failed', 'cancelled')),
  CONSTRAINT valid_content_type CHECK (content_type IN ('drive_file', 'ai_generated', 'manual'))
);

-- Queue schedules (recurring posting patterns)
CREATE TABLE queue_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Schedule configuration
  schedule_type TEXT NOT NULL,
  time_slots JSONB NOT NULL,
  days_of_week INTEGER[],
  
  -- Content source
  source_type TEXT NOT NULL,
  source_config JSONB NOT NULL,
  
  -- Target configuration
  social_account_ids UUID[],
  template_id UUID REFERENCES post_templates(id),
  
  -- Settings
  max_posts_per_day INTEGER DEFAULT 3,
  min_hours_between_posts DECIMAL DEFAULT 4,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_schedule_type CHECK (schedule_type IN ('daily', 'weekly', 'custom')),
  CONSTRAINT valid_source_type CHECK (source_type IN ('drive_folders', 'ai_prompt'))
);

-- Posted content history
CREATE TABLE posting_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_item_id UUID NOT NULL REFERENCES queue_items(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  
  -- Result
  success BOOLEAN NOT NULL,
  platform_post_id TEXT,
  post_url TEXT,
  error_message TEXT,
  
  -- Metrics
  initial_engagement JSONB,
  
  posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Queue analytics
CREATE TABLE queue_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Metrics
  items_queued INTEGER DEFAULT 0,
  items_posted INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  -- Performance by platform
  platform_metrics JSONB DEFAULT '{}',
  
  -- Timing analysis
  best_performing_hours INTEGER[],
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_queue_items_user_status ON queue_items(user_id, status);
CREATE INDEX idx_queue_items_scheduled_for ON queue_items(scheduled_for);
CREATE INDEX idx_queue_items_next_retry ON queue_items(next_retry_at);
CREATE INDEX idx_queue_schedules_user_active ON queue_schedules(user_id, is_active);
CREATE INDEX idx_posting_history_queue_item ON posting_history(queue_item_id);
CREATE INDEX idx_queue_analytics_user_date ON queue_analytics(user_id, date);

-- RLS Policies
ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own queue items"
  ON queue_items FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own schedules"
  ON queue_schedules FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their posting history"
  ON posting_history FOR SELECT TO authenticated
  USING (queue_item_id IN (
    SELECT id FROM queue_items WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their analytics"
  ON queue_analytics FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_queue_items_updated_at
  BEFORE UPDATE ON queue_items
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_updated_at();

CREATE TRIGGER update_queue_schedules_updated_at
  BEFORE UPDATE ON queue_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_updated_at();

-- Function to update analytics
CREATE OR REPLACE FUNCTION update_queue_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily analytics when queue item status changes
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    -- If item was posted
    IF NEW.status = 'posted' THEN
      INSERT INTO queue_analytics (user_id, date, items_posted)
      VALUES (NEW.user_id, CURRENT_DATE, 1)
      ON CONFLICT (user_id, date)
      DO UPDATE SET items_posted = queue_analytics.items_posted + 1;
    -- If item failed
    ELSIF NEW.status = 'failed' THEN
      INSERT INTO queue_analytics (user_id, date, items_failed)
      VALUES (NEW.user_id, CURRENT_DATE, 1)
      ON CONFLICT (user_id, date)
      DO UPDATE SET items_failed = queue_analytics.items_failed + 1;
    END IF;
  -- Track new items added to queue
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO queue_analytics (user_id, date, items_queued)
    VALUES (NEW.user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET items_queued = queue_analytics.items_queued + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_queue_analytics_trigger
  AFTER INSERT OR UPDATE ON queue_items
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_analytics();