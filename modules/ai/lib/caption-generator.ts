import { createClient } from '@postoko/database';
import { OpenAIClient } from './openai-client';
import { TemplateEngine } from './template-engine';
import { 
  GenerateCaptionRequest, 
  AIGeneration, 
  BrandVoice,
  GenerationResult,
  AIModel 
} from '../types';

export class CaptionGenerator {
  private supabase = createClient();
  private openai = new OpenAIClient();
  private templateEngine = new TemplateEngine();

  async generateCaption(
    userId: string,
    request: GenerateCaptionRequest
  ): Promise<AIGeneration> {
    const startTime = Date.now();

    try {
      // Get brand voice if specified
      let brandVoice: BrandVoice | null = null;
      if (request.brand_voice_id) {
        brandVoice = await this.getBrandVoice(userId, request.brand_voice_id);
      }

      // Analyze image if provided
      let imageDescription = '';
      if (request.image_url) {
        const analysis = await this.openai.analyzeImage(
          request.image_url,
          "Analyze this image for social media content. Describe key visual elements, mood, colors, subjects, and suggest content themes."
        );
        imageDescription = analysis.description;
      }

      // Build the prompt
      const prompt = await this.buildCaptionPrompt({
        imageDescription,
        contentDescription: request.content_description,
        targetPlatforms: request.target_platforms,
        brandVoice,
        additionalContext: request.additional_context,
        maxLength: request.max_length,
        includeHashtags: request.include_hashtags,
        includeCta: request.include_cta,
      });

      // Generate caption using GPT
      const model: AIModel = 'gpt-4';
      const response = await this.openai.generateText(prompt, {
        model,
        max_tokens: 600,
        temperature: 0.8,
      });

      // Parse the generated content
      const result = this.parseCaptionResponse(response.content);

      // Check content safety
      const moderation = await this.openai.moderateContent(result.caption || '');

      // Calculate cost
      const costCents = Math.round(this.openai.calculateTextCost(
        model,
        this.openai.estimateTokenCount(prompt),
        response.tokens_used
      ));

      // Save generation to database
      const generation = await this.saveGeneration(userId, {
        type: 'caption',
        prompt,
        result,
        model,
        source_image_url: request.image_url,
        target_platforms: request.target_platforms,
        brand_voice: brandVoice?.name,
        quality_score: this.calculateQualityScore(result),
        safety_rating: moderation.safety_rating,
        flagged_content: moderation.flagged,
        tokens_used: response.tokens_used,
        cost_cents: costCents,
        processing_time_ms: Date.now() - startTime,
      });

      return generation;
    } catch (error) {
      console.error('Caption generation failed:', error);
      throw new Error('Failed to generate caption');
    }
  }

  private async buildCaptionPrompt(options: {
    imageDescription?: string;
    contentDescription?: string;
    targetPlatforms: string[];
    brandVoice?: BrandVoice | null;
    additionalContext?: string;
    maxLength?: number;
    includeHashtags?: boolean;
    includeCta?: boolean;
  }): Promise<string> {
    let prompt = "You are a social media content expert. Generate an engaging caption for a social media post.\n\n";

    // Add image context
    if (options.imageDescription) {
      prompt += `IMAGE DESCRIPTION:\n${options.imageDescription}\n\n`;
    }

    // Add content description
    if (options.contentDescription) {
      prompt += `CONTENT DESCRIPTION:\n${options.contentDescription}\n\n`;
    }

    // Add platform requirements
    prompt += `TARGET PLATFORMS: ${options.targetPlatforms.join(', ')}\n\n`;

    // Add platform-specific requirements
    const platformRequirements = this.getPlatformRequirements(options.targetPlatforms);
    if (platformRequirements) {
      prompt += `PLATFORM REQUIREMENTS:\n${platformRequirements}\n\n`;
    }

    // Add brand voice
    if (options.brandVoice) {
      prompt += `BRAND VOICE:\n`;
      prompt += `- Tone: ${options.brandVoice.tone}\n`;
      prompt += `- Style: ${options.brandVoice.style}\n`;
      if (options.brandVoice.personality_traits.length > 0) {
        prompt += `- Personality: ${options.brandVoice.personality_traits.join(', ')}\n`;
      }
      if (options.brandVoice.preferred_words.length > 0) {
        prompt += `- Use words like: ${options.brandVoice.preferred_words.join(', ')}\n`;
      }
      if (options.brandVoice.avoided_words.length > 0) {
        prompt += `- Avoid words like: ${options.brandVoice.avoided_words.join(', ')}\n`;
      }
      if (options.brandVoice.sample_content) {
        prompt += `- Style example: "${options.brandVoice.sample_content}"\n`;
      }
      prompt += '\n';
    }

    // Add additional context
    if (options.additionalContext) {
      prompt += `ADDITIONAL CONTEXT:\n${options.additionalContext}\n\n`;
    }

    // Add requirements
    prompt += "REQUIREMENTS:\n";
    if (options.maxLength) {
      prompt += `- Maximum ${options.maxLength} characters\n`;
    }
    prompt += "- Engaging and authentic\n";
    prompt += "- Appropriate for the target platforms\n";
    prompt += "- Match the brand voice if specified\n";

    if (options.includeHashtags) {
      prompt += "- Include 3-5 relevant hashtags\n";
    }

    if (options.includeCta) {
      prompt += "- Include a subtle call-to-action\n";
    }

    prompt += "\nGenerate the caption in this JSON format:\n";
    prompt += "{\n";
    prompt += '  "caption": "The main caption text",\n';
    if (options.includeHashtags) {
      prompt += '  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],\n';
    }
    if (options.includeCta) {
      prompt += '  "call_to_action": "The call-to-action text",\n';
    }
    prompt += '  "confidence_score": 0.95\n';
    prompt += "}";

    return prompt;
  }

  private getPlatformRequirements(platforms: string[]): string {
    const requirements: string[] = [];

    if (platforms.includes('twitter')) {
      requirements.push("Twitter: Keep under 280 characters, use engaging hooks");
    }
    if (platforms.includes('instagram')) {
      requirements.push("Instagram: Can be longer, use line breaks, emoji-friendly");
    }
    if (platforms.includes('linkedin')) {
      requirements.push("LinkedIn: Professional tone, industry insights, thought leadership");
    }
    if (platforms.includes('pinterest')) {
      requirements.push("Pinterest: Descriptive, searchable, include relevant keywords");
    }
    if (platforms.includes('tiktok')) {
      requirements.push("TikTok: Casual, trending language, encourage engagement");
    }

    return requirements.join('\n');
  }

  private parseCaptionResponse(content: string): GenerationResult {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        caption: parsed.caption,
        hashtags: parsed.hashtags || [],
        call_to_action: parsed.call_to_action,
        confidence_score: parsed.confidence_score || 0.8,
      };
    } catch {
      // Fallback: treat entire content as caption
      return {
        caption: content.trim(),
        confidence_score: 0.7,
      };
    }
  }

  private calculateQualityScore(result: GenerationResult): number {
    let score = result.confidence_score || 0.5;

    // Adjust based on content length
    const captionLength = result.caption?.length || 0;
    if (captionLength > 50 && captionLength < 300) {
      score += 0.1;
    }

    // Adjust based on hashtags
    if (result.hashtags && result.hashtags.length >= 3 && result.hashtags.length <= 7) {
      score += 0.1;
    }

    // Adjust based on call-to-action
    if (result.call_to_action && result.call_to_action.length > 10) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  private async getBrandVoice(userId: string, brandVoiceId: string): Promise<BrandVoice | null> {
    const { data, error } = await this.supabase
      .from('brand_voices')
      .select('*')
      .eq('user_id', userId)
      .eq('id', brandVoiceId)
      .single();

    if (error || !data) return null;
    return data as BrandVoice;
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

    if (error) {
      console.error('Failed to save generation:', error);
      throw new Error('Failed to save generation');
    }

    return generation as AIGeneration;
  }

  // Generate variations of existing caption
  async generateVariations(
    userId: string,
    originalCaption: string,
    count: number = 3
  ): Promise<string[]> {
    const prompt = `
Generate ${count} variations of this social media caption while maintaining the same tone and message:

"${originalCaption}"

Return as a JSON array of strings:
["variation 1", "variation 2", "variation 3"]
    `;

    const response = await this.openai.generateText(prompt, {
      model: 'gpt-4',
      max_tokens: 400,
      temperature: 0.9,
    });

    try {
      const variations = JSON.parse(response.content);
      return Array.isArray(variations) ? variations : [response.content];
    } catch {
      return [response.content];
    }
  }

  // Optimize caption for specific platform
  async optimizeForPlatform(
    userId: string,
    caption: string,
    platform: string
  ): Promise<string> {
    const platformGuidelines = {
      twitter: "Optimize for Twitter: under 280 characters, punchy, engaging hook",
      instagram: "Optimize for Instagram: longer form OK, use line breaks, emoji-friendly",
      linkedin: "Optimize for LinkedIn: professional, thought leadership, industry insights",
      pinterest: "Optimize for Pinterest: descriptive, keyword-rich, searchable",
      tiktok: "Optimize for TikTok: casual, trending language, encourage engagement",
    };

    const guideline = platformGuidelines[platform as keyof typeof platformGuidelines];
    if (!guideline) {
      return caption;
    }

    const prompt = `
${guideline}

Original caption: "${caption}"

Return the optimized caption as plain text.
    `;

    const response = await this.openai.generateText(prompt, {
      model: 'gpt-4',
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.content.replace(/"/g, '').trim();
  }
}