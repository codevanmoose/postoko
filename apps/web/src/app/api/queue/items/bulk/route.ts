import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { QueueManager } from '@postoko/queue/server';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    
    const { operation, item_ids } = body;
    
    // Validate required fields
    if (!operation || !item_ids) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, item_ids' },
        { status: 400 }
      );
    }
    
    // Validate item_ids is an array
    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { error: 'item_ids must be a non-empty array' },
        { status: 400 }
      );
    }
    
    const queueManager = new QueueManager();
    
    switch (operation) {
      case 'cancel':
        await queueManager.bulkUpdateStatus(user.id, item_ids, 'cancelled');
        break;
      
      case 'reschedule':
        await queueManager.bulkUpdateStatus(user.id, item_ids, 'scheduled');
        break;
      
      case 'delete':
        // For bulk delete, we'll use the bulk update to cancel status
        await queueManager.bulkUpdateStatus(user.id, item_ids, 'cancelled');
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported operations: cancel, reschedule, delete' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ 
      success: true, 
      operation,
      processed_count: item_ids.length 
    });
  } catch (error: any) {
    console.error('Bulk queue operation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}