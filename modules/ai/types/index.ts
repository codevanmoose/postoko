export type AIGenerationType = 'caption' | 'image' | 'hashtags' | 'enhancement';
export type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'dall-e-3' | 'gpt-3.5-turbo';
export type SafetyRating = 'safe' | 'low_risk' | 'medium_risk' | 'high_risk';
export type TemplateType = 'caption' | 'image' | 'enhancement';
export type BrandTone = 'professional' | 'casual' | 'playful' | 'authoritative' | 'friendly' | 'formal';
export type BrandStyle = 'formal' | 'conversational' | 'humorous' | 'inspirational' | 'educational' | 'promotional';

export interface AIGeneration {
  id: string;
  user_id: string;
  type: AIGenerationType;
  prompt: string;
  result: GenerationResult;
  
  // Configuration
  model: AIModel;
  parameters: Record<string, any>;
  template_id?: string;
  
  // Content context
  source_image_url?: string;
  target_platforms?: string[];
  brand_voice?: string;
  
  // Quality and safety
  quality_score?: number;
  safety_rating?: SafetyRating;
  flagged_content: boolean;
  
  // Usage tracking
  tokens_used?: number;
  cost_cents?: number;
  processing_time_ms?: number;
  
  created_at: string;
  updated_at: string;
}

export interface GenerationResult {
  // For caption generation
  caption?: string;
  hashtags?: string[];
  call_to_action?: string;
  
  // For image generation
  image_url?: string;
  image_urls?: string[];
  revised_prompt?: string;
  
  // For enhancement
  original_content?: string;
  enhanced_content?: string;
  improvements?: string[];
  
  // Common
  confidence_score?: number;
  alternatives?: any[];
}

export interface AITemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: TemplateType;
  
  // Template configuration
  prompt_template: string;
  default_parameters: Record<string, any>;
  target_platforms?: string[];
  
  // Metadata
  is_public: boolean;
  usage_count: number;
  success_rate: number;
  
  created_at: string;
  updated_at: string;
}

export interface BrandVoice {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  
  // Voice characteristics
  tone: BrandTone;
  style: BrandStyle;
  personality_traits: string[];
  
  // Content guidelines
  preferred_words: string[];
  avoided_words: string[];
  sample_content?: string;
  writing_style_notes?: string;
  
  // Usage settings
  is_default: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface AIUsageAnalytics {
  id: string;
  user_id: string;
  date: string;
  
  // Usage metrics
  caption_generations: number;
  image_generations: number;
  enhancement_requests: number;
  
  // Cost tracking
  total_tokens: number;
  total_cost_cents: number;
  
  // Quality metrics
  avg_quality_score?: number;
  success_rate?: number;
  
  created_at: string;
}

// Request types
export interface GenerateCaptionRequest {
  image_url?: string;
  content_description?: string;
  target_platforms: string[];
  brand_voice_id?: string;
  template_id?: string;
  additional_context?: string;
  max_length?: number;
  include_hashtags?: boolean;
  include_cta?: boolean;
}

export interface GenerateImageRequest {
  prompt: string;
  style?: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:5';
  quality?: 'standard' | 'hd';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  n?: number;
  brand_voice_id?: string;
}

export interface GenerateHashtagsRequest {
  content: string;
  target_platforms: string[];
  niche?: string;
  max_hashtags?: number;
  include_trending?: boolean;
}

export interface EnhanceContentRequest {
  content: string;
  enhancement_type: 'engagement' | 'clarity' | 'length' | 'tone';
  target_platforms: string[];
  brand_voice_id?: string;
  target_length?: number;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: TemplateType;
  prompt_template: string;
  default_parameters?: Record<string, any>;
  target_platforms?: string[];
  is_public?: boolean;
}

export interface CreateBrandVoiceRequest {
  name: string;
  description?: string;
  tone: BrandTone;
  style: BrandStyle;
  personality_traits?: string[];
  preferred_words?: string[];
  avoided_words?: string[];
  sample_content?: string;
  writing_style_notes?: string;
  is_default?: boolean;
}

// Response types
export interface GenerationResponse {
  generation: AIGeneration;
  usage: {
    tokens_used: number;
    cost_cents: number;
    processing_time_ms: number;
  };
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  label: string;
  description?: string;
  required: boolean;
  default_value?: any;
  options?: string[]; // For select type
}

export interface ProcessedTemplate {
  prompt: string;
  variables: TemplateVariable[];
  estimated_cost: number;
}

export interface ContentSuggestion {
  type: 'caption' | 'hashtag' | 'improvement';
  content: string;
  confidence: number;
  reasoning: string;
}

export interface CostEstimate {
  operation: AIGenerationType;
  model: AIModel;
  estimated_tokens: number;
  estimated_cost_cents: number;
  credits_required: number;
}

export interface AICapabilities {
  models: {
    text: AIModel[];
    image: AIModel[];
  };
  features: {
    caption_generation: boolean;
    image_generation: boolean;
    content_enhancement: boolean;
    hashtag_generation: boolean;
    template_system: boolean;
    brand_voice: boolean;
  };
  limits: {
    max_tokens_per_request: number;
    max_images_per_request: number;
    max_templates_per_user: number;
    max_brand_voices_per_user: number;
  };
}