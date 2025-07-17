import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { Scheduler } from '@postoko/queue/server';

export const dynamic = 'force-dynamic';


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id } = await params;
    const body = await request.json();
    
    // Validate time_slots if provided
    if (body.time_slots) {
      if (!Array.isArray(body.time_slots) || body.time_slots.length === 0) {
        return NextResponse.json(
          { error: 'time_slots must be a non-empty array' },
          { status: 400 }
        );
      }
      
      // Validate time slot format
      for (const slot of body.time_slots) {
        if (typeof slot.hour !== 'number' || slot.hour < 0 || slot.hour > 23) {
          return NextResponse.json(
            { error: 'Invalid time slot hour (must be 0-23)' },
            { status: 400 }
          );
        }
        if (typeof slot.minute !== 'number' || slot.minute < 0 || slot.minute > 59) {
          return NextResponse.json(
            { error: 'Invalid time slot minute (must be 0-59)' },
            { status: 400 }
          );
        }
        if (!slot.timezone) {
          return NextResponse.json(
            { error: 'Missing timezone in time slot' },
            { status: 400 }
          );
        }
      }
    }
    
    // Validate social_account_ids if provided
    if (body.social_account_ids) {
      if (!Array.isArray(body.social_account_ids) || body.social_account_ids.length === 0) {
        return NextResponse.json(
          { error: 'social_account_ids must be a non-empty array' },
          { status: 400 }
        );
      }
    }
    
    const scheduler = new Scheduler();
    const updatedSchedule = await scheduler.updateSchedule(user.id, id, {
      name: body.name,
      schedule_type: body.schedule_type,
      time_slots: body.time_slots,
      days_of_week: body.days_of_week,
      source_type: body.source_type,
      source_config: body.source_config,
      social_account_ids: body.social_account_ids,
      template_id: body.template_id,
      max_posts_per_day: body.max_posts_per_day,
      min_hours_between_posts: body.min_hours_between_posts,
    });
    
    return NextResponse.json(updatedSchedule);
  } catch (error: any) {
    console.error('Update schedule error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id } = await params;
    
    const scheduler = new Scheduler();
    await scheduler.deleteSchedule(user.id, id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
