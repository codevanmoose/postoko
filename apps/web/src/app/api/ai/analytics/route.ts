import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { createClient } from '@postoko/database';
import { AIUsageAnalytics } from '@postoko/ai/types';

// GET /api/ai/analytics - Get AI usage analytics
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // '7d', '30d', '90d', '1y'
    const granularity = searchParams.get('granularity') || 'day'; // 'day', 'week', 'month'
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    // Validate parameters
    const validPeriods = ['7d', '30d', '90d', '1y'];
    const validGranularities = ['day', 'week', 'month'];

    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `period must be one of: ${validPeriods.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validGranularities.includes(granularity)) {
      return NextResponse.json(
        { error: `granularity must be one of: ${validGranularities.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Calculate date range
    const endDate = end_date ? new Date(end_date) : new Date();
    let startDate: Date;

    if (start_date) {
      startDate = new Date(start_date);
    } else {
      startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
    }

    // Fetch usage analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('ai_usage_analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (analyticsError) {
      console.error('Failed to fetch usage analytics:', analyticsError);
      return NextResponse.json(
        { error: 'Failed to fetch usage analytics' },
        { status: 500 }
      );
    }

    // Fetch recent generations for additional insights
    const { data: recentGenerations, error: generationsError } = await supabase
      .from('ai_generations')
      .select('type, quality_score, safety_rating, cost_cents, tokens_used, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (generationsError) {
      console.error('Failed to fetch recent generations:', generationsError);
      return NextResponse.json(
        { error: 'Failed to fetch recent generations' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const totalGenerations = recentGenerations?.length || 0;
    const totalCost = recentGenerations?.reduce((sum, gen) => sum + (gen.cost_cents || 0), 0) || 0;
    const totalTokens = recentGenerations?.reduce((sum, gen) => sum + (gen.tokens_used || 0), 0) || 0;
    const averageQualityScore = totalGenerations > 0 
      ? recentGenerations?.reduce((sum, gen) => sum + (gen.quality_score || 0), 0) / totalGenerations
      : 0;

    // Calculate generation type breakdown
    const generationsByType = recentGenerations?.reduce((acc, gen) => {
      acc[gen.type] = (acc[gen.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate safety rating distribution
    const safetyRatings = recentGenerations?.reduce((acc, gen) => {
      if (gen.safety_rating) {
        acc[gen.safety_rating] = (acc[gen.safety_rating] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Calculate daily usage trend
    const dailyUsage = recentGenerations?.reduce((acc, gen) => {
      const date = gen.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0, cost: 0, tokens: 0 };
      }
      acc[date].count += 1;
      acc[date].cost += gen.cost_cents || 0;
      acc[date].tokens += gen.tokens_used || 0;
      return acc;
    }, {} as Record<string, any>) || {};

    // Get current subscription limits (mock data for now)
    const subscriptionLimits = {
      max_generations_per_month: 1000,
      max_cost_per_month_cents: 5000,
      max_tokens_per_month: 100000,
    };

    // Calculate current month usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthGenerations = recentGenerations?.filter(
      gen => gen.created_at.startsWith(currentMonth)
    ) || [];

    const currentMonthStats = {
      generations: currentMonthGenerations.length,
      cost_cents: currentMonthGenerations.reduce((sum, gen) => sum + (gen.cost_cents || 0), 0),
      tokens: currentMonthGenerations.reduce((sum, gen) => sum + (gen.tokens_used || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        // Time series data
        analytics: analytics as AIUsageAnalytics[],
        daily_usage: Object.values(dailyUsage).sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
        
        // Summary statistics
        summary: {
          total_generations: totalGenerations,
          total_cost_cents: totalCost,
          total_tokens: totalTokens,
          average_quality_score: Math.round(averageQualityScore * 100) / 100,
          success_rate: totalGenerations > 0 
            ? Math.round((recentGenerations?.filter(gen => !gen.safety_rating || gen.safety_rating === 'safe').length || 0) / totalGenerations * 100) / 100
            : 0,
        },
        
        // Breakdowns
        generation_types: generationsByType,
        safety_ratings: safetyRatings,
        
        // Current month limits and usage
        current_month: {
          usage: currentMonthStats,
          limits: subscriptionLimits,
          usage_percentages: {
            generations: Math.round((currentMonthStats.generations / subscriptionLimits.max_generations_per_month) * 100),
            cost: Math.round((currentMonthStats.cost_cents / subscriptionLimits.max_cost_per_month_cents) * 100),
            tokens: Math.round((currentMonthStats.tokens / subscriptionLimits.max_tokens_per_month) * 100),
          }
        },
        
        // Meta information
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          period,
          granularity,
        }
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}