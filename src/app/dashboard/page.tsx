import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import DataQualityNotice from "@/components/DataQualityNotice";
import PageHeader from "@/components/PageHeader";
import PriceChart from "@/components/PriceChart";
import { fetchDailyCandles } from "@/lib/market-data/candles";
import { getWatchlist } from "@/lib/watchlist";

/** Shown when the watchlist cannot be read, so the chart still has a symbol. */
const DEFAULT_INSTRUMENT = { symbol: "XAU/USD", label: "XAUUSD" };

/**
 * The instrument the main chart shows: the top of the user's watchlist.
 *
 * A database hiccup here must not take the dashboard down with it — the page is
 * mostly other modules, and one card falling back to gold is a smaller loss
 * than an error screen.
 */
async function primaryInstrument() {
  // Deliberately outside the try: `auth()` throws a control-flow error during
  // static generation to mark the route dynamic, and swallowing it would let
  // this page be prerendered with somebody else's default instrument.
  const { userId } = await auth();
  if (!userId) return DEFAULT_INSTRUMENT;

  try {
    const [first] = await getWatchlist(userId);
    return first ? { symbol: first.symbol, label: first.label } : DEFAULT_INSTRUMENT;
  } catch (error) {
    console.error("Dashboard could not read the watchlist:", error);
    return DEFAULT_INSTRUMENT;
  }
}

export default async function DashboardPage() {
  const instrument = await primaryInstrument();
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
        <Card title="Equity Curve" hint="Chart module" height="h-56" />
        <Card
          title="Account Summary"
          hint="Balance / equity / drawdown"
          height="h-56"
        />
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
