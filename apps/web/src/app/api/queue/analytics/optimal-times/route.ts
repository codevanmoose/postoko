import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { AnalyticsEngine } from '@postoko/queue';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const platformId = searchParams.get('platform_id');
    
    const analyticsEngine = new AnalyticsEngine();
    const optimalTimes = await analyticsEngine.calculateOptimalTimes(user.id, platformId || undefined);
    
    // Group by platform and day of week for better organization
    const groupedByPlatform: Record<string, any[]> = {};
    const groupedByDayOfWeek: Record<number, any[]> = {};
    
    for (const time of optimalTimes) {
      // Group by platform
      if (!groupedByPlatform[time.platform]) {
        groupedByPlatform[time.platform] = [];
      }
      groupedByPlatform[time.platform].push(time);
      
      // Group by day of week
      if (!groupedByDayOfWeek[time.day_of_week]) {
        groupedByDayOfWeek[time.day_of_week] = [];
      }
      groupedByDayOfWeek[time.day_of_week].push(time);
    }
    
    // Get the top 5 times overall
    const topTimes = optimalTimes.slice(0, 5);
    
    // Calculate best hours across all platforms
    const hourScores: Record<number, number> = {};
    for (const time of optimalTimes) {
      hourScores[time.hour] = (hourScores[time.hour] || 0) + time.engagement_score;
    }
    
    const bestHours = Object.entries(hourScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour, score]) => ({ hour: parseInt(hour), score }));
    
    // Day of week labels
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return NextResponse.json({
      optimal_times: optimalTimes,
      top_times: topTimes,
      best_hours: bestHours,
      grouped_by_platform: groupedByPlatform,
      grouped_by_day: Object.entries(groupedByDayOfWeek).map(([day, times]) => ({
        day_of_week: parseInt(day),
        day_name: dayLabels[parseInt(day)],
        times,
      })),
      platform_filter: platformId,
      total_analyzed: optimalTimes.length,
    });
  } catch (error: any) {
    console.error('Get optimal times error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch optimal posting times' },
      { status: 500 }
    );
  }
}