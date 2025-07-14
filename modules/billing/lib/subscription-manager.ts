import { createClient } from '@postoko/database';
import { getStripeServer, getPriceId } from './stripe-client';
import type { 
  Subscription, 
  SubscriptionTier, 
  CreateCheckoutSessionOptions,
  CustomerPortalOptions,
  PaymentInterval 
} from '../types';

const supabase = createClient();
// Lazy load stripe to avoid errors during build
let stripe: any;

export const subscriptionManager = {
  /**
   * Get subscription for a user
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  },

  /**
   * Create or get Stripe customer
   */
  async getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
    // Check if user already has a Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (user?.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    // Create new Stripe customer
    if (!stripe) stripe = getStripeServer();
    const customer = await stripe.customers.create({
      email,
      metadata: {
        user_id: userId,
      },
    });

    // Update user with Stripe customer ID
    await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({ stripe_customer_id: customer.id })
      .eq('user_id', userId);

    return customer.id;
  },

  /**
   * Create checkout session
   */
  async createCheckoutSession(options: CreateCheckoutSessionOptions): Promise<string> {
    const customerId = await this.getOrCreateStripeCustomer(options.user_id, options.email);

    const sessionOptions: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: options.price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: options.success_url,
      cancel_url: options.cancel_url,
      metadata: {
        user_id: options.user_id,
      },
      subscription_data: {
        metadata: {
          user_id: options.user_id,
        },
      },
      allow_promotion_codes: true,
    };

    if (options.trial_days) {
      sessionOptions.subscription_data.trial_period_days = options.trial_days;
    }

    if (options.coupon) {
      sessionOptions.discounts = [{
        coupon: options.coupon,
      }];
    }

    if (!stripe) stripe = getStripeServer();
    const session = await stripe.checkout.sessions.create(sessionOptions);
    return session.url!;
  },

  /**
   * Create customer portal session
   */
  async createPortalSession(options: CustomerPortalOptions): Promise<string> {
    if (!stripe) stripe = getStripeServer();
    const session = await stripe.billingPortal.sessions.create({
      customer: options.customer_id,
      return_url: options.return_url,
    });

    return session.url;
  },

  /**
   * Update subscription in database
   */
  async updateSubscription(
    userId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getSubscription(userId);
    if (!subscription?.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }

    // Cancel at period end in Stripe
    if (!stripe) stripe = getStripeServer();
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update local record
    await this.updateSubscription(userId, {
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
    });
  },

  /**
   * Resume canceled subscription
   */
  async resumeSubscription(userId: string): Promise<void> {
    const subscription = await this.getSubscription(userId);
    if (!subscription?.stripe_subscription_id) {
      throw new Error('No subscription found');
    }

    // Resume in Stripe
    if (!stripe) stripe = getStripeServer();
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Update local record
    await this.updateSubscription(userId, {
      cancel_at_period_end: false,
      canceled_at: undefined,
    });
  },

  /**
   * Sync subscription from Stripe
   */
  async syncSubscriptionFromStripe(stripeSubscriptionId: string): Promise<void> {
    if (!stripe) stripe = getStripeServer();
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    
    // Determine tier from price ID
    let tier: SubscriptionTier = 'free';
    const priceId = stripeSubscription.items.data[0]?.price.id;
    
    if (priceId) {
      if (priceId.includes('pro')) {
        tier = 'pro';
      } else if (priceId.includes('enterprise')) {
        tier = 'enterprise';
      }
    }

    const updates: Partial<Subscription> = {
      status: stripeSubscription.status as any,
      tier,
      stripe_price_id: priceId,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    };

    if (stripeSubscription.trial_start) {
      updates.trial_start = new Date(stripeSubscription.trial_start * 1000).toISOString();
    }
    if (stripeSubscription.trial_end) {
      updates.trial_end = new Date(stripeSubscription.trial_end * 1000).toISOString();
    }

    // Update subscription
    const userId = stripeSubscription.metadata.user_id;
    if (userId) {
      await this.updateSubscription(userId, updates);
    }
  },

  /**
   * Check if user can access a feature based on their tier
   */
  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;

    // Define feature access by tier
    const featureAccess: Record<string, SubscriptionTier[]> = {
      'multiple_platforms': ['pro', 'enterprise'],
      'unlimited_posts': ['pro', 'enterprise'],
      'ai_generation': ['enterprise'],
      'api_access': ['enterprise'],
      'analytics': ['pro', 'enterprise'],
      'team_collaboration': ['enterprise'],
    };

    const allowedTiers = featureAccess[feature] || [];
    return allowedTiers.includes(subscription.tier);
  },
};