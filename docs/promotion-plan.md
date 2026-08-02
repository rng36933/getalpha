# Promotion plan

What exists already, what it's for, and the order to pull it in. Written
against the product as it actually is — a free journal/charts/calendar tool
with a paid AI layer on top — not a generic SaaS launch checklist.

## What's already built and unused

Three pieces of growth infrastructure are already in the codebase and idle:

- **Referral codes** (`src/lib/referral/code.ts`, `normaliseReferralCode`,
  the `?ref=` param on `/`). The plumbing exists; there is no reward wired to
  it yet (no "both sides get a month of Pro" logic in `/api/billing`). That's
  the first gap to close, not a promotion channel to build from scratch.
- **Waitlist** (`/api/waitlist`, the "Keep in touch" section on the landing
  page). Useful for capturing interest from people not ready to sign up —
  worth actually emailing when there's news, which the daily-brief cron
  infrastructure (`/api/cron/daily-brief`) shows the project already knows
  how to do.
- **Public changelog** (`/changelog`, `src/lib/changelog.ts`). Currently a
  changelog nobody is pointed at. It's free content and a trust signal
  ("this is actively maintained") — link it from launch posts instead of
  writing "what's new" copy twice.

## Positioning

The differentiated claim, already in the OG image copy: **"a trading desk
that judges your process, not your luck."** Retail trading marketing is
saturated with signals, calls, and "AI picks the trade" claims. getALPHA
explicitly refuses to do that (see `AGENTS.md`'s "facts, never predictions"
rule) — that's a real constraint from EU financial-advice regulation, not a
slogan, and it should be said out loud rather than hidden. It's also the
easiest way to *not* sound like every other trading-tools account: "we don't
tell you what to trade, we tell you why your last ten trades lost money."

Lead with that distinction in every channel below, not with a feature list.

## Channels, in priority order

### 1. Where traders already are (cheapest, do first)

- **r/Forex, r/Daytrading, r/algotrading** — not as ads. Post the trade-test
  interaction from the landing page (`tradeTest` copy block) as a standalone
  "grade your last trade" tool people can try with no signup, then mention
  where it came from in a comment, not the post title. Reddit's trading
  subs downrank anything that reads as self-promotion in the first line.
- **TradingView ideas / Twitter (X) FX and gold accounts** — the MT5 EA
  (`public/getALPHA-Sync.mq5`, shipped as readable source) is a genuine trust
  hook for this audience: "here's the exact script, read it yourself, it
  can't touch your account." That's a stronger opener than screenshots.
- **ForexFactory forum** — the calendar/macro desk data already comes from
  ForexFactory; a respectful mention in their forum (not scraping-adjacent
  spam) reaches exactly the audience that already trusts that data source.

### 2. Content that compounds (medium effort, ongoing)

- One post per month structured as "we looked at N journalled trades and
  found X" — using the AI coach's own output categories (stop-loss discipline,
  R-multiple discipline, news-event exposure) as the framework. This writes
  itself once there's real user data, and it's the kind of concrete, numbers-led
  post that gets shared in trading Discords.
- Publish the `/changelog` link every time something ships — it's already
  written for the product, just needs an audience pointed at it.

### 3. Paid (only after 1–2 show signal)

Small-budget X/TradingView ads targeting the "process discipline" angle, not
generic "trading platform" keywords — those are dominated by brokers with
budgets this product shouldn't try to outbid.

## Mechanics to fix before spending effort on any of the above

1. **Wire a reward to the referral code.** Right now `?ref=` is tracked but
   nothing happens with it — recruiting referrers before the reward exists
   wastes the goodwill.
2. **VAT / OSS registration**, per `docs/go-live.md` — advertising a paid EU
   consumer product before this is resolved creates exposure disproportionate
   to early traffic.
3. **Live Stripe mode**, per `docs/go-live.md` — promotion that lands on a
   sandbox checkout is worse than no promotion.

None of the channel work above is worth starting until (2) and (3) are done;
those aren't marketing tasks, they're prerequisites for taking money from
someone who clicked the ad.

## What to skip

- Paid influencer/"signal" partnerships — directly contradicts the
  process-not-predictions positioning and would undercut the one thing that
  differentiates this from every other trading-tools launch.
- App-store-style review farming or fake testimonials — the trust story here
  (open-source EA, computed-not-guessed metrics) is the asset; don't spend it.
