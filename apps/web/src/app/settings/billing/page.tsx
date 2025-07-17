'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@postoko/auth';
import { useBilling, PricingTable, formatAmount, TIER_LIMITS } from '@postoko/billing';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

function BillingPageContent() {
  useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, usage, loading, createPortalSession } = useBilling();

  useEffect(() => {
    // Handle success/cancel from checkout
    if (searchParams.get('success') === 'true') {
      // Show success message
      setTimeout(() => {
        router.replace('/settings/billing');
      }, 3000);
    }
  }, [searchParams, router]);

  const handleManageSubscription = async () => {
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      alert('Failed to open billing portal. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Spinner />
      </Container>
    );
  }

  const limits = subscription ? TIER_LIMITS[subscription.tier] : TIER_LIMITS.free;

  return (
    <Container className="py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Billing</h1>
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Back
          </Button>
        </div>

        {searchParams.get('success') === 'true' && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <p className="text-center font-medium text-green-700 dark:text-green-300">
                🎉 Subscription updated successfully! Refreshing...
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 md:grid-cols-3 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg capitalize">
                    {subscription?.tier || 'Free'} Plan
                  </p>
                  {subscription?.current_period_end && (
                    <p className="text-sm text-gray-500">
                      {subscription.cancel_at_period_end
                        ? `Cancels on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                        : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                {subscription?.tier !== 'free' && (
                  <Button onClick={handleManageSubscription} variant="outline">
                    Manage Subscription
                  </Button>
                )}
              </div>

              {subscription?.cancel_at_period_end && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your subscription is set to cancel at the end of the current billing period.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Plan Features</h4>
                <ul className="space-y-2 text-sm">
                  <li>• {limits.posts_per_month === -1 ? 'Unlimited' : limits.posts_per_month} posts per month</li>
                  <li>• {limits.platforms === -1 ? 'Unlimited' : limits.platforms} connected platforms</li>
                  <li>• {limits.storage_gb}GB storage</li>
                  {limits.ai_generations > 0 && (
                    <li>• {limits.ai_generations} AI generations per month</li>
                  )}
                  {limits.analytics && <li>• Analytics dashboard</li>}
                  {limits.api_access && <li>• API access</li>}
                  {limits.priority_support && <li>• Priority support</li>}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
              <CardDescription>
                {usage ? new Date(usage.period_start).toLocaleDateString() : ''} - 
                {usage ? new Date(usage.period_end).toLocaleDateString() : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Posts</span>
                  <span>{usage?.posts_count || 0} / {limits.posts_per_month === -1 ? '∞' : limits.posts_per_month}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${limits.posts_per_month === -1 ? 0 : Math.min(100, ((usage?.posts_count || 0) / limits.posts_per_month) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {limits.ai_generations > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>AI Generations</span>
                    <span>{usage?.ai_generations_count || 0} / {limits.ai_generations}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, ((usage?.ai_generations_count || 0) / limits.ai_generations) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Platforms</span>
                  <span>{usage?.platforms_connected || 0} / {limits.platforms === -1 ? '∞' : limits.platforms}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${limits.platforms === -1 ? 0 : Math.min(100, ((usage?.platforms_connected || 0) / limits.platforms) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
          <PricingTable />
        </div>
      </div>
    </Container>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <Container className="flex items-center justify-center min-h-screen">
        <Spinner />
      </Container>
    }>
      <BillingPageContent />
    </Suspense>
  );
}