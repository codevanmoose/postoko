'use client';

import { useState } from 'react';
import { Button } from '../../../apps/web/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../apps/web/src/components/ui/card';
import { useBilling } from '../context/billing-context';
import { TIER_LIMITS, PRICING } from '../types';
import type { SubscriptionTier, PaymentInterval } from '../types';

const tiers = [
  {
    id: 'free' as SubscriptionTier,
    name: 'Free',
    description: 'Perfect for getting started',
    features: [
      '1 social platform',
      '30 posts per month',
      'Basic AI captions',
      '7-day post history',
      '1GB storage',
    ],
  },
  {
    id: 'pro' as SubscriptionTier,
    name: 'Pro',
    description: 'For serious content creators',
    features: [
      '3 social platforms',
      'Unlimited posts',
      'Advanced AI captions',
      '30-day post history',
      '10GB storage',
      'Analytics dashboard',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'enterprise' as SubscriptionTier,
    name: 'Enterprise',
    description: 'For teams and agencies',
    features: [
      'Unlimited platforms',
      'Unlimited posts',
      '100 AI image generations/month',
      'Custom AI training',
      '1-year post history',
      '100GB storage',
      'API access',
      'Team collaboration',
      'Dedicated support',
    ],
  },
];

export function PricingTable() {
  const { subscription, createCheckoutSession } = useBilling();
  const [interval, setInterval] = useState<PaymentInterval>('month');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (tier === 'free') return;

    try {
      setLoading(tier);
      const url = await createCheckoutSession(tier, interval);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (tier: SubscriptionTier): string => {
    if (tier === 'free') return '$0';
    
    const pricing = PRICING[tier];
    const amount = interval === 'month' ? pricing.monthly : pricing.yearly;
    const price = amount / 100;
    
    if (interval === 'year') {
      const monthlyPrice = pricing.yearly / 12 / 100;
      return `$${monthlyPrice.toFixed(2)}/mo`;
    }
    
    return `$${price}/${interval}`;
  };

  const getSavings = (tier: Exclude<SubscriptionTier, 'free'>): string | null => {
    if (interval !== 'year') return null;
    
    const pricing = PRICING[tier];
    const yearlySavings = (pricing.monthly * 12) - pricing.yearly;
    return `Save $${(yearlySavings / 100).toFixed(0)}/year`;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setInterval('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'month'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'year'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">Save 17%</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.id}
            className={`relative ${
              tier.popular
                ? 'border-blue-500 shadow-lg scale-105 lg:scale-110 z-10'
                : ''
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">{getPrice(tier.id)}</span>
                {tier.id !== 'free' && getSavings(tier.id as any) && (
                  <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                    {getSavings(tier.id as any)}
                  </span>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button
                className="w-full"
                variant={tier.popular ? 'default' : 'outline'}
                disabled={
                  subscription?.tier === tier.id ||
                  loading !== null ||
                  (tier.id === 'free' && subscription?.tier !== 'free')
                }
                onClick={() => handleSubscribe(tier.id)}
              >
                {loading === tier.id
                  ? 'Loading...'
                  : subscription?.tier === tier.id
                  ? 'Current Plan'
                  : tier.id === 'free'
                  ? 'Downgrade'
                  : 'Get Started'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}