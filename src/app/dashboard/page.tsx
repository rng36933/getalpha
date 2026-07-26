import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import DataQualityNotice from "@/components/DataQualityNotice";
import PageHeader from "@/components/PageHeader";
import PriceChart from "@/components/PriceChart";
import SessionBriefPanel from "@/components/SessionBriefPanel";
import WatchlistManager from "@/components/WatchlistManager";
import {
  OpenPositions,
  PerformanceStats,
  RecentTrades,
  RiskExposure,
} from "@/components/dashboard/DeskCards";
import { summariseTrades, type DashboardSummary } from "@/lib/dashboard/summary";
import { fetchDailyCandles } from "@/lib/market-data/candles";
import { prisma } from "@/lib/prisma";
import { MAX_WATCHLIST_SIZE, getWatchlist } from "@/lib/watchlist";

/** Nothing older matters to a dashboard; the journal holds the full record. */
const SUMMARY_WINDOW = 200;

const EMPTY_SUMMARY: DashboardSummary = {
  openPositions: [],
  recentTrades: [],
  exposure: [],
  performance: {
    closedCount: 0,
    winRatePercent: null,
    totalR: null,
    expectancyR: null,
    profitFactor: null,
    withoutStop: 0,
  },
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
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: SUMMARY_WINDOW,
    });

    return summariseTrades(trades);
  } catch (error) {
    console.error("Dashboard could not summarise the journal:", error);
    return EMPTY_SUMMARY;
  }
}

/** Shown when the watchlist cannot be read, so the chart still has a symbol. */
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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const { symbol } = await searchParams;
  const { userId } = await auth();

  const [{ entries, instrument }, summary] = await Promise.all([
    loadWatchlist(symbol),
    loadSummary(userId),
  ]);

  const candles = await fetchDailyCandles(instrument.symbol);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="What is open, what it risks, and how the closed trades have gone."
      />

      <DataQualityNotice
        sources={[{ label: `${instrument.label} price history`, result: candles }]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title={`${instrument.label} · D1`} className="md:col-span-2">
          {candles.data.length > 0 ? (
            <PriceChart data={candles.data} height={280} />
          ) : (
            <p className="grid h-[280px] place-items-center text-center text-sm text-muted">
              No price history available for {instrument.label} right now.
            </p>
          )}
        </Card>
        <Card title="AI Session Brief">
          <SessionBriefPanel />
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
          <RiskExposure exposure={summary.exposure} />
        </Card>

        <Card title="Recent trades">
          <RecentTrades trades={summary.recentTrades} />
        </Card>

        <Card title="Performance" className="md:col-span-2 xl:col-span-3">
          <PerformanceStats performance={summary.performance} />
        </Card>
      </div>
    </>
  );
}
