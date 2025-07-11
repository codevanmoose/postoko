import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { createClient } from '@postoko/database';
import { BrandVoice, CreateBrandVoiceRequest } from '@postoko/ai/types';

// GET /api/ai/brand-voices - List user's brand voices
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const include_public = searchParams.get('include_public') === 'true';

    // Validate parameters
    if (limit > 100) {
      return NextResponse.json(
        { error: 'limit cannot exceed 100' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Build query
    let query = supabase
      .from('brand_voices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: brandVoices, error } = await query;

    if (error) {
      console.error('Failed to fetch brand voices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch brand voices' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('brand_voices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      data: brandVoices as BrandVoice[],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Brand voices API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ai/brand-voices - Create brand voice
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;

    // Parse request body
    let body: CreateBrandVoiceRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { name, tone, style } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!tone || typeof tone !== 'string') {
      return NextResponse.json(
        { error: 'tone is required' },
        { status: 400 }
      );
    }

    if (!style || typeof style !== 'string') {
      return NextResponse.json(
        { error: 'style is required' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'name must be less than 100 characters' },
        { status: 400 }
      );
    }

    // Validate tone and style values
    const validTones = ['professional', 'casual', 'playful', 'authoritative', 'friendly', 'formal'];
    const validStyles = ['formal', 'conversational', 'humorous', 'inspirational', 'educational', 'promotional'];

    if (!validTones.includes(tone as any)) {
      return NextResponse.json(
        { error: `tone must be one of: ${validTones.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validStyles.includes(style as any)) {
      return NextResponse.json(
        { error: `style must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate optional arrays
    if (body.personality_traits && !Array.isArray(body.personality_traits)) {
      return NextResponse.json(
        { error: 'personality_traits must be an array' },
        { status: 400 }
      );
    }

    if (body.preferred_words && !Array.isArray(body.preferred_words)) {
      return NextResponse.json(
        { error: 'preferred_words must be an array' },
        { status: 400 }
      );
    }

    if (body.avoided_words && !Array.isArray(body.avoided_words)) {
      return NextResponse.json(
        { error: 'avoided_words must be an array' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if user already has a brand voice with the same name
    const { data: existingVoice } = await supabase
      .from('brand_voices')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name.trim())
      .single();

    if (existingVoice) {
      return NextResponse.json(
        { error: 'A brand voice with this name already exists' },
        { status: 409 }
      );
    }

    // Check user's brand voice limit (assuming a limit of 10 per user)
    const { count } = await supabase
      .from('brand_voices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of brand voices reached (10)' },
        { status: 400 }
      );
    }

    // If this is set as default, unset existing default
    if (body.is_default) {
      await supabase
        .from('brand_voices')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    // Create brand voice
    const { data: brandVoice, error } = await supabase
      .from('brand_voices')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: body.description?.trim() || null,
        tone: tone as any,
        style: style as any,
        personality_traits: body.personality_traits || [],
        preferred_words: body.preferred_words || [],
        avoided_words: body.avoided_words || [],
        sample_content: body.sample_content?.trim() || null,
        writing_style_notes: body.writing_style_notes?.trim() || null,
        is_default: body.is_default || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create brand voice:', error);
      return NextResponse.json(
        { error: 'Failed to create brand voice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: brandVoice as BrandVoice
    }, { status: 201 });

  } catch (error) {
    console.error('Brand voices API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}