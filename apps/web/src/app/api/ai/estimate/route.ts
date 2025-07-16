import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { OpenAIClient } from '@postoko/ai';
import { AIGenerationType, AIModel } from '@postoko/ai/types';

// POST /api/ai/estimate - Get cost estimate for AI operations
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;

    // Parse request body
    let body: {
      operation: AIGenerationType;
      model?: AIModel;
      prompt?: string;
      image_size?: string;
      image_quality?: string;
      image_count?: number;
    };

    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { operation } = body;
    if (!operation) {
      return NextResponse.json(
        { error: 'operation is required' },
        { status: 400 }
      );
    }

    // Validate operation type
    const validOperations: AIGenerationType[] = ['caption', 'image', 'hashtags', 'enhancement'];
    if (!validOperations.includes(operation)) {
      return NextResponse.json(
        { error: `operation must be one of: ${validOperations.join(', ')}` },
        { status: 400 }
      );
    }

    const openai = new OpenAIClient();
    let estimatedCost = 0;
    let estimatedTokens = 0;
    let creditsRequired = 0;

    try {
      if (operation === 'image') {
        // Image generation cost estimation
        const size = body.image_size || '1024x1024';
        const quality = body.image_quality || 'standard';
        const count = body.image_count || 1;

        if (!['1024x1024', '1792x1024', '1024x1792'].includes(size)) {
          return NextResponse.json(
            { error: 'Invalid image size' },
            { status: 400 }
          );
        }

        if (!['standard', 'hd'].includes(quality)) {
          return NextResponse.json(
            { error: 'Invalid image quality' },
            { status: 400 }
          );
        }

        if (count < 1 || count > 10) {
          return NextResponse.json(
            { error: 'Image count must be between 1 and 10' },
            { status: 400 }
          );
        }

        estimatedCost = openai.calculateImageCost(size, quality as 'standard' | 'hd', count);
        estimatedTokens = 0; // Images don't use tokens
        creditsRequired = Math.ceil(estimatedCost / 100); // 1 credit per $0.01

      } else {
        // Text generation cost estimation
        const model = body.model || 'gpt-4';
        const prompt = body.prompt || '';

        if (!['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'].includes(model)) {
          return NextResponse.json(
            { error: 'Invalid model' },
            { status: 400 }
          );
        }

        // Estimate input tokens
        const inputTokens = openai.estimateTokenCount(prompt);
        
        // Estimate output tokens based on operation type
        let outputTokens = 0;
        switch (operation) {
          case 'caption':
            outputTokens = 150; // Average caption length
            break;
          case 'hashtags':
            outputTokens = 50; // Average hashtag response
            break;
          case 'enhancement':
            outputTokens = inputTokens * 1.5; // Enhancement usually increases length
            break;
          default:
            outputTokens = 100;
        }

        estimatedTokens = inputTokens + outputTokens;
        estimatedCost = openai.calculateTextCost(model as AIModel, inputTokens, outputTokens);
        creditsRequired = Math.ceil(estimatedCost / 50); // 1 credit per $0.005
      }

      // Calculate estimated processing time
      let estimatedTimeMs = 0;
      switch (operation) {
        case 'caption':
          estimatedTimeMs = 3000; // 3 seconds
          break;
        case 'image':
          estimatedTimeMs = 15000; // 15 seconds
          break;
        case 'hashtags':
          estimatedTimeMs = 2000; // 2 seconds
          break;
        case 'enhancement':
          estimatedTimeMs = 4000; // 4 seconds
          break;
      }

      return NextResponse.json({
        success: true,
        estimate: {
          operation,
          model: body.model || (operation === 'image' ? 'dall-e-3' : 'gpt-4'),
          estimated_tokens: estimatedTokens,
          estimated_cost_cents: estimatedCost,
          credits_required: creditsRequired,
          estimated_time_ms: estimatedTimeMs,
          currency: 'USD',
        },
        breakdown: operation === 'image' ? {
          size: body.image_size || '1024x1024',
          quality: body.image_quality || 'standard',
          count: body.image_count || 1,
        } : {
          input_tokens: estimatedTokens > 0 ? Math.floor(estimatedTokens * 0.6) : 0,
          output_tokens: estimatedTokens > 0 ? Math.ceil(estimatedTokens * 0.4) : 0,
          total_tokens: estimatedTokens,
        }
      });

    } catch (error) {
      console.error('Cost estimation error:', error);
      return NextResponse.json(
        { error: 'Failed to calculate cost estimate' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Estimate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}