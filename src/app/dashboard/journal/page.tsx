import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import TradeList, { type TradeRow } from "@/components/TradeList";
import { computeTradeMetrics } from "@/lib/ai/trade-metrics";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Journal",
};

/** Enough to see a pattern without turning the page into a report. */
const PAGE_SIZE = 50;

/**
 * Read straight from the database rather than through /api/trades.
 *
 * The route exists for the browser; a server component calling its own HTTP
 * endpoint pays for a second round trip and a second authentication to reach
 * data it could already read.
 */
async function loadTrades(userId: string): Promise<TradeRow[]> {
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
  });

  return trades.map((trade) => ({
    id: trade.id,
    asset: trade.asset,
    direction: trade.direction,
    setup: trade.setup,
    timeframe: trade.timeframe,
    entryPrice: trade.entryPrice.toNumber(),
    exitPrice: trade.exitPrice?.toNumber() ?? null,
    pnl: trade.pnl?.toNumber() ?? null,
    createdAt: trade.createdAt.toISOString(),
    source: trade.source,
    marketContext: trade.marketContext,
    emotionalState: trade.emotionalState,
    // The same function the AI review is given, so the number on screen and
    // the number the model judges can never disagree.
    metrics: computeTradeMetrics(trade),
  }));
}

export default async function JournalPage() {
  const { userId } = await auth();

  let trades: TradeRow[] = [];
  let failed = false;

  if (userId) {
    try {
      trades = await loadTrades(userId);
    } catch (error) {
      console.error("Could not load the journal:", error);
      failed = true;
    }
  }

  const closed = trades.filter((t) => t.metrics.realizedR !== null);
  const totalR = closed.reduce((sum, t) => sum + (t.metrics.realizedR ?? 0), 0);
  const wins = closed.filter((t) => (t.metrics.realizedR ?? 0) > 0).length;

  return (
    <>
      <PageHeader
        title="Journal"
        subtitle="Every closed trade, straight from your terminal. The R-multiple is computed, never typed."
      />

      <div className="space-y-4">
        {closed.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card title="Closed trades">
              <p className="text-2xl font-semibold tracking-tight">
                {closed.length}
              </p>
            </Card>
            <Card title="Total R">
              <p
                className={`text-2xl font-semibold tracking-tight ${
                  totalR > 0 ? "text-positive" : totalR < 0 ? "text-negative" : ""
                }`}
              >
                {totalR > 0 ? "+" : ""}
                {totalR.toFixed(2)}
              </p>
            </Card>
            <Card title="Win rate">
              <p className="text-2xl font-semibold tracking-tight">
                {Math.round((wins / closed.length) * 100)}%
              </p>
            </Card>
            <Card title="Average R">
              <p className="text-2xl font-semibold tracking-tight">
                {(totalR / closed.length).toFixed(2)}
              </p>
            </Card>
          </div>
        ) : null}

        <Card title="Trade log">
          {failed ? (
            <p className="py-8 text-center text-sm text-muted">
              Your trades could not be loaded just now. Reload in a moment —
              nothing has been lost.
            </p>
          ) : (
            <TradeList trades={trades} />
          )}
        </Card>
      </div>
    </>
  );
}
