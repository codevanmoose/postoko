import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { QueueManager } from '@postoko/queue';
import { isValid, parseISO } from 'date-fns';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id } = params;
    const body = await request.json();
    
    // Validate scheduled_for date if provided
    if (body.scheduled_for) {
      const scheduledFor = parseISO(body.scheduled_for);
      if (!isValid(scheduledFor)) {
        return NextResponse.json(
          { error: 'Invalid scheduled_for date format' },
          { status: 400 }
        );
      }
    }
    
    const queueManager = new QueueManager();
    const updatedItem = await queueManager.updateQueueItem(user.id, id, {
      status: body.status,
      caption: body.caption,
      hashtags: body.hashtags,
      scheduled_for: body.scheduled_for,
      priority: body.priority,
    });
    
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error('Update queue item error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update queue item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id } = params;
    
    const queueManager = new QueueManager();
    await queueManager.removeFromQueue(user.id, id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete queue item error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete queue item' },
      { status: 500 }
    );
  }
}