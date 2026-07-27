import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import TradeList, { type TradeRow } from "@/components/TradeList";
import { computeTradeMetrics } from "@/lib/ai/trade-metrics";
import { formatSignedMoney } from "@/lib/format/money";
import { getAccountCurrency } from "@/lib/mt5/account";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Journal",
};

/**
 * The whole journal, capped only against a runaway sync.
 *
 * This was fifty, from before the MetaTrader sync existed and a journal was
 * something you typed by hand. Ninety days of a real account is a few hundred
 * trades, so the page was showing under a quarter of one — and silently, with
 * no "show more" and nothing on screen to say the list had been cut. The
 * per-pair page already reads two thousand, so the same journal answered two
 * different questions depending on which page you asked.
 *
 * The list has filters and every row is compact; several hundred of them is a
 * long page, which is what a journal is. The cap is a guard against a terminal
 * resending years of history, not a window onto the record.
 */
const MAX_TRADES = 2000;

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
    take: MAX_TRADES,
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

  const currency = await getAccountCurrency(userId);

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

  // Every trade with a result, not only the ones that had a stop. These tiles
  // used to count R, which existed on well under half the journal.
  const closed = trades.filter((t) => t.pnl !== null);
  const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;

  return (
    <>
      <PageHeader
        title="Journal"
        subtitle="Every closed trade, straight from your terminal. Nothing here is typed by hand."
      />

      <div className="space-y-4">
        {closed.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card title="Closed trades">
              <p className="text-2xl font-semibold tracking-tight">
                {closed.length}
              </p>
            </Card>
            <Card title="Total P&L">
              <p
                className={`text-2xl font-semibold tracking-tight ${
                  totalPnl > 0
                    ? "text-positive"
                    : totalPnl < 0
                      ? "text-negative"
                      : ""
                }`}
              >
                {formatSignedMoney(totalPnl, currency)}
              </p>
            </Card>
            <Card title="Win rate">
              <p className="text-2xl font-semibold tracking-tight">
                {Math.round((wins / closed.length) * 100)}%
              </p>
            </Card>
            <Card title="Average">
              <p className="text-2xl font-semibold tracking-tight">
                {formatSignedMoney(totalPnl / closed.length, currency)}
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
            <TradeList trades={trades} currency={currency} />
          )}
        </Card>
      </div>
    </>
  );
}
