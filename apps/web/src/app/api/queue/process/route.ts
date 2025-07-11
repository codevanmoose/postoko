import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { QueueProcessor } from '@postoko/queue';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    
    const { item_id, force = false } = body;
    
    const processor = new QueueProcessor();
    
    if (item_id) {
      // Process specific item
      try {
        await processor.processSingleItem(item_id);
        return NextResponse.json({
          success: true,
          message: 'Item processed successfully',
          item_id,
        });
      } catch (error: any) {
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Queue item not found' },
            { status: 404 }
          );
        }
        throw error;
      }
    } else {
      // Trigger general queue processing
      if (force) {
        // Force processing even if already running
        await processor.process();
      } else {
        // Check if processor is already running
        const status = processor.getStatus();
        if (status.is_running) {
          return NextResponse.json(
            { error: 'Queue processor is already running' },
            { status: 409 }
          );
        }
        
        // Start processing
        await processor.process();
      }
      
      return NextResponse.json({
        success: true,
        message: 'Queue processing triggered',
        forced: force,
      });
    }
  } catch (error: any) {
    console.error('Process queue error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process queue' },
      { status: 500 }
    );
  }
}