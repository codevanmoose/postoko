import OpenAI from 'openai';
import { AIModel, SafetyRating } from '../types';

export class OpenAIClient {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey,
    });
  }

  // Generate text using GPT models
  async generateText(
    prompt: string,
    options: {
      model?: AIModel;
      max_tokens?: number;
      temperature?: number;
      system_message?: string;
    } = {}
  ): Promise<{
    content: string;
    tokens_used: number;
    model: string;
    finish_reason: string;
  }> {
    const {
      model = 'gpt-4',
      max_tokens = 500,
      temperature = 0.7,
      system_message
    } = options;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (system_message) {
      messages.push({
        role: 'system',
        content: system_message
      });
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature,
    });

    const choice = response.choices[0];
    if (!choice.message.content) {
      throw new Error('No content generated');
    }

    return {
      content: choice.message.content,
      tokens_used: response.usage?.total_tokens || 0,
      model: response.model,
      finish_reason: choice.finish_reason || 'unknown',
    };
  }

  // Generate images using DALL-E
  async generateImage(
    prompt: string,
    options: {
      size?: '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      n?: number;
      style?: 'vivid' | 'natural';
    } = {}
  ): Promise<{
    images: Array<{
      url: string;
      revised_prompt?: string;
    }>;
    model: string;
  }> {
    const {
      size = '1024x1024',
      quality = 'standard',
      n = 1,
      style = 'vivid'
    } = options;

    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt,
      size,
      quality,
      n,
      style,
      response_format: 'url',
    });

    return {
      images: response.data.map(image => ({
        url: image.url!,
        revised_prompt: image.revised_prompt,
      })),
      model: 'dall-e-3',
    };
  }

  // Analyze image and generate description
  async analyzeImage(
    imageUrl: string,
    prompt: string = "Describe this image in detail for social media content creation."
  ): Promise<{
    description: string;
    tokens_used: number;
  }> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No description generated');
    }

    return {
      description: content,
      tokens_used: response.usage?.total_tokens || 0,
    };
  }

  // Check content safety
  async moderateContent(content: string): Promise<{
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
    safety_rating: SafetyRating;
  }> {
    const response = await this.client.moderations.create({
      input: content,
    });

    const result = response.results[0];
    
    // Calculate safety rating based on scores
    const maxScore = Math.max(...Object.values(result.category_scores));
    let safety_rating: SafetyRating = 'safe';
    
    if (maxScore > 0.8) safety_rating = 'high_risk';
    else if (maxScore > 0.5) safety_rating = 'medium_risk';
    else if (maxScore > 0.2) safety_rating = 'low_risk';

    return {
      flagged: result.flagged,
      categories: result.categories,
      category_scores: result.category_scores,
      safety_rating,
    };
  }

  // Calculate estimated cost for text generation
  calculateTextCost(
    model: AIModel,
    inputTokens: number,
    outputTokens: number
  ): number {
    // Pricing per 1K tokens (in cents)
    const pricing = {
      'gpt-4': { input: 3.0, output: 6.0 },
      'gpt-4-turbo': { input: 1.0, output: 3.0 },
      'gpt-3.5-turbo': { input: 0.05, output: 0.15 },
    };

    const modelPricing = pricing[model as keyof typeof pricing];
    if (!modelPricing) {
      throw new Error(`Unknown model: ${model}`);
    }

    const inputCost = (inputTokens / 1000) * modelPricing.input;
    const outputCost = (outputTokens / 1000) * modelPricing.output;
    
    return Math.round((inputCost + outputCost) * 100) / 100; // Round to cents
  }

  // Calculate estimated cost for image generation
  calculateImageCost(
    size: string,
    quality: string,
    n: number = 1
  ): number {
    // DALL-E 3 pricing (in cents)
    const pricing = {
      '1024x1024': { standard: 4.0, hd: 8.0 },
      '1792x1024': { standard: 8.0, hd: 12.0 },
      '1024x1792': { standard: 8.0, hd: 12.0 },
    };

    const sizePricing = pricing[size as keyof typeof pricing];
    if (!sizePricing) {
      throw new Error(`Unknown size: ${size}`);
    }

    const qualityPricing = sizePricing[quality as keyof typeof sizePricing];
    if (!qualityPricing) {
      throw new Error(`Unknown quality: ${quality}`);
    }

    return qualityPricing * n;
  }

  // Estimate token count for text (rough estimation)
  estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  // Get model capabilities
  getModelCapabilities(model: AIModel) {
    const capabilities = {
      'gpt-4': {
        max_tokens: 8192,
        supports_vision: false,
        supports_functions: true,
        cost_per_1k_input: 3.0,
        cost_per_1k_output: 6.0,
      },
      'gpt-4-turbo': {
        max_tokens: 128000,
        supports_vision: true,
        supports_functions: true,
        cost_per_1k_input: 1.0,
        cost_per_1k_output: 3.0,
      },
      'gpt-3.5-turbo': {
        max_tokens: 16385,
        supports_vision: false,
        supports_functions: true,
        cost_per_1k_input: 0.05,
        cost_per_1k_output: 0.15,
      },
      'dall-e-3': {
        max_images: 1,
        supported_sizes: ['1024x1024', '1792x1024', '1024x1792'],
        supported_qualities: ['standard', 'hd'],
        cost_1024x1024_standard: 4.0,
        cost_1024x1024_hd: 8.0,
      },
    };

    return capabilities[model];
  }
}