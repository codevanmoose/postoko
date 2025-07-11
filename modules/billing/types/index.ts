// Subscription Types
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
export type PaymentInterval = 'month' | 'year';

// Tier Limits
export interface TierLimits {
  posts_per_month: number;
  platforms: number;
  ai_generations: number;
  storage_gb: number;
  team_members: number;
  api_access: boolean;
  analytics: boolean;
  priority_support: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    posts_per_month: 30,
    platforms: 1,
    ai_generations: 0,
    storage_gb: 1,
    team_members: 1,
    api_access: false,
    analytics: false,
    priority_support: false,
  },
  pro: {
    posts_per_month: -1, // unlimited
    platforms: 3,
    ai_generations: 0,
    storage_gb: 10,
    team_members: 1,
    api_access: false,
    analytics: true,
    priority_support: true,
  },
  enterprise: {
    posts_per_month: -1, // unlimited
    platforms: -1, // unlimited
    ai_generations: 100,
    storage_gb: 100,
    team_members: -1, // unlimited
    api_access: true,
    analytics: true,
    priority_support: true,
  },
};

// Pricing
export interface PricingInfo {
  monthly: number; // in cents
  yearly: number; // in cents
  currency: string;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

export const PRICING: Record<Exclude<SubscriptionTier, 'free'>, PricingInfo> = {
  pro: {
    monthly: 2900,
    yearly: 29900, // 2 months free
    currency: 'usd',
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
    stripe_price_id_yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
  enterprise: {
    monthly: 9900,
    yearly: 99900, // 2 months free
    currency: 'usd',
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    stripe_price_id_yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
  },
};

// Database Models
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  posts_count: number;
  ai_generations_count: number;
  platforms_connected: number;
  storage_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  stripe_invoice_url?: string;
  stripe_pdf_url?: string;
  amount_paid: number; // in cents
  amount_due: number;
  currency: string;
  status: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: string;
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
}

// Stripe Types
export interface CreateCheckoutSessionOptions {
  user_id: string;
  email: string;
  price_id: string;
  success_url: string;
  cancel_url: string;
  trial_days?: number;
  coupon?: string;
}

export interface CustomerPortalOptions {
  customer_id: string;
  return_url: string;
}

// Context Types
export interface BillingContextValue {
  subscription: Subscription | null;
  usage: UsageTracking | null;
  loading: boolean;
  error: Error | null;
  createCheckoutSession: (tier: Exclude<SubscriptionTier, 'free'>, interval: PaymentInterval) => Promise<string>;
  createPortalSession: () => Promise<string>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkUsage: (resource: keyof TierLimits) => boolean;
}

// API Response Types
export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}

export interface PortalSessionResponse {
  url: string;
}

export interface UsageResponse {
  current: UsageTracking;
  limits: TierLimits;
  percentages: {
    posts: number;
    ai_generations: number;
    storage: number;
    platforms: number;
  };
}