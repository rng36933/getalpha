# getALPHA

A trading desk: price charts, an economic calendar, a trade journal, a macro
desk, MetaTrader sync, and two Claude-powered features — a pre-session risk
brief and a post-trade process review.

Live at [www.getalpha.org](https://www.getalpha.org), deployed from `main` on
Vercel.

Free covers the journal, charts, calendar and watchlist. Pro (€19.99/mo,
€99.99/yr) adds the two AI modules, which are the only parts that cost money to
run.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4, dark theme only
- Prisma 7 + PostgreSQL (Neon), `Decimal` columns for every money value
- Clerk for auth, Stripe for billing
- Anthropic Claude (`claude-opus-5`) with schema-constrained JSON output
- `lightweight-charts` for candlesticks
- Market data: Twelve Data (prices), ForexFactory (calendar), RSS (news),
  FRED (macro), CFTC (positioning)

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
| `npm test` | Unit tests (trade metrics, AI pricing, redaction, rate limits, …) |
| `npm run lint` | ESLint |

`scripts/check-deploy-limits.mjs` runs in CI and fails the build on anything
Vercel's Hobby plan rejects at deploy time — `maxDuration` outside 1–60, or a
`vercel.json` the deploy validator reads more strictly than the published
schema. Those failures produce no build output at all, so they are caught here
instead.

## Going live

`docs/go-live.md` lists what is still configuration rather than code: Stripe in
live mode, the Clerk production instance, the environment variables that
silently disable finished features, and the legal placeholders.

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

**Facts about the user, never predictions about the market.** The AI modules
describe what the trader's own record shows. They do not say what to trade
next: that is a recommendation, and a paid recommendation is regulated activity
in the EU.

**MetaTrader sync holds no broker credential.** `public/getALPHA-Sync.mq5` is
shipped as source so "it only sends" can be checked. The terminal posts to us
with a per-user bearer token; nothing here can reach the account.

## API

| Route | Purpose |
|---|---|
| `GET/POST /api/trades` | Trade journal |
| `POST /api/ai/session-brief` | Three-point pre-session risk brief |
| `POST /api/ai/coach` | Process review of one trade |
| `GET /api/ai/usage` | Today's AI spend against the budget |
| `GET/POST /api/watchlist` | Watchlist, capped at 8 symbols by the data tier |
| `GET /api/instruments` | Instrument search |
| `POST /api/mt5/sync` | Trades pushed by the MetaTrader EA |
| `GET/POST /api/mt5/connection` | The EA's per-user token |
| `POST /api/billing/checkout` | Stripe checkout session |
| `POST /api/billing/webhook` | Stripe subscription state |
| `POST /api/support` | Support tickets |
| `POST /api/waitlist` | Landing-page waitlist |
| `POST /api/legal/accept` | Consent record |
| `GET /api/cron/daily-brief` | Morning email, `CRON_SECRET` guarded |
| `POST /api/webhooks/clerk` | Account deletion (GDPR) |
