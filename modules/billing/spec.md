# Billing Module Specification

## Overview
The Billing module handles all payment processing, subscription management, and usage tracking for Postoko. It integrates with Stripe for payment processing and provides a comprehensive billing dashboard for users to manage their subscriptions.

## Features

### 1. Subscription Tiers
- **Free Tier**
  - 1 connected social platform
  - 30 posts per month
  - Basic AI captions
  - 7-day post history
  
- **Pro Tier ($29/month)**
  - 3 connected social platforms
  - Unlimited posts
  - Advanced AI captions with hashtags
  - 30-day post history
  - Priority support
  - Analytics dashboard
  
- **Enterprise Tier ($99/month)**
  - Unlimited social platforms
  - Unlimited posts
  - AI image generation (100/month)
  - Custom AI training
  - 1-year post history
  - API access
  - Dedicated support
  - Team collaboration

### 2. Payment Processing
- **Stripe Integration**
  - Secure payment processing
  - PCI compliance
  - Multiple payment methods (cards, bank transfers)
  
- **Checkout Flow**
  - Embedded Stripe Checkout
  - Pricing table display
  - Coupon/promo code support
  - Tax calculation
  
- **Customer Portal**
  - Update payment methods
  - Download invoices
  - Cancel/resume subscriptions
  - Update billing details

### 3. Usage Tracking
- **Resource Limits**
  - Posts per month
  - Connected platforms
  - AI generations
  - Storage usage
  
- **Usage Alerts**
  - 80% usage warning
  - Limit reached notifications
  - Upgrade prompts

### 4. Billing Management
- **Invoice Management**
  - Automatic invoice generation
  - PDF downloads
  - Email receipts
  
- **Payment History**
  - Transaction log
  - Payment methods
  - Refund tracking

### 5. Webhook Handling
- **Subscription Events**
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
  
- **Payment Events**
  - payment_intent.succeeded
  - payment_intent.failed
  - charge.refunded

## Database Schema

### subscriptions table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### usage_tracking table
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  posts_count INTEGER DEFAULT 0,
  ai_generations_count INTEGER DEFAULT 0,
  platforms_connected INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);
```

### invoices table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_invoice_url TEXT,
  stripe_pdf_url TEXT,
  amount_paid INTEGER NOT NULL, -- in cents
  amount_due INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### payment_methods table
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'card', 'bank_account', etc.
  last4 TEXT,
  brand TEXT, -- 'visa', 'mastercard', etc.
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### stripe_events table (for idempotency)
```sql
CREATE TABLE stripe_events (
  id TEXT PRIMARY KEY, -- Stripe event ID
  type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

## API Endpoints

### Subscription Management
- `GET /api/billing/subscription` - Get current subscription
- `POST /api/billing/subscription/create` - Create subscription checkout session
- `POST /api/billing/subscription/update` - Update subscription tier
- `POST /api/billing/subscription/cancel` - Cancel subscription
- `POST /api/billing/subscription/resume` - Resume canceled subscription

### Customer Portal
- `POST /api/billing/portal` - Create customer portal session

### Usage
- `GET /api/billing/usage` - Get current period usage
- `GET /api/billing/usage/history` - Get usage history

### Invoices
- `GET /api/billing/invoices` - List all invoices
- `GET /api/billing/invoices/:id` - Get specific invoice

### Webhooks
- `POST /api/billing/webhooks/stripe` - Stripe webhook endpoint

### Checkout
- `POST /api/billing/checkout` - Create checkout session
- `GET /api/billing/checkout/success` - Checkout success callback
- `GET /api/billing/checkout/cancel` - Checkout cancel callback

## Module Structure
```
modules/billing/
├── package.json
├── index.ts
├── types/
│   └── index.ts
├── lib/
│   ├── stripe-client.ts
│   ├── subscription-manager.ts
│   ├── usage-tracker.ts
│   ├── webhook-handler.ts
│   └── invoice-manager.ts
├── hooks/
│   ├── use-subscription.ts
│   ├── use-usage.ts
│   └── use-invoices.ts
├── components/
│   ├── pricing-table.tsx
│   ├── subscription-card.tsx
│   ├── usage-meter.tsx
│   └── invoice-list.tsx
└── context/
    └── billing-context.tsx
```

## Integration Points

### With Auth Module
- Link Stripe customer to user on signup
- Require auth for all billing endpoints
- Clean up Stripe data on account deletion

### With Settings Module
- Respect notification preferences for billing emails
- Show subscription tier in account settings

### With Other Modules
- **Queue**: Enforce post limits based on tier
- **AI**: Track and limit AI generations
- **Social**: Limit connected platforms by tier
- **Analytics**: Premium features for pro/enterprise

## Security Considerations
- Verify webhook signatures
- Sanitize all Stripe data before storage
- Use Stripe's secure tokenization
- Never store raw card numbers
- Implement idempotency for webhooks
- Rate limit billing endpoints
- Audit trail for all billing changes

## Stripe Configuration

### Products & Prices
```javascript
// Products
const products = {
  free: { name: 'Free', description: 'Get started with Postoko' },
  pro: { name: 'Pro', description: 'For serious content creators' },
  enterprise: { name: 'Enterprise', description: 'For teams and agencies' }
};

// Prices
const prices = {
  pro_monthly: { amount: 2900, interval: 'month' },
  pro_yearly: { amount: 29900, interval: 'year' }, // 2 months free
  enterprise_monthly: { amount: 9900, interval: 'month' },
  enterprise_yearly: { amount: 99900, interval: 'year' } // 2 months free
};
```

### Webhook Events to Handle
- customer.created
- customer.updated
- customer.deleted
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- customer.subscription.trial_will_end
- invoice.created
- invoice.finalized
- invoice.paid
- invoice.payment_failed
- payment_method.attached
- payment_method.detached

## Testing Requirements
- Unit tests for subscription calculations
- Integration tests with Stripe test mode
- Webhook signature verification tests
- Usage tracking accuracy tests
- E2E tests for complete billing flows
- Test subscription upgrades/downgrades
- Test payment failures and retries

## Performance Considerations
- Cache subscription status
- Batch usage updates
- Async webhook processing
- Optimize invoice queries
- Use database indexes on stripe_ids

## Error Handling
- Graceful degradation if Stripe is down
- Retry failed webhook events
- Clear error messages for payment failures
- Fallback to cached subscription data
- Email notifications for critical failures

## Compliance
- PCI compliance via Stripe
- GDPR compliance for invoice data
- Tax calculation per region
- Proper invoice formatting
- Cancellation rights display