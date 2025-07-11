# Billing Module

The Billing module provides comprehensive subscription management, payment processing, and usage tracking for Postoko. It integrates with Stripe for secure payment handling and provides a complete billing dashboard.

## Features

- **Subscription Management**: Three tiers (Free, Pro, Enterprise) with Stripe integration
- **Payment Processing**: Secure checkout with Stripe, multiple payment methods
- **Usage Tracking**: Monitor posts, AI generations, platforms, and storage
- **Customer Portal**: Self-service subscription management via Stripe
- **Webhook Handling**: Automatic subscription sync with idempotency
- **Invoice Management**: Automatic invoice storage and retrieval

## Installation

```bash
pnpm add @postoko/billing
```

## Usage

### Basic Setup

Wrap your app with the BillingProvider:

```tsx
import { BillingProvider } from '@postoko/billing';

function App() {
  return (
    <AuthProvider>
      <BillingProvider>
        {children}
      </BillingProvider>
    </AuthProvider>
  );
}
```

### Using Billing Hooks

```tsx
import { useBilling } from '@postoko/billing';

function SubscriptionStatus() {
  const { subscription, usage, checkUsage } = useBilling();
  
  // Check subscription tier
  const tier = subscription?.tier || 'free';
  
  // Check if user can perform action
  const canPost = checkUsage('posts_per_month');
  const canAddPlatform = checkUsage('platforms');
  
  return (
    <div>
      <p>Current Plan: {tier}</p>
      <p>Posts Used: {usage?.posts_count || 0}</p>
      {!canPost && <p>You've reached your post limit!</p>}
    </div>
  );
}
```

### Creating Checkout Session

```tsx
import { useBilling } from '@postoko/billing';

function UpgradeButton() {
  const { createCheckoutSession } = useBilling();
  
  const handleUpgrade = async () => {
    try {
      const url = await createCheckoutSession('pro', 'month');
      window.location.href = url;
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };
  
  return <button onClick={handleUpgrade}>Upgrade to Pro</button>;
}
```

### Pricing Table Component

```tsx
import { PricingTable } from '@postoko/billing';

function PricingPage() {
  return <PricingTable />;
}
```

## API Routes

### Required API Routes

Create these API routes in your Next.js app:

#### Checkout
```typescript
// app/api/billing/checkout/route.ts
import { requireAuth } from '@postoko/auth';
import { subscriptionManager } from '@postoko/billing';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  // ... handle checkout
}
```

#### Webhooks
```typescript
// app/api/billing/webhooks/stripe/route.ts
import { webhookHandler } from '@postoko/billing';

export async function POST(request: Request) {
  // Verify webhook signature
  // Handle webhook events
}
```

## Environment Variables

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_...
```

## Database Schema

The module creates five tables:
- `subscriptions` - User subscription records
- `usage_tracking` - Period-based usage metrics
- `invoices` - Stripe invoice records
- `payment_methods` - Stored payment methods
- `stripe_events` - Webhook event tracking

## Subscription Tiers

### Free
- 1 social platform
- 30 posts per month
- Basic AI captions
- 7-day post history
- 1GB storage

### Pro ($29/month)
- 3 social platforms
- Unlimited posts
- Advanced AI captions
- 30-day post history
- 10GB storage
- Analytics dashboard
- Priority support

### Enterprise ($99/month)
- Unlimited platforms
- Unlimited posts
- 100 AI image generations/month
- Custom AI training
- 1-year post history
- 100GB storage
- API access
- Team collaboration
- Dedicated support

## Webhook Events

The module handles these Stripe events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_method.attached`

## Usage Tracking

Track usage with the `usageTracker`:

```typescript
import { usageTracker } from '@postoko/billing';

// Increment posts count
await usageTracker.incrementUsage(userId, 'posts_count', 1);

// Update platforms count
await usageTracker.updatePlatformsCount(userId, 2);

// Check if limit reached
const canPost = await usageTracker.checkLimit(userId, 'posts_count', 30);
```

## Security

- All payment processing handled by Stripe
- Webhook signatures verified
- Idempotent webhook processing
- Row-level security on all tables
- No raw card data stored

## Testing

Use Stripe test mode with test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication: `4000 0025 0000 3155`

## License

MIT