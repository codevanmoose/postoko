import { createClient } from '@postoko/database';
import { OpenAIClient } from './openai-client';
import { GenerateImageRequest, AIGeneration } from '../types';

export class ImageGenerator {
  private supabase = createClient();
  private openai = new OpenAIClient();

  async generateImage(
    userId: string,
    request: GenerateImageRequest
  ): Promise<AIGeneration> {
    const startTime = Date.now();

    try {
      // Generate image using DALL-E
      const response = await this.openai.generateImage(request.prompt, {
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        n: request.n || 1,
      });

      // Calculate cost
      const costCents = this.openai.calculateImageCost(
        request.size || '1024x1024',
        request.quality || 'standard',
        request.n || 1
      );

      // Check content safety
      const moderation = await this.openai.moderateContent(request.prompt);

      // Save generation
      const generation = await this.saveGeneration(userId, {
        type: 'image',
        prompt: request.prompt,
        result: {
          image_urls: response.images.map(img => img.url),
          revised_prompt: response.images[0]?.revised_prompt,
        },
        model: 'dall-e-3',
        safety_rating: moderation.safety_rating,
        flagged_content: moderation.flagged,
        cost_cents: costCents,
        processing_time_ms: Date.now() - startTime,
      });

      return generation;
    } catch (error) {
      console.error('Image generation failed:', error);
      throw new Error('Failed to generate image');
    }
  }

  private async saveGeneration(userId: string, data: any): Promise<AIGeneration> {
    const { data: generation, error } = await this.supabase
      .from('ai_generations')
      .insert({
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to save generation');
    return generation as AIGeneration;
  }
}