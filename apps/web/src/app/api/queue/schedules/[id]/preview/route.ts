import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { Scheduler } from '@postoko/queue';
import { createClient } from '@postoko/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    
    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'days must be a number between 1 and 30' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    // Get the schedule
    const { data: schedule, error } = await supabase
      .from('queue_schedules')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    const scheduler = new Scheduler();
    const preview = await scheduler.previewSchedule(schedule, days);
    
    // Convert the Map to an object for JSON serialization
    const postsPerDay: Record<string, number> = {};
    for (const [day, count] of preview.posts_per_day.entries()) {
      postsPerDay[day] = count;
    }
    
    return NextResponse.json({
      schedule_id: id,
      schedule_name: schedule.name,
      preview_days: days,
      scheduled_times: preview.scheduled_times,
      total_posts: preview.total_posts,
      posts_per_day: postsPerDay,
      average_posts_per_day: Math.round((preview.total_posts / days) * 10) / 10,
    });
  } catch (error: any) {
    console.error('Preview schedule error:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to preview schedule' },
      { status: 500 }
    );
  }
}