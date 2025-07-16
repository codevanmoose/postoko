import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { QueueManager } from '@postoko/queue/server';
import { isValid, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const status = searchParams.get('status')?.split(',') || undefined;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const accountIds = searchParams.get('account_ids')?.split(',') || undefined;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    // Validate dates
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (startDate) {
      const parsedStart = parseISO(startDate);
      if (!isValid(parsedStart)) {
        return NextResponse.json(
          { error: 'Invalid start_date format' },
          { status: 400 }
        );
      }
      filters.startDate = parsedStart;
    }
    
    if (endDate) {
      const parsedEnd = parseISO(endDate);
      if (!isValid(parsedEnd)) {
        return NextResponse.json(
          { error: 'Invalid end_date format' },
          { status: 400 }
        );
      }
      filters.endDate = parsedEnd;
    }
    
    if (accountIds) {
      filters.accountIds = accountIds;
    }
    
    const queueManager = new QueueManager();
    const items = await queueManager.getQueueItems(user.id, filters);
    
    // Apply limit and offset if provided
    let filteredItems = items;
    if (offset) {
      const offsetNum = parseInt(offset);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        filteredItems = filteredItems.slice(offsetNum);
      }
    }
    
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        filteredItems = filteredItems.slice(0, limitNum);
      }
    }
    
    return NextResponse.json({
      items: filteredItems,
      total: items.length,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  } catch (error: any) {
    console.error('Get queue items error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch queue items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['content_type', 'scheduled_for', 'social_account_ids'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate scheduled_for date
    const scheduledFor = parseISO(body.scheduled_for);
    if (!isValid(scheduledFor)) {
      return NextResponse.json(
        { error: 'Invalid scheduled_for date format' },
        { status: 400 }
      );
    }
    
    // Validate social_account_ids is an array
    if (!Array.isArray(body.social_account_ids) || body.social_account_ids.length === 0) {
      return NextResponse.json(
        { error: 'social_account_ids must be a non-empty array' },
        { status: 400 }
      );
    }
    
    const queueManager = new QueueManager();
    const queueItem = await queueManager.addToQueue(user.id, {
      content_type: body.content_type,
      content_id: body.content_id,
      caption: body.caption,
      hashtags: body.hashtags,
      media_urls: body.media_urls,
      scheduled_for: body.scheduled_for,
      social_account_ids: body.social_account_ids,
      priority: body.priority || 1,
      metadata: body.metadata,
    });
    
    return NextResponse.json(queueItem, { status: 201 });
  } catch (error: any) {
    console.error('Create queue item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create queue item' },
      { status: 500 }
    );
  }
}