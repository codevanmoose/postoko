import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { Scheduler } from '@postoko/queue/server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active_only') === 'true';
    
    const scheduler = new Scheduler();
    const schedules = await scheduler.getSchedules(user.id, activeOnly);
    
    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error('Get schedules error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedules' },
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
    const requiredFields = ['name', 'schedule_type', 'time_slots', 'source_type', 'source_config', 'social_account_ids'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate time_slots is an array
    if (!Array.isArray(body.time_slots) || body.time_slots.length === 0) {
      return NextResponse.json(
        { error: 'time_slots must be a non-empty array' },
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
    
    const scheduler = new Scheduler();
    const schedule = await scheduler.createSchedule(user.id, {
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
    
    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create schedule' },
      { status: 500 }
    );
  }
}