import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { QueueManager, QueueProcessor } from '@postoko/queue/server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    
    const queueManager = new QueueManager();
    const processor = new QueueProcessor();
    
    // Get queue status and processor status
    const [queueStatus, processorStatus] = await Promise.all([
      queueManager.getQueueStatus(user.id),
      Promise.resolve(processor.getStatus()),
    ]);
    
    // Calculate additional metrics
    const totalItems = queueStatus.pending_count + 
                      queueStatus.scheduled_count + 
                      queueStatus.processing_count + 
                      queueStatus.failed_count;
    
    const processingRate = totalItems > 0 
      ? Math.round((queueStatus.scheduled_count / totalItems) * 100) 
      : 0;
    
    return NextResponse.json({
      ...queueStatus,
      processor: processorStatus,
      total_items: totalItems,
      processing_rate: processingRate,
      health_check: {
        is_healthy: queueStatus.is_healthy,
        issues: queueStatus.errors || [],
        last_check: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Get queue status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get queue status' },
      { status: 500 }
    );
  }
}