// Billing Module Exports

// Context and Provider
export { BillingProvider, useBilling } from './context/billing-context';

// Components
export { PricingTable } from './components/pricing-table';

// Types
export * from './types';

// Libraries
export { subscriptionManager } from './lib/subscription-manager';
export { usageTracker } from './lib/usage-tracker';
export { invoiceManager } from './lib/invoice-manager';
export { webhookHandler } from './lib/webhook-handler';
export { getStripeClient, formatAmount } from './lib/stripe-client';

// Module metadata
export const MODULE_NAME = 'billing';
export const MODULE_VERSION = '0.1.0';