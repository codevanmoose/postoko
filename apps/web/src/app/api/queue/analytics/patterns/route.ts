import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { AnalyticsEngine } from '@postoko/queue/server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    
    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'days must be a number between 1 and 365' },
        { status: 400 }
      );
    }
    
    const analyticsEngine = new AnalyticsEngine();
    const patterns = await analyticsEngine.getPostingPatterns(user.id, days);
    
    // Convert hour and day data to arrays for easier charting
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      posts: patterns.by_hour[hour] || 0,
      label: `${hour}:00`,
    }));
    
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData = Array.from({ length: 7 }, (_, day) => ({
      day,
      posts: patterns.by_day_of_week[day] || 0,
      label: dayLabels[day],
    }));
    
    // Calculate additional insights
    const totalPosts = Object.values(patterns.by_hour).reduce((sum, count) => sum + count, 0);
    const avgPostsPerDay = Math.round((totalPosts / days) * 10) / 10;
    
    // Find posting frequency patterns
    const peakHours = hourlyData
      .filter(h => h.posts > 0)
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 3)
      .map(h => ({ hour: h.hour, posts: h.posts }));
    
    const peakDays = weeklyData
      .filter(d => d.posts > 0)
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 3)
      .map(d => ({ day: d.day, day_name: d.label, posts: d.posts }));
    
    // Calculate consistency score (how evenly distributed posts are)
    const hourVariance = hourlyData.reduce((sum, h) => sum + Math.pow(h.posts - (totalPosts / 24), 2), 0) / 24;
    const consistencyScore = Math.max(0, Math.min(100, 100 - (hourVariance / 10)));
    
    return NextResponse.json({
      analysis_period: {
        days,
        total_posts: totalPosts,
        avg_posts_per_day: avgPostsPerDay,
      },
      patterns: {
        by_hour: patterns.by_hour,
        by_day_of_week: patterns.by_day_of_week,
        by_platform: patterns.by_platform,
      },
      chart_data: {
        hourly: hourlyData,
        weekly: weeklyData,
      },
      insights: {
        most_active_hour: patterns.most_active_hour,
        most_active_day: patterns.most_active_day,
        most_active_day_name: dayLabels[patterns.most_active_day],
        peak_hours: peakHours,
        peak_days: peakDays,
        consistency_score: Math.round(consistencyScore),
      },
      platform_distribution: Object.entries(patterns.by_platform).map(([platform, count]) => ({
        platform,
        posts: count,
        percentage: Math.round((count / totalPosts) * 100),
      })),
    });
  } catch (error: any) {
    console.error('Get posting patterns error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posting patterns' },
      { status: 500 }
    );
  }
}