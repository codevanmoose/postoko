import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { Scheduler } from '@postoko/queue/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id } = params;
    const body = await request.json();
    
    const { is_active } = body;
    
    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean' },
        { status: 400 }
      );
    }
    
    const scheduler = new Scheduler();
    await scheduler.toggleSchedule(user.id, id, is_active);
    
    return NextResponse.json({ 
      success: true, 
      is_active,
      message: is_active ? 'Schedule activated' : 'Schedule deactivated'
    });
  } catch (error: any) {
    console.error('Toggle schedule error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to toggle schedule' },
      { status: 500 }
    );
  }
}