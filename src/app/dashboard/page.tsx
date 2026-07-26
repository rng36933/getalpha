import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import DataQualityNotice from "@/components/DataQualityNotice";
import PageHeader from "@/components/PageHeader";
import PriceChart from "@/components/PriceChart";
import SessionBriefPanel from "@/components/SessionBriefPanel";
import WatchlistManager from "@/components/WatchlistManager";
import { fetchDailyCandles } from "@/lib/market-data/candles";
import { MAX_WATCHLIST_SIZE, getWatchlist } from "@/lib/watchlist";

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
  const { entries, instrument } = await loadWatchlist(symbol);
  const candles = await fetchDailyCandles(instrument.symbol);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of the desk. Modules will be plugged into the cards below."
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
        <Card title="Open Positions" hint="Positions table" />
        <Card title="Signal Feed" hint="Live signal stream" />
        <Card title="Risk Exposure" hint="Exposure by symbol" />
        <Card title="Macro Snapshot" hint="Key macro readings" />
        <Card title="Recent Trades" hint="Closed trades list" />
        <Card title="Performance Stats" hint="Win rate / PF / expectancy" />
      </div>
    </>
  );
}
