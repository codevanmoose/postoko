# AI Module Specification

## Overview
The AI module provides intelligent content generation, caption creation, image enhancement, and optimization for social media posts. It integrates with OpenAI GPT-4 for text generation and DALL-E for image creation.

## Core Features

### 1. Caption Generation
- Smart caption creation based on images
- Platform-specific optimization
- Brand voice customization
- Hashtag suggestions
- Call-to-action generation

### 2. Image Generation
- DALL-E 3 integration for original images
- Style-consistent generation
- Brand-aligned visuals
- Multiple aspect ratios
- Content safety filtering

### 3. Content Enhancement
- Image optimization for platforms
- Caption refinement
- Engagement optimization
- A/B testing suggestions
- Performance prediction

### 4. AI Templates
- Reusable prompt templates
- Brand voice templates
- Industry-specific templates
- Seasonal content templates
- Campaign templates

## Database Schema

```sql
-- AI generations
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'caption', 'image', 'hashtags', 'enhancement'
  prompt TEXT NOT NULL,
  result JSONB NOT NULL,
  
  -- Configuration
  model TEXT NOT NULL, -- 'gpt-4', 'dall-e-3', etc.
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
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AI templates
CREATE TABLE ai_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'caption', 'image', 'enhancement'
  
  -- Template configuration
  prompt_template TEXT NOT NULL,
  default_parameters JSONB DEFAULT '{}',
  target_platforms TEXT[],
  
  -- Metadata
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Brand voice configurations
CREATE TABLE brand_voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Voice characteristics
  tone TEXT NOT NULL, -- 'professional', 'casual', 'playful', 'authoritative'
  style TEXT NOT NULL, -- 'formal', 'conversational', 'humorous', 'inspirational'
  personality_traits TEXT[],
  
  -- Content guidelines
  preferred_words TEXT[],
  avoided_words TEXT[],
  sample_content TEXT,
  writing_style_notes TEXT,
  
  -- Usage settings
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
```

## API Endpoints

### Content Generation
- `POST /api/ai/generate/caption` - Generate caption for image/content
- `POST /api/ai/generate/image` - Generate image from prompt
- `POST /api/ai/generate/hashtags` - Generate hashtags for content
- `POST /api/ai/enhance/caption` - Enhance existing caption
- `POST /api/ai/enhance/image` - Enhance/optimize image

### Templates
- `GET /api/ai/templates` - List user templates
- `POST /api/ai/templates` - Create template
- `PUT /api/ai/templates/:id` - Update template
- `DELETE /api/ai/templates/:id` - Delete template
- `GET /api/ai/templates/public` - List public templates

### Brand Voice
- `GET /api/ai/brand-voices` - List brand voices
- `POST /api/ai/brand-voices` - Create brand voice
- `PUT /api/ai/brand-voices/:id` - Update brand voice
- `DELETE /api/ai/brand-voices/:id` - Delete brand voice

### Analytics
- `GET /api/ai/analytics` - Get AI usage analytics
- `GET /api/ai/analytics/costs` - Get cost breakdown

## Module Structure

```
modules/ai/
├── package.json
├── index.ts
├── MODULE_SPEC.md
├── types/
│   └── index.ts
├── lib/
│   ├── openai-client.ts
│   ├── caption-generator.ts
│   ├── image-generator.ts
│   ├── content-enhancer.ts
│   ├── template-engine.ts
│   └── safety-filter.ts
├── context/
│   └── ai-context.tsx
├── hooks/
│   ├── use-ai-generation.ts
│   ├── use-templates.ts
│   └── use-brand-voices.ts
└── components/
    ├── caption-generator.tsx
    ├── image-generator.tsx
    ├── template-selector.tsx
    └── brand-voice-selector.tsx
```

## Integration Points

### With Queue Module
- Automated content generation for scheduled posts
- Template-based content creation
- Bulk generation for schedules

### With Drive Module
- Image analysis for caption generation
- Content enhancement for existing files
- Metadata extraction and tagging

### With Social Module
- Platform-specific content optimization
- Character limit compliance
- Hashtag suggestions per platform

### With Billing Module
- Usage tracking and cost calculation
- Credit-based generation limits
- Overage alerts and billing

## Security Considerations

1. **Content Safety**
   - OpenAI moderation API integration
   - Custom content filters
   - User reporting system
   - Compliance with platform policies

2. **API Key Security**
   - Encrypted storage of OpenAI keys
   - Rate limiting per user
   - Usage monitoring and alerts

3. **Generated Content**
   - Copyright compliance checks
   - Attribution requirements
   - Content ownership policies

## Pricing Structure

### Generation Costs (Estimate)
- Caption Generation: 0.1 credits
- Image Generation: 1.0 credits  
- Content Enhancement: 0.2 credits
- Hashtag Generation: 0.05 credits

### Credit Packages
- Starter: 100 credits/month
- Professional: 500 credits/month
- Business: 2000 credits/month
- Enterprise: Unlimited

## Testing Requirements

1. **Unit Tests**
   - Content generation functions
   - Template engine
   - Safety filters
   - Cost calculation

2. **Integration Tests**
   - OpenAI API integration
   - Database operations
   - Error handling

3. **Content Quality Tests**
   - Generated content evaluation
   - Platform compliance
   - Brand voice consistency