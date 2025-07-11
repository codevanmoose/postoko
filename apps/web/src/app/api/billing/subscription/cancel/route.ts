import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { subscriptionManager } from '@postoko/billing';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    
    await subscriptionManager.cancelSubscription(user.id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}