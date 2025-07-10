### 7. Notifications & Alerts
- **Email notifications**:
  - Post confirmations with links
  - Error alerts with retry options
  - Empty queue warnings
  - Weekly performance summaries
- **Slack webhooks** (Growth+)
- **In-app notification center**# Postoko Product Requirements Document (PRD)

## 📌 Project Overview

- **Name**: Postoko
- **Type**: SaaS web application
- **Domain**: https://postoko.com
- **Tagline**: "Drop your photo. We'll post it. Daily."
- **Value Proposition**: The world's first perpetual content engine. Drop one photo, and Postoko creates and posts new AI-generated variations daily — forever.
- **Core Concept**: An AI-powered perpetual content machine that combines Google Drive simplicity with intelligent image generation to create an infinite posting loop.
- **Monetization**: Paid-only subscription model starting at $9/month. No free tier. Monthly billing via Stripe.

---

## 🎯 Target Users

### Primary Segments
1. **Solo Content Creators** (Starter Tier)
   - Individual photographers sharing daily work
   - Digital artists with consistent output
   - Aesthetic/mood page operators
   - Personal brand builders

2. **Power Users** (Pro Tier)
   - Established creators with higher posting frequency
   - Small businesses with content calendars
   - Influencers managing multiple content streams
   - Social media managers (1-2 brands)

3. **Agencies & Multi-Brand** (Studio Tier)
   - Digital marketing agencies
   - Content creation studios
   - Multi-brand operators
   - Enterprise social media teams

---

## 💰 Pricing & Features

### Pricing Tiers

| Tier | Price | Target User | Key Value |
|------|-------|-------------|-----------|
| **Starter** | $9/month | Solo creator | Upload-only automation |
| **Pro** | $19/month | Active creator | AI perpetual loop (30/month) |
| **Growth** | $39/month | Power user | Scale AI creation (150/month) |
| **Studio** | $79/month | Agency/multi-brand | Pro features (450/month) |
| **Enterprise** | Custom | Large teams | Unlimited with BYO API keys |

### AI Generation Limits
- **Starter**: 0 AI images (upload-only)
- **Pro**: 1 AI image/day (30/month)
- **Growth**: 5 AI images/day (150/month)
- **Studio**: 15 AI images/day (450/month)
- **Enterprise**: Unlimited with your own API keys

### Optional Add-ons
- **Extra AI Credits**: $10 = 30 credits (never expire)
- **High-Res Output**: +$10/mo for 1024×1024+ resolution
- **Brand Style Lock**: +$20/mo per brand template
- **Priority Processing**: +$15/mo for faster generation

### Feature Matrix

| Feature | Starter | Pro | Growth | Studio | Enterprise |
|---------|---------|-----|--------|--------|------------|
| **Price** | $9/mo | $19/mo | $39/mo | $79/mo | Custom |
| **Posts per day** | 1 | 3 | 10 | 25 | Unlimited |
| **AI Image Generation** | ❌ | 30/mo | 150/mo | 450/mo | Unlimited |
| **Google Drive folders** | 1 | 1 | 3 | 10 | Unlimited |
| **Social accounts per platform** | 1 each | 1 each | 2 each | 5 each | Unlimited |
| **Post to Instagram** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Post to X (Twitter)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Post to Pinterest** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Auto-archive after posting** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **AI Caption Generator** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Style Mirroring** | ❌ | Basic | Advanced | Pro | Custom |
| **Content Safety Filters** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Post scheduling** | Fixed | Flexible | Multi-slot | Full control | API |
| **Post history** | 30 days | 90 days | 1 year | Unlimited | Unlimited |
| **Custom timezones** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Queue selection modes** | Sequential | Random | Smart mix | All modes | All modes |
| **Hashtag research** | ❌ | Basic | Advanced | Pro | Custom |
| **Caption personas** | ❌ | 3 presets | 5 presets | All + custom | Unlimited |
| **Hashtag sets** | 1 default | 3 saved | 10 saved | Unlimited | Unlimited |
| **Archive recycling** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Analytics dashboard** | Basic | Standard | Advanced | Pro | Custom |
| **Google Sheets integration** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Notion integration** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Email notifications** | Failures | Daily | Custom | Custom | Webhooks |
| **Slack integration** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Brand templates** | ❌ | 1 | 3 | 10 | Unlimited |
| **Team members** | ❌ | ❌ | 2 | 5 | Unlimited |
| **White-label option** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **API access** | ❌ | ❌ | ❌ | Read-only | Full |
| **BYO API Keys** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Support** | Email | Email | Priority | Priority | Dedicated |
| **SLA** | ❌ | ❌ | ❌ | 99.5% | 99.9% |

---

## 💡 Core Features

### 1. Authentication & Onboarding
- **Google OAuth 2.0** for Drive access
- **Social platform OAuth** for Instagram, X, Pinterest
- **Guided setup wizard** (3 steps max)
- **Folder selection UI** with permission verification

### 2. Content Detection & Processing
- **Supported formats**: JPG, PNG, WebP, HEIC
- **Max file size**: 20MB (Instagram limit)
- **Queue Selection Modes**:
  - Sequential (oldest first)
  - Sequential (newest first)
  - Random selection
  - Smart mix (alternates uploads/AI)
  - Weighted random (favors certain types)
- **Caption extraction hierarchy**:
  1. `{filename}_caption.txt` or `{filename}.txt`
  2. `{filename}.json` with `caption` field
  3. EXIF/metadata description
  4. AI-generated caption
  5. Template-based caption
- **When queue is empty**:
  - Generate AI content (Pro+)
  - Pause posting
  - Recycle from archive
  - Send alert notification

### 3. Posting Engine
- **Daily scan time**: User-defined (default 8:00 AM local)
- **Retry logic**: 3 attempts with exponential backoff
- **Platform-specific formatting**:
  - Instagram: Square crop option, 15-25 hashtags, 2200 char limit, Threads cross-post
  - X: Thread support, 2-3 hashtags, 280 char limit, 4 images max
  - Pinterest: Board selection, 5-10 hashtags, SEO-optimized, Rich Pins
  - TikTok (Phase 4): Auto-slideshow from photos, trending audio
- **Caption & Hashtag System**:
  - Every post includes a caption (user-provided or AI)
  - Platform-optimized hashtag counts
  - Trending hashtag integration
  - Niche hashtag discovery
  - Performance tracking
  - Default hashtag sets per brand
- **Success tracking**: Store post IDs, URLs, and engagement

### 4. AI Perpetual Content Engine
- **Image Analysis** (Computer Vision):
  - Extract style, colors, composition
  - Identify subject matter and themes
  - Detect brand elements
- **Style Mirroring** (DALL-E 3 / Stable Diffusion XL):
  - Generate prompts based on analysis
  - Maintain aesthetic consistency
  - Apply brand style templates (Studio/Custom)
- **Content Safety**:
  - NSFW detection and filtering
  - Brand safety checks
  - Fallback to manual queue if unsafe
### AI Image Generation Options

**Model Selection** (Pro+ users):
- **DALL-E 3**: Best for creative, artistic images
- **Stable Diffusion XL**: Open source, highly customizable
- **Midjourney** (via Replicate): Premium artistic quality
- **Flux**: Newest model, photorealistic results

**Generation Parameters**:
- Style consistency scoring
- Prompt engineering based on source
- Multiple variations per generation
- Resolution options (512x512 to 1024x1024+)

**Future Video Support**:
- HailuoAI for animated content
- Auto-slideshow for TikTok
- Ken Burns effect for photos
- AI-generated transitions
- **Feedback Loop**:
  - Track which AI images perform best
  - Refine generation parameters
  - A/B test different styles

### 5. Caption & Hashtag Intelligence
- **AI Caption Generation** (OpenAI GPT-4):
  - Image analysis for context
  - Platform-specific optimization
  - Brand voice personas (5 presets + custom)
  - Emoji usage patterns
  - Call-to-action templates
- **Hashtag Research & Generation**:
  - Competition analysis (low/medium/high)
  - Trending hashtag detection
  - Niche community hashtags
  - Banned hashtag filtering
  - Performance tracking per hashtag
  - Mix strategy: 30% high, 50% medium, 20% low competition
- **Caption Personas**:
  - Professional photographer
  - Casual storyteller
  - Inspirational quotes
  - Minimalist
  - Brand promotional
  - Educational/informative

### 6. Dashboard & Analytics
- **Post calendar view** with status indicators
- **Queue management interface**:
  - Drag-and-drop reordering
  - Preview upcoming posts
  - Edit captions before posting
  - Regenerate AI content
- **Performance metrics**:
  - Hashtag performance tracking
  - Best posting times
  - Content type analysis
  - Engagement trends
- **Error logs** with actionable messages

---

## 🧱 Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts (analytics)

### Backend
- **API**: FastAPI (Python) or Express.js (Node.js)
- **Queue System**: BullMQ + Redis
- **Cron Jobs**: Node-cron or Celery Beat
- **Image Processing**: Sharp (Node) or Pillow (Python)
- **AI Integration**: 
  - Text: OpenAI GPT-4
  - Images: DALL-E 3, Stable Diffusion XL, Midjourney (via Replicate)
  - Future: HailuoAI for video generation

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage (temporary processing)
- **Authentication**: Supabase Auth + OAuth providers
- **Hosting**:
  - Frontend: Vercel
  - Backend: DigitalOcean App Platform
  - Workers: DigitalOcean App Platform (background jobs)
  - Redis: DigitalOcean Managed Redis
- **CDN**: Cloudflare (optional)
- **Monitoring**: Sentry + DigitalOcean Monitoring

### External APIs
- **Google Drive API v3**
- **Instagram Graph API** (via Meta Business)
- **X API v2** (with media upload endpoints)
- **Pinterest API v5** (with board management)
- **Threads** (via Instagram cross-posting)
- **OpenAI API** (GPT-4 + DALL-E 3)
- **Replicate API** (for Midjourney/SDXL access)
- **Stripe API**

---

## 📊 Database Schema

### Tables

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP,
  stripe_customer_id VARCHAR,
  subscription_tier VARCHAR DEFAULT 'starter',
  subscription_status VARCHAR DEFAULT 'active',
  timezone VARCHAR DEFAULT 'UTC'
)

-- Connected accounts
connected_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  platform VARCHAR NOT NULL, -- 'google', 'instagram', 'twitter', 'pinterest'
  account_id VARCHAR NOT NULL,
  account_name VARCHAR,
  access_token TEXT ENCRYPTED,
  refresh_token TEXT ENCRYPTED,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Google Drive folders
monitored_folders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  folder_id VARCHAR NOT NULL,
  folder_name VARCHAR,
  brand_name VARCHAR, -- For Studio tier
  last_scanned TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

-- Posts
posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  folder_id UUID REFERENCES monitored_folders(id),
  file_name VARCHAR NOT NULL,
  file_id VARCHAR NOT NULL,
  caption TEXT,
  caption_source VARCHAR, -- 'file', 'ai', 'manual'
  scheduled_for TIMESTAMP,
  posted_at TIMESTAMP,
  status VARCHAR, -- 'queued', 'processing', 'posted', 'failed'
  created_at TIMESTAMP
)

-- Platform posts (one per platform)
platform_posts (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  platform VARCHAR NOT NULL,
  platform_post_id VARCHAR,
  platform_url VARCHAR,
  status VARCHAR,
  error_message TEXT,
  posted_at TIMESTAMP
)

```sql
-- AI generations (enhanced)
ai_generations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  source_post_id UUID REFERENCES posts(id),
  generation_type VARCHAR, -- 'caption', 'image'
  model VARCHAR, -- 'dalle-3', 'sdxl', 'custom'
  prompt TEXT,
  style_analysis JSONB, -- Color palette, composition, etc.
  result_url TEXT, -- For images
  result_text TEXT, -- For captions
  safety_score FLOAT, -- 0-1 safety rating
  credits_used INTEGER,
  performance_score FLOAT, -- Track which generations work best
  created_at TIMESTAMP
)

-- AI style templates (for brand consistency)
ai_style_templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR,
  base_prompt TEXT,
  style_parameters JSONB,
  sample_images TEXT[], -- URLs of reference images
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

-- AI usage tracking
ai_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  date DATE,
  images_generated INTEGER DEFAULT 0,
  captions_generated INTEGER DEFAULT 0,
  credits_remaining INTEGER,
  tier_limit INTEGER
)
```

-- Subscription events
subscription_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_event_id VARCHAR,
  event_type VARCHAR,
  tier VARCHAR,
  amount INTEGER,
  created_at TIMESTAMP
)
```

---

## 🛣️ API Routes

### Authentication
- `POST /auth/login` - Initiate OAuth flow
- `GET /auth/callback/{provider}` - OAuth callback
- `POST /auth/logout` - Clear session
- `GET /auth/me` - Current user info

### Folders
- `GET /folders` - List monitored folders
- `POST /folders` - Add new folder
- `PUT /folders/{id}` - Update folder settings
- `DELETE /folders/{id}` - Remove folder
- `POST /folders/{id}/scan` - Manual scan trigger

### Posts
- `GET /posts` - List posts (with filters)
- `GET /posts/{id}` - Post details
- `POST /posts/{id}/retry` - Retry failed post
- `DELETE /posts/{id}` - Cancel queued post

### Settings
- `GET /settings` - User preferences
- `PUT /settings` - Update preferences
- `PUT /settings/timezone` - Update timezone
- `PUT /settings/schedule` - Update posting schedule
- `PUT /settings/queue-mode` - Update selection mode
- `PUT /settings/hashtags` - Manage hashtag sets
- `PUT /settings/captions` - Manage caption templates

### Billing
- `POST /billing/subscribe` - Create subscription
- `PUT /billing/upgrade` - Change tier
- `DELETE /billing/cancel` - Cancel subscription
- `GET /billing/invoices` - List invoices

### Admin (internal)
- `GET /admin/users` - List all users
- `GET /admin/stats` - Platform statistics
- `POST /admin/posts/{id}/trigger` - Manual post trigger
- `GET /admin/logs` - System logs

---

## 🔄 Core Workflows

### 1. Onboarding Flow
```
1. Sign up → Stripe checkout
2. Google OAuth → Drive permissions
3. Select/create monitoring folder
4. Connect social accounts (min 1)
5. Set posting schedule
6. Drop first image → Success notification
```

### 2. Daily Posting & AI Generation Flow
```
1. Cron triggers at scheduled time
2. Check queue selection mode:
   - Sequential: Get oldest/newest file
   - Random: Pick random file from folder
   - Smart Mix: Alternate between upload/AI
3. For selected image:
   - Download to temp storage
   - Generate caption based on:
     * User template/persona
     * Image analysis
     * Platform requirements
   - Generate hashtags:
     * Pull from saved sets
     * Add trending tags
     * Mix competition levels
   - Optimize for each platform
   - Post to platforms in parallel
   - Move to archive folder
   - Log results
4. AI Generation (Pro/Studio/Custom):
   - Analyze posted image (colors, style, composition)
   - Generate style-matched prompt
   - Create new image via DALL-E/SDXL
   - Apply safety filters
   - Generate AI caption with matching persona
   - Place in monitoring folder
   - Track generation for billing
5. Check if queue empty:
   - Execute empty behavior (generate/pause/recycle)
6. Send notifications
7. Update analytics dashboard
```

### 3. AI Safety & Quality Flow
```
1. Generate image via AI
2. Run through safety filters:
   - NSFW detection
   - Brand safety check
   - Copyright similarity scan
3. If unsafe:
   - Log incident
   - Generate alternative
   - Max 3 retries
4. If still unsafe:
   - Skip AI generation
   - Notify user
   - Suggest manual upload
5. Quality tracking:
   - Monitor engagement rates
   - A/B test styles
   - Refine prompts
```

### 3. Error Recovery Flow
```
1. Detect posting failure
2. Log error with context
3. Retry with backoff (3x)
4. If still failing:
   - Keep in queue
   - Notify user
   - Provide manual retry option
```

---

## 📁 Project Structure

```
postoko/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   └── api/                 # Backend API
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── models/
│       │   └── utils/
│       └── workers/         # Queue workers
├── packages/
│   ├── database/           # Shared DB schemas
│   ├── types/              # TypeScript types
│   └── utils/              # Shared utilities
├── docker-compose.yml
├── turbo.json              # Turborepo config
└── package.json
```

---

## 🎨 Design & UX Guidelines

### Visual Identity
- **Primary Color**: #6366F1 (Indigo)
- **Secondary Color**: #10B981 (Emerald) - for AI features
- **Typography**: Inter for UI, Cal Sans for headings
- **Style**: Clean, minimal, futuristic
- **Logo**: Infinity symbol merged with upload arrow (perpetual engine)
- **Tagline Options**:
  - "Set it. Forget it. Forever."
  - "Your brand on autopilot."
  - "One photo. Infinite posts."

### Key UI Components
1. **Dashboard**: Calendar grid with queue preview
2. **Queue Manager**: 
   - Visual grid of upcoming posts
   - Drag-and-drop reordering
   - Random shuffle button
   - Selection mode switcher
3. **Caption Editor**:
   - Live preview across platforms
   - Persona selector
   - Hashtag suggestions with competition levels
4. **Folder Browser**: Visual Google Drive integration
5. **Analytics**: Hashtag performance, best times, content insights
6. **Settings**: Tabbed interface with queue modes, hashtags, templates

### Onboarding Principles
- Maximum 3 steps to first post
- Visual progress indicators
- Skip-able advanced features
- Success celebration on first post

---

## 🚀 Launch Strategy

### MVP (Month 1)
- Basic Google Drive integration
- Post to Instagram + X only
- Starter tier only (no AI)
- Manual caption entry
- Basic dashboard

### Phase 2 (Month 2-3)
- **AI Perpetual Engine launch** (Pro tier)
- Pinterest integration
- AI caption generation
- Style analysis system
- Email notifications

### Phase 3 (Month 4-6)
- Studio tier with bulk AI
- Custom tier with BYO keys
- AI style templates
- Brand consistency tools
- Performance analytics

### Phase 4 (Month 7-12)
- Fine-tuned models per brand
- **Video generation** (HailuoAI integration)
- **TikTok slideshow support** (auto-generate from photos)
- Threads native API (when available)
- Multi-modal content (text + image + video)
- Enterprise API
- Advanced AI models (Midjourney, Leonardo.ai)

---

## 📈 Success Metrics

### Business KPIs
- **MRR growth**: 25% month-over-month
- **Churn rate**: <5% monthly (Pro+), <10% (Starter)
- **LTV:CAC ratio**: >3:1
- **Tier distribution target**: 20% Starter, 50% Pro, 20% Growth, 10% Studio
- **Average Revenue Per User**: $28+ (driven by Pro/Growth)

### Product Metrics
- **Time to first post**: <5 minutes
- **Daily active folders**: >80%
- **Post success rate**: >95%
- **Support tickets**: <5% of MAU

### Technical Metrics
- **API uptime**: 99.9%
- **Post latency**: <30 seconds
- **Page load time**: <1 second
- **Error rate**: <0.1%

---

## 🔒 Security & Compliance

### Data Protection
- **Encryption**: AES-256 for tokens, TLS for transit
- **Token refresh**: Automatic before expiry
- **Scope limiting**: Minimal permissions requested
- **Data retention**: 90 days for posts, immediate for images

### Compliance
- **GDPR**: Full compliance with data portability
- **Platform ToS**: Strict adherence to API limits
- **Content moderation**: Basic NSFW detection
- **Billing**: PCI DSS via Stripe

---

## 🤝 Support & Documentation

### User Support
- **Starter**: Email support (48h response)
- **Pro**: Email support (24h response)
- **Growth**: Priority email (12h response)
- **Studio**: Priority support + Slack channel
- **Enterprise**: Dedicated account manager + SLA

### Documentation
- **User guide**: Step-by-step tutorials
- **API docs**: For Studio tier
- **FAQ**: Common issues and solutions
- **Video tutorials**: 2-minute feature guides

---

## 💎 Unique Selling Points

### "Never Run Out of Content"
- **Random selection**: Drop 100 photos, stay fresh for months
- **AI perpetual engine**: One photo creates infinite variations
- **Archive recycling**: Old content gets new life
- **Smart mixing**: Perfect balance of real and AI content

### "Hashtags That Actually Work"
- **Competition analysis**: Know which tags to use
- **Performance tracking**: See what drives engagement
- **Platform optimization**: Right tags for each network
- **Trending integration**: Stay relevant automatically

### "Your Brand Voice, Automated"
- **Caption personas**: Consistent tone across posts
- **Platform adaptation**: Same message, optimized delivery
- **Smart templates**: Dynamic captions that don't feel robotic
- **Learning system**: Improves based on your edits

---

## 📅 Development Timeline

### Sprint 1-2 (Weeks 1-2): Foundation
- [ ] Set up monorepo structure
- [ ] Implement authentication flow
- [ ] Create database schema
- [ ] Basic UI scaffolding

### Sprint 3-4 (Weeks 3-4): Core Features
- [ ] Google Drive integration
- [ ] Instagram posting
- [ ] Basic dashboard
- [ ] Stripe integration

### Sprint 5-6 (Weeks 5-6): Polish & Launch
- [ ] Error handling
- [ ] Email notifications
- [ ] Landing page
- [ ] Beta testing

### Post-Launch: Continuous
- [ ] Additional platforms
- [ ] AI features
- [ ] Advanced tiers
- [ ] Performance optimization

---

## 🚦 Risk Mitigation

### Technical Risks
- **API rate limits**: Implement smart queuing + caching
- **AI generation costs**: Monitor usage, implement hard limits
- **Content safety**: Multiple filter layers + human review queue
- **Style drift**: Regular calibration against original content

### Business Risks
- **Platform bans**: Strict compliance + AI watermarking
- **AI quality issues**: A/B testing + user feedback loops
- **Cost overruns**: Usage caps + BYO API key option
- **Competition**: Patent pending on perpetual engine concept

---

## 📝 Final Notes

Postoko isn't just a posting tool — it's a **perpetual content engine** that solves the #1 problem for content creators: running out of ideas. By combining familiar tools (Google Drive) with cutting-edge AI, we're creating the world's first truly autonomous social media presence.

The AI perpetual loop transforms the value proposition from "save time posting" to "never create content again." This justifies premium pricing and creates an unbeatable moat.

**Core Philosophy**: Every feature should answer "Does this help users post forever without thinking?"

**Marketing Hook**: "Upload once. Post forever. Watch your brand grow while you sleep."

---

*Document Version: 2.0 - AI Perpetual Engine Update*  
*Last Updated: January 2025*  
*Next Review: Post-AI Launch*