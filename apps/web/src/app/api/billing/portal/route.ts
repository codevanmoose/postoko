import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth/lib/api-middleware';
import { subscriptionManager } from '@postoko/billing';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    
    const { return_url } = body;
    
    if (!return_url) {
      return NextResponse.json(
        { error: 'Missing return_url' },
        { status: 400 }
      );
    }
    
    // Get user's subscription
    const subscription = await subscriptionManager.getSubscription(user.id);
    
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }
    
    const url = await subscriptionManager.createPortalSession({
      customer_id: subscription.stripe_customer_id,
      return_url,
    });
    
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}