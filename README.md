# 🚀 Postoko - AI-Powered Perpetual Content Engine

<div align="center">
  <img src="public/logo.png" alt="Postoko Logo" width="200" />
  <p><strong>Drop your photo. We'll post it. Daily.</strong></p>
  <p>The world's first perpetual content engine that combines Google Drive simplicity with intelligent image generation to create an infinite posting loop.</p>
  
  [![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)](https://fastapi.tiangolo.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.0-blue)](https://supabase.com/)
</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Support](#support)

## 🎯 Overview

Postoko is a SaaS application that automates social media posting by monitoring Google Drive folders and intelligently posting content across multiple platforms. With AI-powered image generation and caption creation, users never run out of content.

### Key Features

- 📁 **Google Drive Integration** - Simply drop images in a folder
- 🤖 **AI Perpetual Engine** - Generate infinite variations of your content
- 📱 **Multi-Platform Support** - Instagram, X (Twitter), Pinterest, and more
- 📊 **Smart Analytics** - Track performance and optimize posting times
- 🎯 **Hashtag Intelligence** - Research and track hashtag performance
- 💳 **Flexible Pricing** - From $9/month starter to custom enterprise plans

## 🏗️ Architecture

```
postoko/
├── apps/
│   ├── web/          # Next.js frontend (Vercel)
│   ├── api/          # FastAPI backend (DigitalOcean)
│   └── workers/      # Background job processors
├── packages/
│   ├── database/     # Shared database schemas
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Shared utilities
├── modules/          # Feature modules (auth, billing, etc.)
└── infrastructure/   # Deployment configurations
```

### Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python), BullMQ, Redis
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI (GPT-4, DALL-E 3), Replicate (SDXL)
- **Hosting**: Vercel (Frontend), DigitalOcean (Backend)
- **Payments**: Stripe

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Redis
- PostgreSQL (or Supabase account)
- Google Cloud Console project (for Drive API)
- Stripe account
- Social media developer accounts

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vanmoose/postoko.git
   cd postoko
   ```

2. **Install dependencies**
   ```bash
   # Install Node dependencies
   npm install
   
   # Install Python dependencies
   cd apps/api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Set up Supabase**
   ```bash
   npx supabase init
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

5. **Run development servers**
   ```bash
   # In one terminal - Frontend
   npm run dev:web
   
   # In another terminal - Backend
   npm run dev:api
   
   # In another terminal - Workers
   npm run dev:workers
   ```

## 💻 Development

### Module Structure

Each feature is organized as a module with its own specification:

```
modules/auth/
├── spec.md           # Module specification
├── README.md         # Module documentation
├── tests/            # Module-specific tests
└── index.ts          # Module exports
```

### Available Scripts

```bash
npm run dev           # Start all services in development
npm run build         # Build all apps
npm run test          # Run all tests
npm run lint          # Lint all code
npm run typecheck     # Type check TypeScript
npm run format        # Format code with Prettier
```

### Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (Playwright)
npm run test:e2e

# Run all tests
npm test
```

## 🚢 Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

### Backend (DigitalOcean)

```bash
doctl apps create --spec .do/app.yaml
```

### Database (Supabase)

Migrations are automatically applied via GitHub Actions on merge to main.

## 📚 API Documentation

API documentation is available at:
- Development: http://localhost:8000/docs
- Production: https://api.postoko.com/docs

### Key Endpoints

- `POST /auth/login` - Authenticate user
- `GET /folders` - List monitored folders
- `POST /posts` - Create new post
- `GET /analytics` - Get performance metrics

## 🤝 Contributing

This is a private repository. Team members should:

1. Create feature branches from `develop`
2. Follow conventional commits
3. Write tests for new features
4. Update documentation
5. Create PR for review

## 📞 Support

- **Email**: support@postoko.com
- **Documentation**: [docs.postoko.com](https://docs.postoko.com)
- **Status Page**: [status.postoko.com](https://status.postoko.com)

### Support Tiers

- **Starter**: Email support (48h response)
- **Pro**: Priority email (24h response)
- **Growth**: Priority support (12h response)
- **Studio**: Dedicated Slack channel
- **Enterprise**: Dedicated account manager

## 📄 License

Copyright © 2025 Van Moose Projects. All rights reserved.

This is proprietary software. Unauthorized copying, modification, or distribution is strictly prohibited.

---

<div align="center">
  <p>Built with ❤️ by Van Moose</p>
  <p>
    <a href="https://postoko.com">Website</a> •
    <a href="https://twitter.com/postoko">Twitter</a> •
    <a href="https://postoko.com/blog">Blog</a>
  </p>
</div>