import { createServerClient } from '@postoko/database';
import type { Invoice } from '../types';
import type Stripe from 'stripe';

export const invoiceManager = {
  /**
   * Create invoice record from Stripe invoice
   */
  async createInvoiceRecord(stripeInvoice: Stripe.Invoice): Promise<void> {
    const supabase = createServerClient();
    
    // Get user ID from customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', stripeInvoice.customer)
      .single();
    
    if (!subscription) {
      throw new Error('No subscription found for customer');
    }
    
    // Create invoice record
    await supabase
      .from('invoices')
      .insert({
        user_id: subscription.user_id,
        stripe_invoice_id: stripeInvoice.id,
        stripe_invoice_url: stripeInvoice.hosted_invoice_url,
        stripe_pdf_url: stripeInvoice.invoice_pdf,
        amount_paid: stripeInvoice.amount_paid,
        amount_due: stripeInvoice.amount_due,
        currency: stripeInvoice.currency,
        status: stripeInvoice.status || 'draft',
        period_start: stripeInvoice.period_start 
          ? new Date(stripeInvoice.period_start * 1000).toISOString() 
          : null,
        period_end: stripeInvoice.period_end 
          ? new Date(stripeInvoice.period_end * 1000).toISOString() 
          : null,
      });
  },

  /**
   * Get invoices for a user
   */
  async getInvoices(userId: string): Promise<Invoice[]> {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Get a specific invoice
   */
  async getInvoice(userId: string, invoiceId: string): Promise<Invoice | null> {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .eq('id', invoiceId)
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
   * Update invoice status
   */
  async updateInvoiceStatus(stripeInvoiceId: string, status: string): Promise<void> {
    const supabase = createServerClient();
    
    await supabase
      .from('invoices')
      .update({ status })
      .eq('stripe_invoice_id', stripeInvoiceId);
  },
};