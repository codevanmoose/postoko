# CLAUDE.md - Postoko Development Journal

## Project Overview
**Postoko** - AI-powered perpetual content engine for social media  
**Tagline**: "Drop your photo. We'll post it. Daily."  
**Domain**: https://postoko.com  
**Start Date**: January 2025  

## Current State
- **Phase**: Project initialization
- **Status**: Setting up monorepo structure
- **Next Steps**: Complete foundation setup, implement auth module

## Architecture Decisions
- **Monorepo**: Using Turborepo for efficient builds
- **Frontend**: Next.js 14 with App Router on Vercel
- **Backend**: FastAPI (Python) on DigitalOcean
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Queue**: Redis + BullMQ for job processing
- **AI**: OpenAI (GPT-4 + DALL-E 3) + Replicate (SDXL/Midjourney)
- **Payments**: Stripe with subscription tiers

## Module Status

| Module | Status | Progress | Blockers | Next Steps |
|--------|--------|----------|----------|------------|
| auth | 📋 Planned | 0% | None | Start implementation |
| billing | 📋 Planned | 0% | None | After auth |
| drive | 📋 Planned | 0% | None | After auth |
| social | 📋 Planned | 0% | None | After drive |
| queue | 📋 Planned | 0% | None | After drive |
| posting | 📋 Planned | 0% | None | After queue |
| ai | 📋 Planned | 0% | None | After billing |
| analytics | 📋 Planned | 0% | None | After posting |
| dashboard | 📋 Planned | 0% | None | After analytics |
| settings | 📋 Planned | 0% | None | With auth |
| notifications | 📋 Planned | 0% | None | After posting |
| admin | 📋 Planned | 0% | None | Last module |

## Key Features Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Project setup and configuration
- [ ] Authentication with Supabase
- [ ] Billing integration with Stripe
- [ ] Basic UI scaffolding

### Phase 2: Core Features (Weeks 2-3)  
- [ ] Google Drive integration
- [ ] Social platform connections
- [ ] Queue management system
- [ ] Posting engine

### Phase 3: AI Features (Weeks 4-5)
- [ ] AI image generation
- [ ] Caption creation
- [ ] Style analysis
- [ ] Hashtag intelligence

### Phase 4: Polish & Launch (Week 6)
- [ ] Analytics dashboard
- [ ] Admin tools
- [ ] Performance optimization
- [ ] Beta testing

## Technical Notes

### API Design Principles
- RESTful endpoints with clear naming
- Comprehensive error handling
- Rate limiting from day one
- Agent-friendly documentation

### Database Schema Highlights
- Users with subscription tiers
- Connected accounts for platforms
- Monitored folders from Drive
- Posts with platform-specific data
- AI generations with safety scores

### Security Considerations
- OAuth tokens encrypted at rest
- Minimal permission scopes
- Regular token refresh
- Content safety filters

## Development Log

### Session 1 (2025-01-XX)
- ✅ Created monorepo structure with Turborepo
- ✅ Set up module manifest with 12 core modules
- ✅ Initialized CLAUDE.md as living journal
- ✅ Created comprehensive README.md
- ✅ Set up TypeScript, ESLint, and Prettier configurations
- ✅ Initialized Supabase with complete database schema
- ✅ Created .env.example with all required variables
- ✅ Set up Playwright for E2E testing
- ✅ Initialized Next.js app with:
  - Tailwind CSS with custom Postoko theme
  - App directory structure
  - Basic landing page
  - Global styles with animations
- ✅ Created auth module specification with:
  - Detailed feature requirements
  - API endpoint definitions
  - Security considerations
  - Testing requirements
- 🚧 Next: Set up shared packages and initialize Git

## TODO List (Immediate)
1. Complete project setup files (package.json, tsconfig, etc.)
2. Initialize Git repository
3. Set up Supabase project
4. Create auth module specification
5. Implement basic auth flow

## Lessons Learned
- Using modular architecture from start prevents complexity later
- Clear module dependencies help with planning
- Documentation-first approach saves time

## Important Links
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [DigitalOcean Dashboard](https://cloud.digitalocean.com)
- [Stripe Dashboard](https://dashboard.stripe.com)

## Environment Variables Needed
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Social Platforms
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=

# OpenAI
OPENAI_API_KEY=

# Replicate
REPLICATE_API_TOKEN=

# Redis
REDIS_URL=
```

## Notes for Next Session
- Focus on completing project setup
- Start with auth module spec
- Remember to keep files under 500 lines
- Use existing Van Moose patterns