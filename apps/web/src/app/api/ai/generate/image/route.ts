import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { ImageGenerator } from '@postoko/ai';
import { GenerateImageRequest } from '@postoko/ai/types';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;

    // Parse request body
    let body: GenerateImageRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { prompt } = body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'prompt is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: 'prompt must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Validate optional parameters
    if (body.aspect_ratio && !['1:1', '16:9', '9:16', '4:5'].includes(body.aspect_ratio)) {
      return NextResponse.json(
        { error: 'aspect_ratio must be one of: 1:1, 16:9, 9:16, 4:5' },
        { status: 400 }
      );
    }

    if (body.quality && !['standard', 'hd'].includes(body.quality)) {
      return NextResponse.json(
        { error: 'quality must be either "standard" or "hd"' },
        { status: 400 }
      );
    }

    if (body.size && !['1024x1024', '1792x1024', '1024x1792'].includes(body.size)) {
      return NextResponse.json(
        { error: 'size must be one of: 1024x1024, 1792x1024, 1024x1792' },
        { status: 400 }
      );
    }

    if (body.n && (body.n < 1 || body.n > 10)) {
      return NextResponse.json(
        { error: 'n must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Initialize image generator
    const imageGenerator = new ImageGenerator();

    // Generate image
    const generation = await imageGenerator.generateImage(user.id, body);

    // Return response
    return NextResponse.json({
      success: true,
      generation: {
        id: generation.id,
        type: generation.type,
        result: generation.result,
        quality_score: generation.quality_score,
        safety_rating: generation.safety_rating,
        flagged_content: generation.flagged_content,
        created_at: generation.created_at,
      },
      usage: {
        tokens_used: generation.tokens_used || 0,
        cost_cents: generation.cost_cents || 0,
        processing_time_ms: generation.processing_time_ms || 0,
      }
    });

  } catch (error) {
    console.error('Image generation API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('insufficient credits')) {
        return NextResponse.json(
          { error: 'Insufficient credits. Please upgrade your plan.' },
          { status: 402 }
        );
      }
      
      if (error.message.includes('content flagged')) {
        return NextResponse.json(
          { error: 'Content flagged by safety filters. Please modify your prompt.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('invalid prompt')) {
        return NextResponse.json(
          { error: 'Invalid prompt. Please check your input and try again.' },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
