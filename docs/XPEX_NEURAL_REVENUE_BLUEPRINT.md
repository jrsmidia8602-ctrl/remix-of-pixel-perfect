# XPEX Neural Supreme — Revenue Activation Blueprint

> **Document Type**: Technical Specification & Implementation Guide  
> **Version**: 1.0.0  
> **Generated**: 2026-01-10  
> **Status**: Ready for Implementation  

---

## Executive Summary

The XPEX Neural Supreme infrastructure is **architecturally complete** but **operationally dormant**. All database tables, edge functions, and webhook handlers exist — the system lacks only:

1. **Seeded data** (agents, API products)
2. **Stripe product/price configuration**
3. **Active billing triggers**
4. **Real-time dashboard connections**

This blueprint provides step-by-step specifications to activate real revenue generation.

---

## BP_001: Missing Components Specification

### Current Infrastructure Status

| Component | Status | Notes |
|-----------|--------|-------|
| `autonomous_agents` table | ✅ Ready | Empty - needs seed data |
| `api_products` table | ✅ Ready | Empty - needs products |
| `autonomous_revenue` table | ✅ Ready | Tracking table - ready |
| `brain_tasks` table | ✅ Ready | Task queue - ready |
| `payments` table | ✅ Ready | Stores Stripe payments |
| `pending_payments` table | ✅ Ready | Payment queue - ready |
| `stripe-webhook` function | ✅ Deployed | Handles payment events |
| `neural-brain` function | ✅ Deployed | Orchestrator - ready |
| `payment-bot` function | ✅ Deployed | Payment processor - ready |
| `api-consumer-agent` function | ✅ Deployed | API caller - ready |
| STRIPE_SECRET_KEY | ✅ Configured | Ready to use |

### Missing Files to Create

#### 1. `supabase/functions/billing-trigger/index.ts`

**Purpose**: Creates Stripe PaymentIntents when agents consume APIs

**Responsibilities**:
- Receive consumption events from `api-consumer-agent`
- Calculate billable amount based on API pricing
- Create Stripe PaymentIntent with platform fee
- Update `pending_payments` table

**Data Flow**:
```
Agent Task → API Call → billing-trigger → Stripe PaymentIntent → Webhook → Revenue Record
```

#### 2. `supabase/functions/agent-scheduler/index.ts`

**Purpose**: Cron-triggered function that activates idle agents

**Responsibilities**:
- Query idle agents from `autonomous_agents`
- Match agents to pending `market_opportunities`
- Create `brain_tasks` with assignments
- Trigger `api-consumer-agent` execution

**Trigger**: Every 5 minutes via Supabase cron or external scheduler

#### 3. `src/components/dashboard/RealTimeMetrics.tsx`

**Purpose**: Replace static dashboard with live database queries

**Data Sources**:
- `autonomous_revenue` → Real revenue totals
- `autonomous_agents` → Active agent count
- `brain_tasks` → Task completion rate
- `payments` → Stripe payment totals

**Update Strategy**: Supabase Realtime subscriptions

---

## BP_002: Stripe Monetization Blueprint

### Product & Price Configuration

Create these products in Stripe Dashboard:

| Product | Type | Price | Use Case |
|---------|------|-------|----------|
| API Call Credit | One-time | $0.001/unit | Per-call API consumption |
| Agent Subscription | Recurring | $10/month | Base agent operation fee |
| Platform Fee | Variable | 5% of amount | Extracted from all payments |
| Instant Payout | One-time | 2% of amount | Accelerated seller withdrawals |

### Webhook Configuration

**Endpoint URL**: 
```
https://ggzdhmltktbcpuwgvljn.supabase.co/functions/v1/stripe-webhook
```

**Required Events**:
- `payment_intent.succeeded` ← Records revenue
- `payment_intent.payment_failed` ← Marks failure
- `charge.succeeded` ← Confirms charge
- `charge.refunded` ← Handles refunds
- `account.updated` ← Seller onboarding

### Webhook Secret

Add `STRIPE_WEBHOOK_SECRET` to environment after configuring webhook in Stripe Dashboard.

### Payment Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. TRIGGER                                                     │
│     Agent executes task → calculates cost                       │
│                              ↓                                  │
│  2. CREATE PAYMENT                                              │
│     billing-trigger → stripe.paymentIntents.create()            │
│     - amount: API cost × quantity                               │
│     - application_fee_amount: 5% platform fee                   │
│     - transfer_data: { destination: seller_account }            │
│                              ↓                                  │
│  3. CONFIRMATION (for test mode: auto-confirmed)                │
│     PaymentIntent status → succeeded                            │
│                              ↓                                  │
│  4. WEBHOOK RECEIVED                                            │
│     stripe-webhook receives payment_intent.succeeded            │
│     - Inserts into `payments` table                             │
│     - Updates `autonomous_revenue` table                        │
│                              ↓                                  │
│  5. REVENUE RECORDED                                            │
│     Dashboard displays real-time totals                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stripe Connect Fee Distribution

For a $1.00 API call:
- **Seller receives**: $0.93 (after Stripe fees)
- **Platform fee**: $0.05 (5%)
- **Stripe processing**: $0.02 (~2.9%)

---

## BP_003: Autonomous Agent Activation Model

### Agent Schema

```typescript
interface AutonomousAgent {
  id: string;                           // UUID
  agent_name: string;                   // Human-readable name
  agent_type: AgentType;                // api_consumer | payment_bot | volume_generator
  status: AgentStatus;                  // idle | active | error | maintenance
  capabilities: string[];               // ['api_calls', 'payment_processing']
  wallet_address: string;               // For crypto payments
  daily_budget: number;                 // Max daily spend
  max_concurrent_tasks: number;         // Parallel task limit
  performance_score: number;            // 0.0 to 1.0
  success_rate: number;                 // Historical success rate
  total_tasks_completed: number;        // Lifetime counter
  total_revenue_generated: number;      // Lifetime revenue
  last_active_at: timestamp;            // Last task execution
  last_heartbeat_at: timestamp;         // Health check
  error_count: number;                  // Recent errors
  last_error: string;                   // Last error message
  metadata: jsonb;                      // Agent-specific config
}
```

### Agent Types

| Type | Purpose | Revenue Model |
|------|---------|---------------|
| `api_consumer` | Consumes external APIs, processes data | Markup on API calls (50%) |
| `payment_bot` | Processes payment queues | 5% platform fee on payments |
| `volume_generator` | High-frequency trading simulation | Spread on trades |
| `nft_minter` | NFT minting operations | Minting fees |

### Agent Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│                    AGENT LIFECYCLE                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. REGISTRATION                                           │
│     POST /api-consumer-agent/register                      │
│     - Creates entry in autonomous_agents                   │
│     - Status: 'idle'                                       │
│                                                            │
│  2. ACTIVATION                                             │
│     Neural Brain assigns task                              │
│     - Status: 'active'                                     │
│     - current_task_id: assigned                            │
│                                                            │
│  3. EXECUTION                                              │
│     Agent processes task                                   │
│     - Calls target API                                     │
│     - Triggers billing                                     │
│     - Records metrics                                      │
│                                                            │
│  4. COMPLETION                                             │
│     Task marked complete                                   │
│     - Status: 'idle'                                       │
│     - Performance updated                                  │
│     - Revenue recorded                                     │
│                                                            │
│  5. OPTIMIZATION                                           │
│     Neural Brain reallocates                               │
│     - Based on performance_score                           │
│     - Budget rebalancing                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Billing Triggers

| Event | Trigger | Revenue Entry |
|-------|---------|---------------|
| API call completed | `api-consumer-agent/execute` | `revenue_source: 'api_calls'` |
| Payment processed | `payment-bot/process` | `revenue_source: 'payment_fees'` |
| Task completion | Neural Brain callback | `revenue_source: 'task_completion'` |

### Agent Seed Data Example

```sql
INSERT INTO autonomous_agents (
  agent_name, agent_type, status, capabilities, 
  wallet_address, daily_budget, max_concurrent_tasks
) VALUES 
(
  'Crypto Data Miner v1',
  'api_consumer',
  'idle',
  ARRAY['api_calls', 'data_processing'],
  '0x742d35Cc6634C0532925a3b844Bc9e90HASH123',
  50.00,
  5
),
(
  'Payment Processor Alpha',
  'payment_bot',
  'idle',
  ARRAY['stripe_processing', 'crypto_transfers'],
  '0x893d35Cc6634C0532925a3b844Bc9e90HASH456',
  100.00,
  10
);
```

---

## BP_004: Real Data Dashboard Connection Plan

### Current State

Dashboard components use either:
- Hardcoded sample data
- Empty database queries

### Target State

All metrics from real database queries with Supabase Realtime.

### Query Specifications

#### Total Revenue Today

```typescript
const { data } = await supabase
  .from('autonomous_revenue')
  .select('amount')
  .gte('created_at', startOfToday)
  .eq('status', 'collected');

const totalToday = data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
```

#### Active Agents Count

```typescript
const { count } = await supabase
  .from('autonomous_agents')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active');
```

#### Task Success Rate

```typescript
const { data: tasks } = await supabase
  .from('brain_tasks')
  .select('status')
  .gte('created_at', last24Hours);

const successRate = tasks 
  ? tasks.filter(t => t.status === 'completed').length / tasks.length 
  : 0;
```

#### Pending Payments

```typescript
const { count } = await supabase
  .from('pending_payments')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending');
```

### Realtime Subscriptions

```typescript
// Enable realtime on revenue table
// SQL: ALTER PUBLICATION supabase_realtime ADD TABLE autonomous_revenue;

const channel = supabase
  .channel('revenue-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'autonomous_revenue'
  }, (payload) => {
    // Update dashboard state
    setTotalRevenue(prev => prev + payload.new.amount);
  })
  .subscribe();
```

### Dashboard Component Mapping

| Component | Data Source | Refresh Strategy |
|-----------|-------------|------------------|
| `BrainStatsCards` | `autonomous_agents`, `brain_tasks` | Realtime + 30s poll |
| `RevenueChart` | `autonomous_revenue` | Realtime on INSERT |
| `AgentStatusCard` | `autonomous_agents` | Realtime on UPDATE |
| `TaskMonitorTable` | `brain_tasks` | Realtime all events |
| `OpportunityTracker` | `market_opportunities` | 60s poll |

---

## BP_005: Minimal Revenue Flow

### Objective

Record the **first real dollar** in `autonomous_revenue` table.

### Prerequisites

1. ✅ STRIPE_SECRET_KEY configured
2. ⏳ Stripe products/prices created
3. ⏳ At least one `api_products` entry
4. ⏳ At least one `autonomous_agents` entry
5. ⏳ Stripe webhook registered

### Step-by-Step Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│              MINIMAL REVENUE FLOW (10 Steps)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: Create Stripe Product                                  │
│  └─ Name: "API Call Credit"                                     │
│  └─ Price: $0.10 (simplest billable unit)                       │
│                                                                 │
│  STEP 2: Seed API Product                                       │
│  └─ INSERT INTO api_products (name, price_per_call, ...)        │
│  └─ Use free public API (e.g., CoinGecko public)                │
│                                                                 │
│  STEP 3: Seed Agent                                             │
│  └─ INSERT INTO autonomous_agents (...)                         │
│  └─ Status: 'idle', daily_budget: 10.00                         │
│                                                                 │
│  STEP 4: Register Stripe Webhook                                │
│  └─ Go to Stripe Dashboard → Developers → Webhooks              │
│  └─ Add endpoint URL                                            │
│  └─ Select payment_intent.succeeded event                       │
│                                                                 │
│  STEP 5: Create billing-trigger Function                        │
│  └─ Receives: { agent_id, api_product_id, amount }              │
│  └─ Creates: Stripe PaymentIntent                               │
│  └─ Inserts: pending_payments record                            │
│                                                                 │
│  STEP 6: Trigger Brain Cycle                                    │
│  └─ POST /neural-brain/monitor                                  │
│  └─ Creates: market_opportunities                               │
│                                                                 │
│  STEP 7: Create Task                                            │
│  └─ POST /neural-brain/create-task                              │
│  └─ Assigns agent to opportunity                                │
│                                                                 │
│  STEP 8: Execute Agent Task                                     │
│  └─ POST /api-consumer-agent/execute                            │
│  └─ Agent calls API, records metrics                            │
│  └─ Triggers billing-trigger                                    │
│                                                                 │
│  STEP 9: Stripe Processes Payment                               │
│  └─ PaymentIntent created and confirmed (test mode)             │
│  └─ Webhook fires: payment_intent.succeeded                     │
│                                                                 │
│  STEP 10: Revenue Recorded ✅                                    │
│  └─ stripe-webhook inserts into payments                        │
│  └─ autonomous_revenue record created                           │
│  └─ Dashboard shows: $0.10 revenue                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Verification Query

```sql
-- Check if first revenue recorded
SELECT 
  id,
  amount,
  revenue_source,
  status,
  created_at
FROM autonomous_revenue
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 1;

-- Expected result:
-- id: uuid, amount: 0.10, revenue_source: 'api_calls', status: 'collected'
```

---

## Implementation Checklist

### Phase 1: Configuration (Owner Action Required)

- [ ] Create Stripe products and prices in Dashboard
- [ ] Register webhook endpoint in Stripe Dashboard
- [ ] Copy webhook secret to environment

### Phase 2: Data Seeding (Database Inserts)

- [ ] Seed `api_products` with at least 1 entry
- [ ] Seed `autonomous_agents` with at least 1 entry
- [ ] Verify data with SELECT queries

### Phase 3: Function Deployment

- [ ] Create `billing-trigger` edge function
- [ ] Create `agent-scheduler` edge function (optional)
- [ ] Deploy and verify with curl tests

### Phase 4: Dashboard Connection

- [ ] Update `useNeuralBrain` hook with real queries
- [ ] Enable Realtime on revenue tables
- [ ] Replace sample data in chart components

### Phase 5: Activation

- [ ] Trigger first brain cycle
- [ ] Execute first agent task
- [ ] Verify revenue appears in dashboard

---

## Security Considerations

1. **Webhook Signature Verification**: Enable in production
2. **RLS Policies**: Ensure proper row-level security on all tables
3. **Budget Limits**: Enforce daily_budget constraints
4. **Rate Limiting**: Respect API rate limits in agent execution
5. **Error Handling**: Implement retry logic with exponential backoff

---

## Appendix: Database Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ autonomous_     │     │   brain_tasks   │     │  api_products   │
│    agents       │────>│                 │<────│                 │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ assigned_agent  │     │ id              │
│ agent_type      │     │ target_api_id   │     │ seller_id       │
│ status          │     │ status          │     │ price_per_call  │
│ daily_budget    │     │ expected_revenue│     │ api_endpoint    │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │ autonomous_     │
         └─────────────>│    revenue      │
                        ├─────────────────┤
                        │ agent_id        │
                        │ task_id         │
                        │ amount          │
                        │ platform_fee    │
                        │ revenue_source  │
                        └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │    payments     │
                        ├─────────────────┤
                        │ stripe_id       │
                        │ amount          │
                        │ status          │
                        └─────────────────┘
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-10 | System | Initial blueprint |

**Owner Responsibility**: All implementation actions described in this document require explicit execution by the system owner. This blueprint provides specification only — no autonomous execution is triggered by its existence.
