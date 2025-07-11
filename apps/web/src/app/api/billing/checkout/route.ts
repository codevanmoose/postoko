import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@postoko/auth';
import { subscriptionManager } from '@postoko/billing';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    
    const { user } = authResult;
    const body = await request.json();
    
    const { price_id, success_url, cancel_url, trial_days, coupon } = body;
    
    if (!price_id || !success_url || !cancel_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user email from database
    const userEmail = user.email || '';
    
    const url = await subscriptionManager.createCheckoutSession({
      user_id: user.id,
      email: userEmail,
      price_id,
      success_url,
      cancel_url,
      trial_days,
      coupon,
    });
    
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}