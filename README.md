# XP Infrastructure

> AI-native cloud infrastructure for autonomous systems, agent economies, and programmable execution at scale.

[![Status](https://img.shields.io/badge/status-operational-success)](https://xpinfra.io)
[![Version](https://img.shields.io/badge/version-1.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## Overview

XP Infrastructure is an enterprise-grade cloud platform designed for developers and AI builders who need reliable, programmable, autonomous infrastructure. Built with a focus on core reliability before expansion.

### Core Principles

- **Reliability First**: Stable, predictable operations
- **Programmable**: API-first, webhook-ready, CRON-enabled
- **Autonomous**: Self-healing execution with intelligent orchestration

## Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite + TypeScript | Dashboard & Console |
| Styling | Tailwind CSS + shadcn/ui | Enterprise UI System |
| Backend | Supabase Edge Functions | Serverless Execution |
| Database | PostgreSQL | State, Logs, Telemetry |
| Billing | Stripe | Credit Economy |

## Core Modules

| Module | Route | Status |
|--------|-------|--------|
| Dashboard | `/` | ✅ Active |
| Marketplace | `/marketplace` | ✅ Active |
| Control Center | `/control` | ✅ Active |
| AI Core | `/neural-brain` | ✅ Active |
| Execution Engine | `/phoenix` | ✅ Active |
| Demand Radar | `/demand-radar` | ✅ Active |
| Orchestrator | `/full-power` | ✅ Active |
| Payments | `/payments` | ✅ Active |
| Web3 Wallet | `/web3` | ✅ Active |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/xp-infrastructure/xp-infra.git

# Install dependencies
npm install

# Start development server
npm run dev
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## Edge Functions

| Function | Purpose |
|----------|---------|
| `agent-scheduler` | CRON-triggered execution cycles |
| `agent-economy` | Credit transactions & marketplace |
| `neural-brain` | AI orchestration logic |
| `demand-radar` | Signal detection & processing |
| `full-power-orchestrator` | Autonomous mode controller |
| `stripe-webhook` | Payment event processing |
| `create-checkout` | Stripe checkout sessions |

## External Configuration

### Stripe Webhook
Register webhook URL in Stripe Dashboard:
- **URL**: `https://[project-id].supabase.co/functions/v1/stripe-webhook`
- **Events**: `checkout.session.completed`, `payment_intent.succeeded`

### CRON Scheduler
Configure external CRON (e.g., cron-job.org):
- **URL**: `https://[project-id].supabase.co/functions/v1/agent-scheduler`
- **Method**: POST
- **Schedule**: Every 5 minutes (`*/5 * * * *`)

## Project Structure

```
src/
├── components/
│   ├── audit/        # Audit panels
│   ├── control/      # Control center components
│   ├── dashboard/    # Dashboard components
│   ├── layout/       # Layout components
│   ├── neural/       # AI core components
│   ├── radar/        # Demand radar components
│   └── ui/           # shadcn/ui components
├── hooks/            # Custom React hooks
├── pages/            # Route pages
├── integrations/     # Supabase client
└── lib/              # Utilities

supabase/
└── functions/        # Edge Functions
```

## Design System

- **Theme**: Dark Enterprise
- **Primary**: Electric Blue (`#3b82f6`)
- **Background**: Neutral Black (`#0a0a0a`)
- **Typography**: Inter (UI) + JetBrains Mono (Data)

## Security

- Row-Level Security (RLS) on all tables
- Role-based access control
- API key authentication with rate limiting
- Secure webhook signature verification

## License

MIT License

---

Built by XP Infrastructure
