import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Card from "@/components/Card";
import ChartCard from "@/components/ChartCard";
import DataQualityNotice from "@/components/DataQualityNotice";
import DayTapeReadout from "@/components/DayTapeReadout";
import Mt5Prompt from "@/components/Mt5Prompt";
import PageHeader from "@/components/PageHeader";
import LiveLogPanel from "@/components/LiveLogPanel";
import PairNews from "@/components/PairNews";
import PnlCurve from "@/components/PnlCurve";
import PnlDistribution from "@/components/PnlDistribution";
import SessionBriefPanel from "@/components/SessionBriefPanel";
import WatchlistManager from "@/components/WatchlistManager";
import {
  OpenPositions,
  PerformanceStats,
  RecentTrades,
  RiskExposure,
} from "@/components/dashboard/DeskCards";
import DraggableGrid, {
  type GridItem,
} from "@/components/dashboard/DraggableGrid";
import FirstRun from "@/components/dashboard/FirstRun";
import {
  DASHBOARD_CARD_KEYS,
  type DashboardCardKey,
} from "@/lib/dashboard/card-keys";
import { loadOrder, resolveOrder } from "@/lib/dashboard/layout";
import { summariseTrades, type DashboardSummary } from "@/lib/dashboard/summary";
import {
  TIMEFRAMES,
  fetchCandles,
  parseTimeframe,
} from "@/lib/market-data/candles";
import {
  defaultAudience,
  resolveBriefAudience,
} from "@/lib/market-data/brief-audience";
import { fetchNewsHeadlines } from "@/lib/market-data/news";
import { headlinesFor } from "@/lib/market-data/relevance";
import { computeDayTape } from "@/lib/market-data/tape";
import { prisma } from "@/lib/prisma";
import { MAX_WATCHLIST_SIZE, getWatchlist } from "@/lib/watchlist";

/**
 * Same cap the Journal and Pairs pages read, so the three pages describe the
 * same account.
 *
 * This used to be 200, on the reasoning that a curve's shape does not change
 * for the two hundred and first trade. True for the curve's shape, false for
 * `Performance`'s totals sitting right beside it — closed count, total P&L and
 * win rate are sums over whatever was queried, and every trade past 200 was
 * silently missing from them. An account past that mark showed one number on
 * the Dashboard and a different, correct one on the Journal, which is the one
 * kind of disagreement this product cannot afford to ship.
 */
const SUMMARY_WINDOW = 2000;

/**
 * Open positions are read separately, and without `SUMMARY_WINDOW` at all.
 *
 * `SUMMARY_WINDOW` is the newest N trades, and *open* has nothing to do with
 * *recent* — a position opened months ago and still running would drop out of
 * that window the moment enough newer trades exist, and then vanish from the
 * card whose entire job is to show it. Nothing on the page would look broken;
 * it would simply say nothing is open, which is the most expensive kind of
 * wrong. So this is queried on its own, capped only against a runaway sync.
 *
 * Capped anyway, since an unbounded query on a request path is how a page
 * eventually dies. Nobody holds a hundred positions at once, and if they do,
 * the card was unreadable long before this mattered.
 */
const OPEN_POSITION_CAP = 100;

const EMPTY_SUMMARY: DashboardSummary = {
  openPositions: [],
  recentTrades: [],
  exposure: [],
  performance: {
    closedCount: 0,
    winRatePercent: null,
    totalPnl: null,
    expectancyPnl: null,
    profitFactor: null,
    withoutStop: 0,
  },
  pnlCurve: null,
  pnlDistribution: null,
};

/**
 * The journal, summarised for the cards.
 *
 * One query for four cards. Failing here empties them rather than taking the
 * page down — the chart and the brief are independent of it.
 */
async function loadSummary(userId: string | null): Promise<DashboardSummary> {
  if (!userId) return EMPTY_SUMMARY;

  try {
    const [recent, open] = await Promise.all([
      prisma.trade.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: SUMMARY_WINDOW,
      }),
      // No exit recorded is what `summariseTrades` and the trade metrics both
      // mean by open, so the filter has to be the same one or the card and the
      // classification could disagree.
      prisma.trade.findMany({
        where: { userId, exitPrice: null },
        orderBy: { createdAt: "desc" },
        take: OPEN_POSITION_CAP,
      }),
    ]);

    // Merged by id, because an open position recent enough to be in the window
    // is in both lists — and counted twice it would double this account's
    // apparent risk exposure, which is the one number on the page nobody should
    // ever see inflated.
    const byId = new Map(recent.map((trade) => [trade.id, trade]));
    const older = open.filter((trade) => !byId.has(trade.id));

    // Appended rather than merged in date order. Open trades never reach the
    // closed set, so their position cannot move the curve or the recent list;
    // sorting the union would be work with no visible effect.
    return summariseTrades([...recent, ...older]);
  } catch (error) {
    console.error("Dashboard could not summarise the journal:", error);
    return EMPTY_SUMMARY;
  }
}

/**
 * Whether this account's terminal is set up, and whether it has ever spoken.
 *
 * Two separate facts: a key can exist for weeks while MetaTrader sits closed or
 * blocks the outbound request, and those two states need different things said
 * to them. A failure here hides the prompt rather than the dashboard — pestering
 * somebody who is already synced is worse than saying nothing.
 */
async function loadMt5State(userId: string | null): Promise<{
  connected: boolean;
  receiving: boolean;
  /**
   * The account's currency, as the terminal reported it.
   *
   * Null until a terminal has said, and every money figure on this page is
   * then printed without a symbol. That is deliberate: a P&L labelled in the
   * wrong currency reads as a fact, while a bare number reads as what it is.
   */
  currency: string | null;
  /** When it last sent, so the prompt can tell working from stopped. */
  lastSeenAt: string | null;
}> {
  // `receiving: true` on both failure paths so the prompt stays hidden: a
  // signed-out render or a database hiccup is not evidence that somebody needs
  // to be told to connect their terminal.
  if (!userId) {
    return { connected: false, receiving: true, currency: null, lastSeenAt: null };
  }

  try {
    // A user may have both an MT5 and an MT4 connection now (see the
    // `[userId, platform]` key in schema.prisma) — this prompt cares about
    // whichever terminal is actually talking, not which platform it is, so
    // the one that has sent something most recently wins; a key that exists
    // but has never received beats one that doesn't exist at all.
    const connections = await prisma.mtConnection.findMany({
      where: { userId },
      select: { lastSeenAt: true, currency: true },
      orderBy: { lastSeenAt: { sort: "desc", nulls: "last" } },
    });
    const connection = connections[0] ?? null;

    return {
      connected: connection !== null,
      receiving: connection?.lastSeenAt != null,
      currency: connection?.currency ?? null,
      lastSeenAt: connection?.lastSeenAt?.toISOString() ?? null,
    };
  } catch (error) {
    console.error("Dashboard could not read the MetaTrader connection:", error);
    return { connected: false, receiving: true, currency: null, lastSeenAt: null };
  }
}

/**
 * Gold. The default instrument everywhere on this page, and the fallback when
 * the watchlist cannot be read.
 *
 * Deliberately the focus: the desk is built around it, and every other
 * instrument has to be put on a watchlist before it appears anywhere. It is
 * also what the Session Brief falls back to, so a reader who has chosen
 * nothing sees one instrument consistently rather than a different default per
 * card.
 */
const DEFAULT_INSTRUMENT = { symbol: "XAU/USD", label: "XAUUSD" };

/**
 * The instrument the main chart shows: the top of the user's watchlist.
 *
 * A database hiccup here must not take the dashboard down with it — the page is
 * mostly other modules, and one card falling back to gold is a smaller loss
 * than an error screen.
 */
async function loadWatchlist(requested: string | undefined) {
  // Deliberately outside the try: `auth()` throws a control-flow error during
  // static generation to mark the route dynamic, and swallowing it would let
  // this page be prerendered with somebody else's default instrument.
  const { userId } = await auth();
  if (!userId) return { entries: [], instrument: DEFAULT_INSTRUMENT };

  try {
    const entries = await getWatchlist(userId);

    // The requested symbol is only honoured if it is on their own list. A
    // symbol taken straight from the query string would let anyone spend this
    // account's provider credits on any instrument they liked.
    const chosen =
      entries.find((entry) => entry.symbol === requested) ?? entries[0];

    return {
      entries,
      instrument: chosen
        ? { symbol: chosen.symbol, label: chosen.label }
        : DEFAULT_INSTRUMENT,
    };
  } catch (error) {
    console.error("Dashboard could not read the watchlist:", error);
    return { entries: [], instrument: DEFAULT_INSTRUMENT };
  }
}

/**
 * The instruments the day's readout may be asked for: gold, plus whatever the
 * user put on their watchlist.
 *
 * Gold is always in the list even when the watchlist is empty or unreadable, so
 * the card always has something true to show. Anything not on this list is
 * refused rather than fetched — a symbol taken from the query string would let
 * a stranger spend this account's provider credits on any instrument they liked.
 */
function tapeChoices(entries: { symbol: string; label: string }[]) {
  const choices = [DEFAULT_INSTRUMENT, ...entries];

  return choices.filter(
    (choice, index) =>
      choices.findIndex((other) => other.symbol === choice.symbol) === index,
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string; tf?: string; tape?: string }>;
}) {
  const { symbol, tf, tape: requestedTape } = await searchParams;
  const { userId } = await auth();

  const timeframe = parseTimeframe(tf);

  const [{ entries, instrument }, summary, mt5, briefAudience, savedOrder] =
    await Promise.all([
      loadWatchlist(symbol),
      loadSummary(userId),
      loadMt5State(userId),
      // Resolved here so the card states what it covers on first paint, rather
      // than claiming a coverage it has to correct once the reader presses a
      // session. The route resolves it again on its own; this is a label, not
      // a permission, and the route never trusts what the client was told.
      userId ? resolveBriefAudience(userId) : Promise.resolve(defaultAudience()),
      // A failed read falls back to the default order rather than taking the
      // whole page down over a card's position.
      userId
        ? loadOrder(userId, "dashboard").catch((error) => {
            console.error("Could not read the dashboard layout:", error);
            return null;
          })
        : Promise.resolve(null),
    ]);

  const choices = tapeChoices(
    entries.map((entry) => ({ symbol: entry.symbol, label: entry.label })),
  );
  const tapeInstrument =
    choices.find((choice) => choice.symbol === requestedTape) ?? choices[0];

  // Two series for the readout — the day's own bar comes from D1 and the
  // intraday balance from M15 — and both are cached per symbol@timeframe, so a
  // reload costs nothing. The chart's series is a third only when it is looking
  // at a different instrument or timeframe.
  const [candles, tapeDaily, tapeIntraday, news] = await Promise.all([
    fetchCandles(instrument.symbol, timeframe),
    fetchCandles(tapeInstrument.symbol, "D1"),
    fetchCandles(tapeInstrument.symbol, "M15"),
    fetchNewsHeadlines(),
  ]);

  const dayTape = computeDayTape({
    symbol: tapeInstrument.symbol,
    label: tapeInstrument.label,
    daily: tapeDaily.data,
    intraday: tapeIntraday.data,
  });

  const pairHeadlines = headlinesFor(news.data, tapeInstrument.symbol);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="What is open, what it risks, and how the closed trades have gone."
      />

      <DataQualityNotice
        sources={[
          { label: `${instrument.label} price history`, result: candles },
          { label: `${tapeInstrument.label} daily bars`, result: tapeDaily },
          { label: "News feeds", result: news },
        ]}
      />

      {/* Shown only until there is a single trade to measure. After that the
          cards make the same point better, by being full of the person's own
          numbers. */}
      {summary.performance.closedCount === 0 &&
      summary.openPositions.length === 0 ? (
        <FirstRun />
      ) : null}

      {/* One shared frame with an internal divider instead of two separate
          cards with a gap between them — the session readout and its news
          are one desk, not two boxes that happen to sit side by side. */}
      <div className="surface-static mb-4 grid grid-cols-1 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface xl:grid-cols-3 xl:divide-x xl:divide-y-0">
        <div className="p-4 sm:p-5 xl:col-span-2">
          <h2 className="text-[0.9375rem] font-semibold tracking-tight">
            {tapeInstrument.label} — this session
          </h2>

          <div className="mt-4">
            {choices.length > 1 ? (
              <nav className="mb-4 flex flex-wrap gap-2">
                {choices.map((choice) => {
                  const active = choice.symbol === tapeInstrument.symbol;

                  return (
                    <Link
                      key={choice.symbol}
                      href={`/dashboard?tape=${encodeURIComponent(choice.symbol)}`}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-line text-muted hover:text-foreground"
                      }`}
                    >
                      {choice.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}

            {dayTape ? (
              <DayTapeReadout
                tape={dayTape}
                fetchedAt={tapeDaily.fetchedAt}
                stale={tapeDaily.status === "CACHED"}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted">
                {tapeDaily.status === "UNAVAILABLE"
                  ? `The price feed has nothing stored for ${tapeInstrument.label} yet, so there is nothing true to draw. It fills in on the next successful fetch.`
                  : `Not enough completed bars for ${tapeInstrument.label} to measure a session against. An arrow drawn from one candle would be a guess wearing a measurement's clothes.`}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <h2 className="text-[0.9375rem] font-semibold tracking-tight">
            News naming {tapeInstrument.label}
          </h2>
          <div className="mt-4">
            <PairNews
              headlines={pairHeadlines}
              label={tapeInstrument.label}
              asOf={news.fetchedAt}
              emptyReason={
                news.status === "UNAVAILABLE"
                  ? "The news feeds could not be reached just now. Nothing is stored to fall back on."
                  : undefined
              }
            />
          </div>

          <div className="mt-5">
            <LiveLogPanel />
          </div>
        </div>
      </div>

      {/* Under the session readout, not above it: the gold card is what this
          page is for, and a prompt that pushes it below the fold to advertise a
          setting has its priorities backwards. It disappears once the terminal
          is sending. */}
      <Mt5Prompt
        connected={mt5.connected}
        receiving={mt5.receiving}
        lastSeenAt={mt5.lastSeenAt}
      />

      {(() => {
        // Built in the fixed `DASHBOARD_CARD_KEYS` order, filtered to what
        // this visit actually has something to show for — the curve and the
        // distribution need two closed trades between them, and a key with
        // no card behind it would be a draggable gap.
        const cards: Record<DashboardCardKey, GridItem | null> = {
          chart: {
            key: "chart",
            className: "md:col-span-2",
            children: (
              <ChartCard
                instruments={entries.map((entry) => ({
                  symbol: entry.symbol,
                  label: entry.label,
                }))}
                selectedSymbol={instrument.symbol}
                selectedLabel={instrument.label}
                timeframe={timeframe}
                timeframes={Object.entries(TIMEFRAMES).map(([key, value]) => ({
                  key,
                  label: value.label,
                }))}
                candles={candles.data}
              />
            ),
          },
          // Every card glows gold now, so this one is deliberately violet
          // instead — the signal isn't "glowing" anymore, it's "this one
          // costs money to run" rather than "get excited".
          brief: {
            key: "brief",
            children: (
              <Card title="AI Session Brief" className="glow-ai">
                <SessionBriefPanel
                  instruments={briefAudience.symbols.map((entry) => entry.label)}
                  personalised={briefAudience.personalised}
                  truncated={briefAudience.truncated}
                />
              </Card>
            ),
          },
          watchlist: {
            key: "watchlist",
            children: (
              <Card title="Watchlist">
                <WatchlistManager
                  initialEntries={entries.map((entry) => ({
                    symbol: entry.symbol,
                    label: entry.label,
                    name: entry.name,
                  }))}
                  max={MAX_WATCHLIST_SIZE}
                  selectedSymbol={instrument.symbol}
                />
              </Card>
            ),
          },
          // There is no Signal Feed card and there will not be one. The
          // landing page says this product never tells anyone what to trade,
          // and a dashboard promising a signal stream would contradict it.
          // Macro Snapshot went too — it belongs on the Macro Desk, next to
          // the data it summarises.
          open_positions: {
            key: "open_positions",
            children: (
              <Card title="Open positions">
                <OpenPositions positions={summary.openPositions} />
              </Card>
            ),
          },
          risk_exposure: {
            key: "risk_exposure",
            children: (
              <Card title="Risk exposure">
                <RiskExposure
                  exposure={summary.exposure}
                  currency={mt5.currency}
                />
              </Card>
            ),
          },
          // Merged with the curve below: two cards both reading straight off
          // recent activity, now one — the shape of the account first, the
          // rows that make it up underneath.
          recent_trades: {
            key: "recent_trades",
            children: (
              <Card title="Recent trades" className="h-full">
                {summary.pnlCurve ? (
                  <div className="mb-5 border-b border-line pb-5">
                    <PnlCurve curve={summary.pnlCurve} currency={mt5.currency} />
                  </div>
                ) : null}
                <RecentTrades
                  trades={summary.recentTrades}
                  currency={mt5.currency}
                />
              </Card>
            ),
          },
          // The donut and the stat tiles used to be two separate cards
          // showing overlapping numbers (both had a closed count, both had a
          // win rate) — one card now, the shape of the account first and the
          // figures that describe it underneath, divided rather than bordered
          // twice.
          performance: {
            key: "performance",
            className: "md:col-span-2 xl:col-span-2",
            children: (
              <Card title="Performance" className="h-full">
                {summary.pnlDistribution ? (
                  <div className="mb-5 border-b border-line pb-5">
                    <PnlDistribution
                      data={summary.pnlDistribution}
                      currency={mt5.currency}
                    />
                  </div>
                ) : null}
                <PerformanceStats
                  performance={summary.performance}
                  currency={mt5.currency}
                />
              </Card>
            ),
          },
        };

        const present = DASHBOARD_CARD_KEYS.filter((key) => cards[key] !== null);
        const order = resolveOrder(savedOrder ?? [], present);
        const items = present.map((key) => cards[key]!);

        return (
          <DraggableGrid
            page="dashboard"
            items={items}
            initialOrder={order}
            // `grid-flow-dense` backfills a shorter card into the gap a wider
            // one leaves when it does not fit the rest of its row, rather
            // than leaving that cell empty until the next row starts. Matters
            // more once cards are draggable: any card can end up next to a
            // 2- or 3-wide one now, not just the ones originally laid out
            // that way.
            //
            // `gap-px` on a `bg-zinc-800` container rather than `gap-4`: the
            // background shows through as a single hairline between cards
            // instead of an open gap, so the row reads as one frame — without
            // touching each card's own DOM node, which is what drag-to-reorder
            // is attached to.
            className="grid grid-flow-dense grid-cols-1 gap-px bg-zinc-800 md:grid-cols-2 xl:grid-cols-3"
          />
        );
      })()}
    </>
  );
}
