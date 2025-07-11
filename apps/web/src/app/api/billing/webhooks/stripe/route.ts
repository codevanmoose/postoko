import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@postoko/billing/lib/stripe-client';
import { webhookHandler } from '@postoko/billing/lib/webhook-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'No signature header' },
        { status: 400 }
      );
    }
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    let event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Handle the event
    try {
      await webhookHandler.handleWebhookEvent(event);
      return NextResponse.json({ received: true });
    } catch (err: any) {
      console.error('Webhook handler error:', err);
      // Return 200 to prevent Stripe from retrying
      // The error is logged and stored in the database
      return NextResponse.json({ received: true, error: err.message });
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Stripe webhooks need raw body
export const runtime = 'nodejs';