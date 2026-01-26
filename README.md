# FÊNIX 86

> Autonomous execution infrastructure for digital products and intelligent agents.

[![Status](https://img.shields.io/badge/status-production--ready-success)](https://fenix86.app)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## Overview

FÊNIX 86 is a stable, continuous autonomous execution system designed for digital product operators, API marketplaces, and agent-based automation. Built with a "build once, scale forever" philosophy.

### Core Principles

- **Calm Execution**: Predictable, stable operations without surprises
- **Continuous**: Always-on autonomous processing
- **Inevitable**: Designed to not break, not stall, not stop

## Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite + TypeScript | Dashboard & Control UI |
| Styling | Tailwind CSS + shadcn/ui | Dark-supreme design system |
| Backend | Supabase Edge Functions | Serverless execution layer |
| Database | PostgreSQL | State, logs, telemetry |
| Payments | Stripe | Credit economy & monetization |

## Core Modules

| Module | Route | Status |
|--------|-------|--------|
| Dashboard | `/` | ✅ Active |
| Marketplace | `/marketplace` | ✅ Active |
| Control Center | `/control` | ✅ Active |
| Neural Core | `/neural-brain` | ✅ Active |
| Phoenix Engine | `/phoenix` | ✅ Active |
| Demand Radar | `/demand-radar` | ✅ Active |
| Full Power | `/full-power` | ✅ Active |
| Payments | `/payments` | ✅ Active |
| Web3 Wallet | `/web3` | ✅ Active |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/fenix-86.git

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
| `neural-brain` | Central orchestration logic |
| `demand-radar` | Signal detection & processing |
| `full-power-orchestrator` | Autonomous mode controller |
| `stripe-webhook` | Payment event processing |
| `create-checkout` | Stripe checkout sessions |

## External Configuration Required

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
│   ├── neural/       # Neural core components
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

- **Theme**: Dark Supreme
- **Primary**: `#E63946` (FÊNIX Red)
- **Background**: `#0B0F14`
- **Typography**: Inter (UI) + JetBrains Mono (Data)

## License

MIT License

---

Built with precision by XPEX Systems AI
