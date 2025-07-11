import { createServerClient } from '@postoko/database';
import { subscriptionManager } from './subscription-manager';
import { invoiceManager } from './invoice-manager';
import type Stripe from 'stripe';

export const webhookHandler = {
  /**
   * Check if event was already processed (idempotency)
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    const supabase = createServerClient();
    
    const { data } = await supabase
      .from('stripe_events')
      .select('processed')
      .eq('id', eventId)
      .single();
    
    return data?.processed || false;
  },

  /**
   * Mark event as processed
   */
  async markEventProcessed(eventId: string, type: string): Promise<void> {
    const supabase = createServerClient();
    
    await supabase
      .from('stripe_events')
      .upsert({
        id: eventId,
        type,
        processed: true,
        processed_at: new Date().toISOString(),
      });
  },

  /**
   * Mark event as failed
   */
  async markEventFailed(eventId: string, type: string, error: string): Promise<void> {
    const supabase = createServerClient();
    
    await supabase
      .from('stripe_events')
      .upsert({
        id: eventId,
        type,
        processed: false,
        error,
      });
  },

  /**
   * Handle customer.subscription.created
   */
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.user_id;
    if (!userId) {
      throw new Error('No user_id in subscription metadata');
    }

    await subscriptionManager.updateSubscription(userId, {
      stripe_subscription_id: subscription.id,
      status: subscription.status as any,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  },

  /**
   * Handle customer.subscription.updated
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await subscriptionManager.syncSubscriptionFromStripe(subscription.id);
  },

  /**
   * Handle customer.subscription.deleted
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.user_id;
    if (!userId) return;

    await subscriptionManager.updateSubscription(userId, {
      status: 'canceled',
      tier: 'free',
      canceled_at: new Date().toISOString(),
    });
  },

  /**
   * Handle invoice.payment_succeeded
   */
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription || !invoice.customer) return;
    
    await invoiceManager.createInvoiceRecord(invoice);
  },

  /**
   * Handle invoice.payment_failed
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription || !invoice.customer) return;
    
    // Update subscription status to past_due
    const subscription = invoice.subscription as string;
    const supabase = createServerClient();
    
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscription);
  },

  /**
   * Handle customer.created
   */
  async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    const userId = customer.metadata.user_id;
    if (!userId) return;

    const supabase = createServerClient();
    
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
  },

  /**
   * Handle payment_method.attached
   */
  async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    if (!paymentMethod.customer) return;
    
    const supabase = createServerClient();
    
    // Get user ID from customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', paymentMethod.customer)
      .single();
    
    if (!subscription) return;
    
    // Store payment method
    await supabase
      .from('payment_methods')
      .insert({
        user_id: subscription.user_id,
        stripe_payment_method_id: paymentMethod.id,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4,
        brand: paymentMethod.card?.brand,
        exp_month: paymentMethod.card?.exp_month,
        exp_year: paymentMethod.card?.exp_year,
      });
  },

  /**
   * Main webhook handler
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    // Check idempotency
    const processed = await this.isEventProcessed(event.id);
    if (processed) {
      console.log(`Event ${event.id} already processed`);
      return;
    }

    try {
      switch (event.type) {
        case 'customer.created':
          await this.handleCustomerCreated(event.data.object as Stripe.Customer);
          break;
          
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
          
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
          
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Mark as processed
      await this.markEventProcessed(event.id, event.type);
    } catch (error: any) {
      console.error(`Error handling webhook ${event.type}:`, error);
      await this.markEventFailed(event.id, event.type, error.message);
      throw error;
    }
  },
};