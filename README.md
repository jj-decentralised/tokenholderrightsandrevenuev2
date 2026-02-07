# Crypto Terminal

**Revenue, Valuation, and Holder Intelligence Terminal**

An institutional-grade web platform that connects protocol revenue to token holder economics, answering one question: *does this token actually reward its holders?*

## Architecture

```
packages/
  api/          # Express API + ingestion workers + scheduler
  web/          # Next.js frontend
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS, Recharts |
| API | Express, TypeScript, Zod validation |
| Database | PostgreSQL (with canonical schema) |
| Ingestion | Provider SDK clients with rate limiting, retry, backfill |
| Scheduling | node-cron (daily/hourly/intraday jobs) |
| Cache | Redis (optional) |

### Data Providers

| Provider | Role | Tier |
|---|---|---|
| DefiLlama | Revenue, fees, TVL, treasuries, emissions | Pro ($300/mo) |
| CoinGecko | Price, market cap, FDV, supply, dev metrics | Analyst ($129/mo) |
| Codex | Holder counts, concentration, wallet analytics | Growth ($350/mo) |

## Quick Start

### Prerequisites

- Node.js >= 20
- PostgreSQL >= 15
- Redis (optional, for caching)

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
npm run migrate

# Seed initial protocol data
npx tsx packages/api/src/db/seeds/initial-protocols.ts

# Start development servers
npm run dev
```

The API runs on `http://localhost:4000` and the frontend on `http://localhost:3000`.

### Running Ingestion Jobs

```bash
# Run all ingestion jobs
npm run ingest -- all

# Run individual jobs
npm run ingest -- revenue
npm run ingest -- market
npm run ingest -- holders
npm run ingest -- compute
```

### Running Tests

```bash
# All tests
npm test

# API tests only
npm run test:api

# Web tests only
npm run test:web
```

## Database Schema

The canonical data model consists of:

- **protocol** - Parent entity (e.g., Jupiter, Aave)
- **sub_product** - Individual products within a protocol
- **token** - Governance/utility tokens linked to protocols
- **token_contract** - Multi-chain token addresses
- **token_rights** - Declared holder rights with classification
- **revenue_daily** - Daily fee/revenue time-series (7 DefiLlama dimensions)
- **token_market_daily** - Daily market data from CoinGecko
- **holder_snapshot** - Daily holder count and concentration snapshots
- **computed_metrics** - Pre-calculated analytics (Real P/E, Productive Score, etc.)
- **restatement_log** - Audit trail for revised historical metrics

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/v1/dashboard/overview` | Aggregate metrics and top protocols |
| `GET /api/v1/revenue/atlas` | Revenue leaderboard with filters |
| `GET /api/v1/ventures/:id/summary` | Protocol detail with all metrics |
| `GET /api/v1/ventures/:id/products` | Sub-product revenue breakdown |
| `GET /api/v1/ventures/:id/revenue-history` | Revenue time-series |
| `GET /api/v1/tokens/:id/holders` | Holder analytics and top holders |
| `GET /api/v1/rights/:tokenId` | Token rights and buyback history |
| `GET /api/v1/screener` | Multi-filter protocol screener |
| `GET /api/v1/methodology/metrics` | Metric definitions and formulas |
| `GET /api/v1/methodology/restatements` | Restatement audit log |
| `GET /api/v1/health` | Health check |

## Novel Metrics

| Metric | Formula |
|---|---|
| **Real P/E** | Market Cap / Annualized Holder Revenue |
| **Holder Revenue Yield** | (Annualized Holder Revenue / Market Cap) x 100 |
| **Revenue Per Holder** | Daily Holder Revenue / Total Holders |
| **Revenue Efficiency** | Holder Revenue / Total Fees x 100 |
| **Productive Token Score** | Composite 0-10 (revenue + maturity + growth + distribution) |

## Frontend Pages

1. **Home** - Protocol Revenue Leaderboard with rankings table
2. **Revenue Atlas** - Revenue breakdown by category, chain, holder allocation
3. **Compare** - Side-by-side protocol comparison (up to 5)
4. **Venture Detail** - Deep-dive with revenue waterfall, rights, holders, financials
5. **Holder Intelligence** - Distribution, concentration, growth analytics
6. **Rights Registry** - Token holder rights classification and evidence
7. **Methodology** - Metric definitions, sources, caveats, restatement policy

## Project Structure

```
packages/api/
  src/
    db/
      migrations/     # SQL migration files (001-005)
      seeds/          # Initial protocol seed data
      connection.ts   # PostgreSQL connection pool
      migrate.ts      # Migration runner
    routes/           # Express route handlers
    services/
      providers/      # DefiLlama, CoinGecko, Codex API clients
      ingestion/      # Data ingestion workers
    jobs/             # Scheduler and CLI runner
    lib/              # Config, rate limiter, time utils, validation
    types/            # TypeScript type definitions
    middleware/       # Error handling, validation middleware
    server.ts         # Express app entry point

packages/web/
  src/
    app/              # Next.js App Router pages
    components/
      ui/             # Reusable UI components
      charts/         # Chart components (Recharts)
    lib/              # API client, formatting utilities
```

## License

Proprietary - decentralised.co
