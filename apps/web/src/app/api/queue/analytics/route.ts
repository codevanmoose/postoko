import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { AnalyticsEngine } from '@postoko/queue/server';
import { isValid, parseISO, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const searchParams = request.nextUrl.searchParams;
    
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const days = parseInt(searchParams.get('days') || '30');
    
    let startDate: Date;
    let endDate: Date;
    
    if (startDateParam && endDateParam) {
      // Use provided date range
      startDate = parseISO(startDateParam);
      endDate = parseISO(endDateParam);
      
      if (!isValid(startDate) || !isValid(endDate)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' },
          { status: 400 }
        );
      }
      
      if (startDate > endDate) {
        return NextResponse.json(
          { error: 'start_date must be before end_date' },
          { status: 400 }
        );
      }
    } else {
      // Use days parameter
      if (isNaN(days) || days < 1 || days > 365) {
        return NextResponse.json(
          { error: 'days must be a number between 1 and 365' },
          { status: 400 }
        );
      }
      
      endDate = new Date();
      startDate = subDays(endDate, days);
    }
    
    const analyticsEngine = new AnalyticsEngine();
    
    // Get both detailed and aggregated analytics
    const [detailedAnalytics, aggregatedAnalytics] = await Promise.all([
      analyticsEngine.getAnalytics(user.id, startDate, endDate),
      analyticsEngine.getAggregatedAnalytics(user.id, days),
    ]);
    
    return NextResponse.json({
      date_range: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        days_included: days,
      },
      summary: aggregatedAnalytics,
      daily_analytics: detailedAnalytics,
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
