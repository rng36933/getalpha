# getALPHA

A trading desk: price charts, an economic calendar, a trade journal, and two
Claude-powered features — a pre-session risk brief and a post-trade process
review.

Domain: [getalpha.org](https://getalpha.org) (not deployed yet).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4, dark theme only
- Prisma 7 + PostgreSQL, `Decimal` columns for every money value
- Anthropic Claude (`claude-opus-5`) with schema-constrained JSON output
- `lightweight-charts` for candlesticks

## Running locally

```bash
npm install
cp .env.example .env              # then fill it in
npx prisma dev --name getalpha    # local Postgres, prints the connection string
npx prisma db push
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | `prisma generate` then a production build |
| `npm test` | Unit tests for trade metrics and AI pricing |
| `npm run lint` | ESLint |

## Design notes

**Every number in an AI review is computed in code, never by the model.**
R-multiples, planned reward-to-risk, risk as a percentage of equity and
holding times come from `src/lib/ai/trade-metrics.ts`; the model receives them
as finished figures and only judges them. A language model will confidently
misreport an R-multiple, and a review built on a wrong R is worse than no
review.

**`contractSize` matters.** Brokers quote size in lots and one XAUUSD lot is
100 ounces, so risk is `riskPerUnit × size × contractSize`. Omitting the
factor makes every R-multiple wrong by that factor.

**AI spend is capped per UTC day.** Every call is written to `AiUsageLog` with
its cost, and a call whose worst case would breach `AI_DAILY_BUDGET_USD`
(default $2) is refused with HTTP 402 before it is sent.

## API

| Route | Purpose |
|---|---|
| `GET/POST /api/trades` | Trade journal |
| `POST /api/ai/session-brief` | Three-point pre-session risk brief |
| `POST /api/ai/coach` | Process review of one trade |
| `GET /api/ai/usage` | Today's AI spend against the budget |
