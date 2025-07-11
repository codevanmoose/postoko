import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { QueueManager } from '@postoko/queue';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id } = params;
    
    const queueManager = new QueueManager();
    const retriedItem = await queueManager.retryFailedItem(user.id, id);
    
    return NextResponse.json(retriedItem);
  } catch (error: any) {
    console.error('Retry queue item error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Failed queue item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to retry queue item' },
      { status: 500 }
    );
  }
}