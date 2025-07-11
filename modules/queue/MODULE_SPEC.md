# Queue Module Specification

## Overview
The Queue module manages content scheduling, automated posting, and queue optimization. It acts as the bridge between content selection (Drive module), social platforms (Social module), and the actual posting engine.

## Core Features

### 1. Queue Management
- Add content to queue (manual or automated)
- Reorder queue items
- Pause/resume queue processing
- Bulk operations (delete, reschedule)
- Queue health monitoring

### 2. Scheduling Logic
- Time slot management
- Optimal posting time calculation
- Conflict resolution
- Platform-specific scheduling rules
- Time zone handling

### 3. Content Selection
- Automated content selection from Drive
- Selection strategies (random, chronological, engagement-based)
- Duplicate prevention
- Content rotation
- Fallback mechanisms

### 4. Processing Engine
- Queue worker implementation
- Retry logic with exponential backoff
- Error handling and recovery
- Rate limit compliance
- Status tracking and reporting

### 5. Analytics & Optimization
- Queue performance metrics
- Posting success rates
- Optimal time analysis
- Content performance tracking

## Database Schema

```sql
-- Queue items
CREATE TABLE queue_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, scheduled, processing, posted, failed, cancelled
  priority INTEGER DEFAULT 0,
  
  -- Content
  content_type TEXT NOT NULL, -- 'drive_file', 'ai_generated', 'manual'
  content_id UUID, -- Reference to drive_files.id or ai_generations.id
  caption TEXT,
  hashtags TEXT[],
  media_urls TEXT[],
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ,
  
  -- Target platforms
  social_account_ids UUID[], -- Array of social_accounts.id
  
  -- Processing
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Queue schedules (recurring posting patterns)
CREATE TABLE queue_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Schedule configuration
  schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'custom'
  time_slots JSONB NOT NULL, -- Array of {hour, minute, timezone}
  days_of_week INTEGER[], -- 0-6 for weekly schedules
  
  -- Content source
  source_type TEXT NOT NULL, -- 'drive_folders', 'ai_prompt'
  source_config JSONB NOT NULL, -- folder_ids for drive, prompt config for AI
  
  -- Target configuration
  social_account_ids UUID[],
  template_id UUID REFERENCES post_templates(id),
  
  -- Settings
  max_posts_per_day INTEGER DEFAULT 3,
  min_hours_between_posts DECIMAL DEFAULT 4,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Posted content history
CREATE TABLE posting_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_item_id UUID NOT NULL REFERENCES queue_items(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  
  -- Result
  success BOOLEAN NOT NULL,
  platform_post_id TEXT, -- Platform's post ID
  post_url TEXT,
  error_message TEXT,
  
  -- Metrics
  initial_engagement JSONB, -- likes, comments, shares at creation
  
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
  platform_metrics JSONB DEFAULT '{}', -- {platform: {posted, failed, avg_engagement}}
  
  -- Timing analysis
  best_performing_hours INTEGER[], -- Hours with highest engagement
  
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
```

## API Endpoints

### Queue Management
- `GET /api/queue/items` - List queue items with filtering
- `POST /api/queue/items` - Add item to queue
- `PUT /api/queue/items/:id` - Update queue item
- `DELETE /api/queue/items/:id` - Remove from queue
- `POST /api/queue/items/bulk` - Bulk operations

### Scheduling
- `GET /api/queue/schedules` - List schedules
- `POST /api/queue/schedules` - Create schedule
- `PUT /api/queue/schedules/:id` - Update schedule
- `DELETE /api/queue/schedules/:id` - Delete schedule
- `POST /api/queue/schedules/:id/preview` - Preview next posts

### Processing
- `POST /api/queue/process` - Trigger queue processing (webhook)
- `GET /api/queue/status` - Get queue health status
- `POST /api/queue/items/:id/retry` - Retry failed item

### Analytics
- `GET /api/queue/analytics` - Get queue analytics
- `GET /api/queue/analytics/optimal-times` - Get optimal posting times

## Module Structure

```
modules/queue/
├── package.json
├── index.ts
├── MODULE_SPEC.md
├── types/
│   └── index.ts
├── lib/
│   ├── queue-manager.ts
│   ├── scheduler.ts
│   ├── content-selector.ts
│   ├── queue-processor.ts
│   └── analytics-engine.ts
├── context/
│   └── queue-context.tsx
├── hooks/
│   ├── use-queue-items.ts
│   ├── use-schedules.ts
│   └── use-queue-analytics.ts
└── components/
    ├── queue-list.tsx
    ├── queue-item-card.tsx
    ├── schedule-builder.tsx
    └── queue-calendar.tsx
```

## Queue Processing Logic

### 1. Content Selection Flow
```
1. Check active schedules
2. Identify time slots needing content
3. Select content based on strategy:
   - Random from available files
   - Oldest unposted first
   - Highest engagement potential
4. Apply template if configured
5. Add to queue with calculated posting time
```

### 2. Processing Flow
```
1. Query items ready for posting (scheduled_for <= now)
2. For each item:
   - Check rate limits
   - Validate content still exists
   - Post to each platform
   - Record results
   - Update analytics
3. Handle failures:
   - Increment attempt count
   - Calculate next retry time
   - Send notifications if configured
```

### 3. Optimal Time Calculation
```
1. Analyze historical posting data
2. Consider platform-specific best practices
3. Account for user's audience timezone
4. Avoid conflicts with existing posts
5. Respect minimum spacing between posts
```

## Integration Points

### With Drive Module
- Select files for posting
- Check file availability
- Update file status after posting

### With Social Module
- Post content to platforms
- Check platform limits
- Handle OAuth token refresh

### With AI Module (future)
- Generate captions
- Create variations
- Enhance images

### With Analytics Module
- Track post performance
- Update engagement metrics
- Inform optimization

## Security Considerations

1. **Queue Item Validation**
   - Verify user owns content
   - Check platform permissions
   - Validate posting times

2. **Rate Limiting**
   - Respect platform limits
   - Prevent queue flooding
   - Implement backpressure

3. **Error Handling**
   - Graceful failure recovery
   - Prevent infinite retries
   - Clear error reporting

## Testing Requirements

1. **Unit Tests**
   - Scheduling algorithm
   - Content selection logic
   - Time calculation

2. **Integration Tests**
   - Queue processing flow
   - Platform posting
   - Error scenarios

3. **Performance Tests**
   - Large queue handling
   - Concurrent processing
   - Database queries