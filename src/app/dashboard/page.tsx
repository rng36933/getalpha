import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Card from "@/components/Card";
import ChartCard from "@/components/ChartCard";
import DataQualityNotice from "@/components/DataQualityNotice";
import DayTapeReadout from "@/components/DayTapeReadout";
import Mt5Prompt from "@/components/Mt5Prompt";
import PageHeader from "@/components/PageHeader";
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
import FirstRun from "@/components/dashboard/FirstRun";
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

/** Nothing older matters to a dashboard; the journal holds the full record. */
const SUMMARY_WINDOW = 200;

/**
 * Open positions are read separately, and without that window.
 *
 * "The newest 200 trades" is a sound rule for the statistics — a curve does not
 * change shape for the two hundred and first — but it is the wrong rule for
 * open positions, because *open* has nothing to do with *recent*. A position
 * opened months ago and still running drops out of the window the moment two
 * hundred newer trades exist, and then vanishes from the card whose entire job
 * is to show it. Nothing on the page would look broken; it would simply say
 * nothing is open, which is the most expensive kind of wrong.
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
    const connection = await prisma.mtConnection.findUnique({
      where: { userId },
      select: { lastSeenAt: true, currency: true },
    });

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

  const [{ entries, instrument }, summary, mt5, briefAudience] = await Promise.all([
    loadWatchlist(symbol),
    loadSummary(userId),
    loadMt5State(userId),
    // Resolved here so the card states what it covers on first paint, rather
    // than claiming a coverage it has to correct once the reader presses a
    // session. The route resolves it again on its own; this is a label, not a
    // permission, and the route never trusts what the client was told.
    userId ? resolveBriefAudience(userId) : Promise.resolve(defaultAudience()),
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

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          title={`${tapeInstrument.label} — this session`}
          className="xl:col-span-2"
        >
          {choices.length > 1 ? (
            <nav className="mb-4 flex flex-wrap gap-2">
              {choices.map((choice) => {
                const active = choice.symbol === tapeInstrument.symbol;

                return (
                  <Link
                    key={choice.symbol}
                    href={`/dashboard?tape=${encodeURIComponent(choice.symbol)}`}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
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
        </Card>

        <Card title={`News naming ${tapeInstrument.label}`}>
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
        </Card>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2">
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
        </div>
        {/* The one card on the desk allowed to glow. Violet is the same signal
            the landing page's Pro column uses, and it says "this one costs
            money to run" rather than "get excited". */}
        <Card title="AI Session Brief" className="glow-ai">
          <SessionBriefPanel
            instruments={briefAudience.symbols.map((entry) => entry.label)}
            personalised={briefAudience.personalised}
            truncated={briefAudience.truncated}
          />
        </Card>
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
        {/* There is no Signal Feed card and there will not be one. The landing
            page says this product never tells anyone what to trade, and a
            dashboard promising a signal stream would contradict it. Macro
            Snapshot went too — it belongs on the Macro Desk, next to the data
            it summarises. */}

        <Card title="Open positions">
          <OpenPositions positions={summary.openPositions} />
        </Card>

        <Card title="Risk exposure">
          <RiskExposure exposure={summary.exposure} currency={mt5.currency} />
        </Card>

        <Card title="Recent trades">
          <RecentTrades trades={summary.recentTrades} currency={mt5.currency} />
        </Card>

        {/* Summary before detail: the shape of the account first, the figures
            that describe it underneath. */}
        {summary.pnlCurve ? (
          <Card
            title="Cumulative P&L, trade by trade"
            className="md:col-span-2 xl:col-span-3"
          >
            <PnlCurve curve={summary.pnlCurve} currency={mt5.currency} />
          </Card>
        ) : null}

        {summary.pnlDistribution ? (
          <Card
            title="Where the results land"
            className="md:col-span-2 xl:col-span-3"
          >
            <PnlDistribution
              data={summary.pnlDistribution}
              currency={mt5.currency}
            />
          </Card>
        ) : null}

        <Card title="Performance" className="md:col-span-2 xl:col-span-3">
          <PerformanceStats
            performance={summary.performance}
            currency={mt5.currency}
          />
        </Card>
      </div>
    </>
  );
}
