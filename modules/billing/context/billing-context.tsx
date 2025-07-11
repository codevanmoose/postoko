'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@postoko/auth';
import { subscriptionManager } from '../lib/subscription-manager';
import { usageTracker } from '../lib/usage-tracker';
import { getPriceId } from '../lib/stripe-client';
import type { 
  BillingContextValue, 
  Subscription, 
  UsageTracking,
  SubscriptionTier,
  PaymentInterval,
  TierLimits,
  TIER_LIMITS
} from '../types';

const BillingContext = createContext<BillingContextValue | undefined>(undefined);

// Import tier limits
import { TIER_LIMITS as tierLimits } from '../types';

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      loadBillingData();
    } else {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
    }
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load subscription and usage in parallel
      const [sub, use] = await Promise.all([
        subscriptionManager.getSubscription(user.id),
        usageTracker.getCurrentPeriodUsage(user.id),
      ]);

      setSubscription(sub);
      setUsage(use);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (
    tier: Exclude<SubscriptionTier, 'free'>, 
    interval: PaymentInterval
  ): Promise<string> => {
    if (!user) throw new Error('No user');

    try {
      const priceId = getPriceId(tier, interval);
      
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/settings/billing?success=true`,
          cancel_url: `${window.location.origin}/settings/billing?canceled=true`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      return url;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const createPortalSession = async (): Promise<string> => {
    if (!user || !subscription?.stripe_customer_id) {
      throw new Error('No subscription found');
    }

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          return_url: `${window.location.origin}/settings/billing`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      return url;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const cancelSubscription = async () => {
    if (!user) throw new Error('No user');

    try {
      const response = await fetch('/api/billing/subscription/cancel', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await loadBillingData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const resumeSubscription = async () => {
    if (!user) throw new Error('No user');

    try {
      const response = await fetch('/api/billing/subscription/resume', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resume subscription');
      }

      await loadBillingData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const refreshSubscription = async () => {
    await loadBillingData();
  };

  const checkUsage = (resource: keyof TierLimits): boolean => {
    if (!subscription || !usage) return false;

    const limits = tierLimits[subscription.tier];
    
    switch (resource) {
      case 'posts_per_month':
        return limits.posts_per_month === -1 || usage.posts_count < limits.posts_per_month;
      case 'platforms':
        return limits.platforms === -1 || usage.platforms_connected < limits.platforms;
      case 'ai_generations':
        return limits.ai_generations === -1 || usage.ai_generations_count < limits.ai_generations;
      case 'storage_gb':
        const usageGB = usage.storage_bytes / (1024 * 1024 * 1024);
        return limits.storage_gb === -1 || usageGB < limits.storage_gb;
      default:
        // For boolean features, just check if the tier has access
        return limits[resource] === true || limits[resource] === -1;
    }
  };

  const value: BillingContextValue = {
    subscription,
    usage,
    loading,
    error,
    createCheckoutSession,
    createPortalSession,
    cancelSubscription,
    resumeSubscription,
    refreshSubscription,
    checkUsage,
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}