# AI API Routes

This document describes the AI module API routes implemented for the Postoko application.

## Authentication

All AI API routes require authentication. Include the session cookie in your requests or the API will return `401 Unauthorized`.

## Rate Limiting

AI operations are subject to rate limiting and cost tracking. Users may receive `429 Too Many Requests` if they exceed their limits.

## API Endpoints

### 1. Generate Caption

**POST** `/api/ai/generate/caption`

Generate engaging captions for social media content.

#### Request Body

```json
{
  "image_url": "https://example.com/image.jpg",
  "content_description": "A beautiful sunset over mountains",
  "target_platforms": ["instagram", "twitter"],
  "brand_voice_id": "uuid-string",
  "template_id": "uuid-string",
  "additional_context": "Posted during summer vacation",
  "max_length": 280,
  "include_hashtags": true,
  "include_cta": true
}
```

#### Response

```json
{
  "success": true,
  "generation": {
    "id": "gen_123",
    "type": "caption",
    "result": {
      "caption": "Chasing sunsets and making memories ✨",
      "hashtags": ["#sunset", "#travel", "#adventure"],
      "call_to_action": "Where's your favorite sunset spot?",
      "confidence_score": 0.95
    },
    "quality_score": 0.92,
    "safety_rating": "safe",
    "flagged_content": false,
    "created_at": "2025-01-11T10:30:00Z"
  },
  "usage": {
    "tokens_used": 245,
    "cost_cents": 12,
    "processing_time_ms": 2840
  }
}
```

### 2. Generate Image

**POST** `/api/ai/generate/image`

Generate images using AI (DALL-E 3).

#### Request Body

```json
{
  "prompt": "A futuristic city skyline at sunset with flying cars",
  "style": "photorealistic",
  "aspect_ratio": "16:9",
  "quality": "hd",
  "size": "1792x1024",
  "n": 1,
  "brand_voice_id": "uuid-string"
}
```

#### Response

```json
{
  "success": true,
  "generation": {
    "id": "gen_456",
    "type": "image",
    "result": {
      "image_urls": ["https://oaidalleapiprodscus.blob.core.windows.net/private/..."],
      "revised_prompt": "A detailed futuristic city skyline at sunset...",
      "confidence_score": 0.88
    },
    "quality_score": 0.90,
    "safety_rating": "safe",
    "flagged_content": false,
    "created_at": "2025-01-11T10:35:00Z"
  },
  "usage": {
    "tokens_used": 0,
    "cost_cents": 80,
    "processing_time_ms": 12500
  }
}
```

### 3. Brand Voices

#### List Brand Voices

**GET** `/api/ai/brand-voices?limit=20&offset=0`

Get user's brand voices with pagination.

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "voice_123",
      "user_id": "user_456",
      "name": "Professional Tech",
      "description": "Professional tone for tech content",
      "tone": "professional",
      "style": "educational",
      "personality_traits": ["knowledgeable", "clear", "helpful"],
      "preferred_words": ["innovative", "cutting-edge", "solution"],
      "avoided_words": ["cheap", "basic"],
      "sample_content": "Discover innovative solutions that transform your workflow...",
      "is_default": true,
      "created_at": "2025-01-10T15:20:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

#### Create Brand Voice

**POST** `/api/ai/brand-voices`

Create a new brand voice.

#### Request Body

```json
{
  "name": "Casual Lifestyle",
  "description": "Relaxed, friendly tone for lifestyle content",
  "tone": "casual",
  "style": "conversational",
  "personality_traits": ["friendly", "relatable", "optimistic"],
  "preferred_words": ["amazing", "awesome", "love"],
  "avoided_words": ["corporate", "synergy"],
  "sample_content": "Hey there! Just discovered this amazing coffee shop...",
  "writing_style_notes": "Use contractions, emojis, and casual language",
  "is_default": false
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "voice_789",
    "user_id": "user_456",
    "name": "Casual Lifestyle",
    "description": "Relaxed, friendly tone for lifestyle content",
    "tone": "casual",
    "style": "conversational",
    "personality_traits": ["friendly", "relatable", "optimistic"],
    "preferred_words": ["amazing", "awesome", "love"],
    "avoided_words": ["corporate", "synergy"],
    "sample_content": "Hey there! Just discovered this amazing coffee shop...",
    "writing_style_notes": "Use contractions, emojis, and casual language",
    "is_default": false,
    "created_at": "2025-01-11T10:45:00Z"
  }
}
```

### 4. Usage Analytics

**GET** `/api/ai/analytics?period=30d&granularity=day`

Get AI usage analytics and insights.

#### Query Parameters

- `period` - Time period: `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `granularity` - Data granularity: `day`, `week`, `month` (default: `day`)
- `start_date` - Custom start date (YYYY-MM-DD)
- `end_date` - Custom end date (YYYY-MM-DD)

#### Response

```json
{
  "success": true,
  "data": {
    "analytics": [
      {
        "id": "analytics_123",
        "user_id": "user_456",
        "date": "2025-01-10",
        "caption_generations": 15,
        "image_generations": 5,
        "enhancement_requests": 3,
        "total_tokens": 2500,
        "total_cost_cents": 125,
        "avg_quality_score": 0.89,
        "success_rate": 0.95
      }
    ],
    "daily_usage": [
      {
        "date": "2025-01-10",
        "count": 23,
        "cost": 125,
        "tokens": 2500
      }
    ],
    "summary": {
      "total_generations": 150,
      "total_cost_cents": 750,
      "total_tokens": 25000,
      "average_quality_score": 0.87,
      "success_rate": 0.93
    },
    "generation_types": {
      "caption": 120,
      "image": 25,
      "enhancement": 5
    },
    "safety_ratings": {
      "safe": 145,
      "low_risk": 4,
      "medium_risk": 1
    },
    "current_month": {
      "usage": {
        "generations": 150,
        "cost_cents": 750,
        "tokens": 25000
      },
      "limits": {
        "max_generations_per_month": 1000,
        "max_cost_per_month_cents": 5000,
        "max_tokens_per_month": 100000
      },
      "usage_percentages": {
        "generations": 15,
        "cost": 15,
        "tokens": 25
      }
    }
  }
}
```

### 5. Cost Estimation

**POST** `/api/ai/estimate`

Get cost estimates for AI operations before executing them.

#### Request Body

```json
{
  "operation": "caption",
  "model": "gpt-4",
  "prompt": "Generate a caption for this travel photo..."
}
```

```json
{
  "operation": "image",
  "image_size": "1024x1024",
  "image_quality": "hd",
  "image_count": 2
}
```

#### Response

```json
{
  "success": true,
  "estimate": {
    "operation": "caption",
    "model": "gpt-4",
    "estimated_tokens": 200,
    "estimated_cost_cents": 15,
    "credits_required": 1,
    "estimated_time_ms": 3000,
    "currency": "USD"
  },
  "breakdown": {
    "input_tokens": 120,
    "output_tokens": 80,
    "total_tokens": 200
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `402 Payment Required` - Insufficient credits
- `409 Conflict` - Resource already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Specific Error Messages

- `"Rate limit exceeded. Please try again later."` - Too many requests
- `"Insufficient credits. Please upgrade your plan."` - Payment required
- `"Content flagged by safety filters. Please modify your request."` - Safety violation
- `"Maximum number of brand voices reached (10)"` - Resource limit

## Usage Examples

### JavaScript/TypeScript

```typescript
// Generate caption
const response = await fetch('/api/ai/generate/caption', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: 'https://example.com/image.jpg',
    target_platforms: ['instagram', 'twitter'],
    include_hashtags: true,
  }),
});

const data = await response.json();
if (data.success) {
  console.log('Caption:', data.generation.result.caption);
  console.log('Cost:', data.usage.cost_cents, 'cents');
}
```

### cURL

```bash
# Generate image
curl -X POST '/api/ai/generate/image' \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "A serene mountain landscape at dawn",
    "size": "1024x1024",
    "quality": "hd"
  }'
```

## Integration Notes

1. **Authentication**: All routes use the `@postoko/auth` middleware
2. **Database**: Uses `@postoko/database` for Supabase integration
3. **AI Module**: Leverages `@postoko/ai` library classes
4. **Cost Tracking**: All operations track usage and costs
5. **Safety**: Content moderation is applied to all AI generations
6. **Rate Limiting**: Implement client-side rate limiting for better UX

## Testing

Test the API routes using the examples above or integrate with your frontend application. Make sure to handle all error cases and implement proper loading states.