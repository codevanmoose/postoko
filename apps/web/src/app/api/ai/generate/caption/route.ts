import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { CaptionGenerator } from '@postoko/ai';
import { GenerateCaptionRequest } from '@postoko/ai/types';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;

    // Parse request body
    let body: GenerateCaptionRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { target_platforms } = body;
    if (!target_platforms || !Array.isArray(target_platforms) || target_platforms.length === 0) {
      return NextResponse.json(
        { error: 'target_platforms is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate that at least one content source is provided
    if (!body.image_url && !body.content_description) {
      return NextResponse.json(
        { error: 'Either image_url or content_description must be provided' },
        { status: 400 }
      );
    }

    // Validate supported platforms
    const supportedPlatforms = ['twitter', 'instagram', 'linkedin', 'pinterest', 'tiktok'];
    const invalidPlatforms = target_platforms.filter(platform => !supportedPlatforms.includes(platform));
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Unsupported platforms: ${invalidPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Initialize caption generator
    const captionGenerator = new CaptionGenerator();

    // Generate caption
    const generation = await captionGenerator.generateCaption(user.id, body);

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
    console.error('Caption generation API error:', error);
    
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
          { error: 'Content flagged by safety filters. Please modify your request.' },
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
