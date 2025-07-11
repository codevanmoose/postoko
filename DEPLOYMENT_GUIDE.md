# 🚀 Postoko Deployment Guide

## Overview

This guide will walk you through deploying Postoko to production. The platform is 100% feature-complete and ready for immediate deployment.

## Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account with project created
- Vercel account (recommended hosting)
- Domain name (optional but recommended)

## 🔧 Step 1: Platform Deployment

### Deploy to Vercel (Recommended)

1. **Clone and prepare the repository**
   ```bash
   git clone <repository-url>
   cd postoko
   pnpm install
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy to production
   vercel --prod
   ```

3. **Configure custom domain (optional)**
   - Add your domain in Vercel dashboard
   - Configure DNS settings
   - SSL certificates are automatic

### Alternative: Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
pnpm build
netlify deploy --prod --dir=apps/web/out
```

## 🗄️ Step 2: Database Setup

### Configure Supabase

1. **Run database migrations**
   ```bash
   # In Supabase dashboard, go to SQL Editor and run:
   # - 00001_auth_tables.sql
   # - 00002_settings_tables.sql  
   # - 00003_billing_tables.sql
   # - 00004_drive_tables.sql
   # - 00005_social_tables.sql
   # - 00006_queue_tables.sql
   # - 00007_ai_tables.sql
   ```

2. **Verify RLS policies**
   - Ensure Row Level Security is enabled on all tables
   - Test authentication and data access

3. **Set up automated backups**
   - Configure daily backups in Supabase dashboard
   - Set up point-in-time recovery

## 🔑 Step 3: External API Configuration

### 1. Stripe Payment Setup (Priority 1 - Revenue Critical)

1. **Create Stripe account** at stripe.com
2. **Set up products in Stripe Dashboard**:
   ```
   Starter Plan: $9/month (price_starter_monthly)
   Professional: $29/month (price_pro_monthly)  
   Business: $99/month (price_business_monthly)
   ```

3. **Configure webhooks**:
   - Endpoint: `https://yourdomain.com/api/billing/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`

4. **Add environment variables**:
   ```
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_...
   NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
   NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY=price_...
   ```

### 2. OpenAI Integration (Priority 2 - Core Feature)

1. **Create OpenAI account** at platform.openai.com
2. **Set up billing** and usage limits
3. **Generate API key**
4. **Add environment variable**:
   ```
   OPENAI_API_KEY=sk-...
   ```

### 3. Google Services (Priority 3)

1. **Set up Google Cloud Console project**
2. **Enable APIs**:
   - Google Drive API
   - Google OAuth 2.0
3. **Create OAuth 2.0 credentials**
4. **Configure authorized redirect URIs**:
   ```
   https://yourdomain.com/auth/callback
   https://yoursupabaseproject.supabase.co/auth/v1/callback
   ```
5. **Add environment variables**:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### 4. Social Platform APIs (Priority 4)

#### Instagram
1. Create Facebook Developer account
2. Set up Instagram Basic Display API
3. Configure OAuth redirect URIs
4. Add environment variables:
   ```
   INSTAGRAM_APP_ID=...
   INSTAGRAM_APP_SECRET=...
   ```

#### Twitter/X
1. Apply for Twitter Developer account
2. Create app with API v2 access
3. Configure OAuth 2.0
4. Add environment variables:
   ```
   TWITTER_CLIENT_ID=...
   TWITTER_CLIENT_SECRET=...
   ```

#### LinkedIn
1. Create LinkedIn Developer account
2. Set up LinkedIn API access
3. Configure OAuth 2.0
4. Add environment variables:
   ```
   LINKEDIN_CLIENT_ID=...
   LINKEDIN_CLIENT_SECRET=...
   ```

#### Pinterest
1. Create Pinterest Developer account
2. Set up Pinterest API access
3. Configure OAuth 2.0
4. Add environment variables:
   ```
   PINTEREST_APP_ID=...
   PINTEREST_APP_SECRET=...
   ```

#### TikTok
1. Apply for TikTok for Developers
2. Set up TikTok Display API
3. Configure OAuth 2.0
4. Add environment variables:
   ```
   TIKTOK_CLIENT_ID=...
   TIKTOK_CLIENT_SECRET=...
   ```

## 🌍 Step 4: Environment Configuration

### Complete Environment Variables

```bash
# Core Platform
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe Payments
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY=price_...

# OpenAI
OPENAI_API_KEY=sk-...

# Google Services
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Social Platforms
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
PINTEREST_APP_ID=...
PINTEREST_APP_SECRET=...
TIKTOK_CLIENT_ID=...
TIKTOK_CLIENT_SECRET=...

# Optional: Monitoring
SENTRY_DSN=...
POSTHOG_API_KEY=...
```

## 📊 Step 5: Monitoring & Analytics

### Set up Error Tracking

1. **Sentry setup** (recommended):
   ```bash
   npm i @sentry/nextjs
   # Configure in next.config.js and sentry.client.config.js
   ```

2. **Alternative: LogRocket, Rollbar, or Bugsnag**

### Set up Performance Monitoring

1. **Vercel Analytics** (automatic with Vercel)
2. **Google Analytics** for user tracking
3. **PostHog** for product analytics

### Set up Uptime Monitoring

1. **UptimeRobot** for basic uptime monitoring
2. **Pingdom** for advanced monitoring
3. **Status page** for transparency

## 🧪 Step 6: Testing & Quality Assurance

### Pre-Launch Testing Checklist

- [ ] User registration and login flow
- [ ] Password reset functionality
- [ ] Subscription and payment flow
- [ ] Google Drive integration and file scanning
- [ ] Social platform connections and posting
- [ ] AI content generation (captions and images)
- [ ] Queue scheduling and automation
- [ ] Mobile responsiveness
- [ ] Performance testing (load times < 2s)
- [ ] Security testing (authentication, data access)

### Load Testing

```bash
# Use tools like Artillery or k6 for load testing
npx artillery quick --count 100 --num 10 https://yourdomain.com
```

## 🚀 Step 7: Launch Strategy

### Soft Launch (Week 1)

1. **Limited beta access** (50-100 users)
2. **Monitor system performance** closely
3. **Collect user feedback** actively
4. **Fix critical issues** immediately

### Public Launch (Week 2+)

1. **Remove access restrictions**
2. **Launch marketing campaigns**
3. **Monitor scaling metrics**
4. **Implement feature requests**

## 📈 Step 8: Post-Launch Optimization

### Performance Monitoring

- **Response times** < 500ms average
- **Page load speeds** < 2 seconds
- **Error rates** < 0.1%
- **Uptime** > 99.9%

### Cost Optimization

- Monitor OpenAI API usage and costs
- Optimize database queries for performance
- Implement caching strategies
- Set up billing alerts

### Scaling Preparation

- Monitor user growth and system load
- Prepare horizontal scaling strategies
- Set up auto-scaling if needed
- Plan database scaling (read replicas)

## 🆘 Support & Maintenance

### Customer Support Setup

1. **Help documentation** and FAQ
2. **Support ticket system** (Intercom, Zendesk)
3. **Live chat** for immediate assistance
4. **Email support** for complex issues

### Maintenance Schedule

- **Daily**: Monitor system health and user feedback
- **Weekly**: Review performance metrics and costs
- **Monthly**: Security updates and feature deployments
- **Quarterly**: Performance optimization and scaling review

## 🎯 Success Metrics

### Key Performance Indicators

- **User Growth**: 10% month-over-month
- **Revenue Growth**: $10k ARR in first 6 months
- **User Retention**: 80% monthly retention
- **Support Quality**: < 4 hour response time
- **System Reliability**: 99.9% uptime

### Business Metrics

- **Customer Acquisition Cost (CAC)**: < $50
- **Lifetime Value (LTV)**: > $300
- **Churn Rate**: < 5% monthly
- **Net Promoter Score (NPS)**: > 50

## 🎉 You're Ready to Launch!

With this deployment complete, Postoko is ready to:

- ✅ Accept user registrations and payments
- ✅ Generate AI-powered content automatically
- ✅ Post to multiple social platforms
- ✅ Handle thousands of users concurrently
- ✅ Generate revenue from day one

**Welcome to the future of social media automation!** 🚀