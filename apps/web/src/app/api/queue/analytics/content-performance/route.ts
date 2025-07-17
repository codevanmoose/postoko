import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { AnalyticsEngine } from '@postoko/queue/server';

export const dynamic = 'force-dynamic';


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
    const performance = await analyticsEngine.getContentPerformance(user.id, days);
    
    // Calculate additional metrics
    const totalPosts = Object.values(performance.by_content_type)
      .reduce((sum, type) => sum + type.count, 0);
    
    const avgEngagement = Object.values(performance.by_content_type)
      .reduce((sum, type) => sum + (type.avg_engagement * type.count), 0) / totalPosts;
    
    // Convert content type data to arrays for easier charting
    const contentTypeData = Object.entries(performance.by_content_type).map(([type, data]) => ({
      content_type: type,
      count: data.count,
      avg_engagement: data.avg_engagement,
      percentage: Math.round((data.count / totalPosts) * 100),
    }));
    
    // Sort by engagement performance
    const sortedByEngagement = [...contentTypeData].sort((a, b) => b.avg_engagement - a.avg_engagement);
    const sortedByVolume = [...contentTypeData].sort((a, b) => b.count - a.count);
    
    // Find best and worst performing content types
    const bestPerforming = sortedByEngagement[0] || null;
    const worstPerforming = sortedByEngagement[sortedByEngagement.length - 1] || null;
    
    // Calculate engagement distribution
    const engagementRanges = {
      high: 0, // >avgEngagement * 1.5
      medium: 0, // avgEngagement * 0.5 to avgEngagement * 1.5
      low: 0, // <avgEngagement * 0.5
    };
    
    for (const post of performance.top_performing_posts) {
      if (post.total_engagement > avgEngagement * 1.5) {
        engagementRanges.high++;
      } else if (post.total_engagement > avgEngagement * 0.5) {
        engagementRanges.medium++;
      } else {
        engagementRanges.low++;
      }
    }
    
    // Extract trending hashtags from captions
    const hashtagRegex = /#[\w]+/g;
    const hashtagCounts: Record<string, number> = {};
    
    for (const post of performance.top_performing_posts) {
      if (post.caption) {
        const hashtags = post.caption.match(hashtagRegex) || [];
        for (const hashtag of hashtags) {
          hashtagCounts[hashtag.toLowerCase()] = (hashtagCounts[hashtag.toLowerCase()] || 0) + 1;
        }
      }
    }
    
    const topHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([hashtag, count]) => ({ hashtag, count }));
    
    return NextResponse.json({
      analysis_period: {
        days,
        total_posts: totalPosts,
        avg_engagement: Math.round(avgEngagement),
      },
      content_performance: {
        by_content_type: performance.by_content_type,
        content_type_data: contentTypeData,
        top_performing_posts: performance.top_performing_posts,
      },
      insights: {
        best_performing_type: bestPerforming,
        worst_performing_type: worstPerforming,
        most_used_type: sortedByVolume[0] || null,
        engagement_distribution: engagementRanges,
        top_hashtags: topHashtags,
      },
      recommendations: {
        focus_on_type: bestPerforming?.content_type,
        reduce_type: worstPerforming?.avg_engagement < avgEngagement * 0.3 ? worstPerforming?.content_type : null,
        optimal_posting_frequency: Math.round(totalPosts / days),
      },
    });
  } catch (error: any) {
    console.error('Get content performance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch content performance' },
      { status: 500 }
    );
  }
}
