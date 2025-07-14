import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
let stripeServer: Stripe | null = null;

export function getStripeServer() {
  if (!stripeServer) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn('STRIPE_SECRET_KEY is not set - Stripe features will be disabled');
      // Return null to indicate Stripe is not available
      return null as any;
    }
    
    stripeServer = new Stripe(secretKey, {
      apiVersion: '2023-08-16',
      typescript: true,
    });
  }
  
  return stripeServer;
}

// Client-side Stripe instance
let stripePromise: Promise<any> | null = null;

export function getStripeClient() {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
}

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripeServer();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// Helper to format amount for display
export function formatAmount(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

// Helper to get price ID based on tier and interval
export function getPriceId(tier: 'pro' | 'enterprise', interval: 'month' | 'year'): string {
  const priceIds: Record<string, string> = {
    'pro_month': process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    'pro_year': process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
    'enterprise_month': process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    'enterprise_year': process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
  };
  
  const key = `${tier}_${interval}`;
  const priceId = priceIds[key];
  
  if (!priceId) {
    throw new Error(`Price ID not found for ${tier} ${interval}`);
  }
  
  return priceId;
}