import type { Trade } from "@/generated/prisma/client";
import { computeTradeMetrics } from "@/lib/ai/trade-metrics";
import { buildPnlCurve, type PnlCurve } from "./pnl-curve";
import {
  buildPnlDistribution,
  type PnlDistribution,
} from "./pnl-distribution";

/**
 * Everything the dashboard cards show, computed from the journal.
 *
 * One pass over the trades rather than a query per card: the page renders on
 * the server and every card wants the same rows.
 */

export type OpenPosition = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  /** Currency at risk if the stop is hit. Null when no stop was recorded. */
  riskAmount: number | null;
  riskPercent: number | null;
  /**
   * A stop exists in the terminal, even though riskPercent is null.
   *
   * True when the stop has been moved to the profit side of entry (locking
   * in a gain rather than capping a loss) — riskAmount has no meaning there,
   * but it is not the same situation as no stop existing at all.
   */
  stopWasSet: boolean;
  openedAt: string;
};

export type ClosedTrade = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  pnl: number | null;
  closedAt: string;
};

export type Exposure = {
  asset: string;
  /** Currency at risk across open positions in this instrument. */
  riskAmount: number;
  /** Share of total open risk, 0–100. */
  share: number;
};

export type Performance = {
  closedCount: number;
  winRatePercent: number | null;
  /** Sum of realised P&L across closed trades, in the account currency. */
  totalPnl: number | null;
  /** Average result per trade — the number that says whether the edge is real. */
  expectancyPnl: number | null;
  /**
   * Gross winnings divided by gross losses.
   *
   * Null rather than Infinity when there are no losses yet: a profit factor
   * with no losing trades in it is not a fact about an edge, it is a fact
   * about a small sample.
   */
  profitFactor: number | null;
  /** Trades with no stop recorded — undefined risk, worth surfacing. */
  withoutStop: number;
};

export type DashboardSummary = {
  openPositions: OpenPosition[];
  recentTrades: ClosedTrade[];
  exposure: Exposure[];
  performance: Performance;
  /** Null until there are two closed trades to draw a line through. */
  pnlCurve: PnlCurve | null;
  /** Null until at least one trade has a result. */
  pnlDistribution: PnlDistribution | null;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function summariseTrades(trades: Trade[]): DashboardSummary {
  const openPositions: OpenPosition[] = [];
  const closed: Trade[] = [];
  const riskByAsset = new Map<string, number>();

  let withoutStop = 0;

  for (const trade of trades) {
    const metrics = computeTradeMetrics(trade);

    if (!metrics.flags.stopWasSet) withoutStop += 1;

    // Open means no exit was recorded, which is also how the metrics decide.
    if (metrics.exitClassification === "STILL_OPEN") {
      openPositions.push({
        id: trade.id,
        asset: trade.asset,
        direction: trade.direction,
        entryPrice: trade.entryPrice.toNumber(),
        riskAmount: metrics.riskAmount,
        riskPercent: metrics.riskPercent,
        stopWasSet: metrics.flags.stopWasSet,
        openedAt: trade.createdAt.toISOString(),
      });

      if (metrics.riskAmount !== null) {
        riskByAsset.set(
          trade.asset,
          (riskByAsset.get(trade.asset) ?? 0) + metrics.riskAmount,
        );
      }

      continue;
    }

    closed.push(trade);
  }

  /* ------------------------------------------------------------- exposure */

  const totalRisk = [...riskByAsset.values()].reduce((sum, r) => sum + r, 0);

  const exposure: Exposure[] = [...riskByAsset.entries()]
    .map(([asset, riskAmount]) => ({
      asset,
      riskAmount: round(riskAmount, 2),
      share: totalRisk > 0 ? round((riskAmount / totalRisk) * 100, 1) : 0,
    }))
    .sort((a, b) => b.riskAmount - a.riskAmount);

  /* ---------------------------------------------------------- performance */

  // Every closed trade with a result, not only the ones that had a stop. That
  // is the whole point of the swap: on this desk's own journal, R existed on 69
  // trades out of 220, so every figure below used to describe under a third of
  // the account it claimed to summarise.
  const results = closed
    .map((trade) => trade.pnl?.toNumber() ?? null)
    .filter((pnl): pnl is number => pnl !== null);

  const wins = results.filter((pnl) => pnl > 0);
  const losses = results.filter((pnl) => pnl < 0);

  const grossWin = wins.reduce((sum, pnl) => sum + pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0));
  const totalPnl = results.reduce((sum, pnl) => sum + pnl, 0);

  const performance: Performance = {
    closedCount: closed.length,
    winRatePercent:
      results.length > 0 ? round((wins.length / results.length) * 100, 0) : null,
    totalPnl: results.length > 0 ? round(totalPnl, 2) : null,
    expectancyPnl:
      results.length > 0 ? round(totalPnl / results.length, 2) : null,
    profitFactor: grossLoss > 0 ? round(grossWin / grossLoss, 2) : null,
    withoutStop,
  };

  /* -------------------------------------------------------- recent trades */

  const recentTrades: ClosedTrade[] = closed.slice(0, 6).map((trade) => ({
    id: trade.id,
    asset: trade.asset,
    direction: trade.direction,
    pnl: trade.pnl?.toNumber() ?? null,
    closedAt: (trade.closedAt ?? trade.createdAt).toISOString(),
  }));

  /* ------------------------------------------------------------- the curve */

  // Built from the same `closed` set the figures above come from, so the line
  // and the total can never disagree about what happened.
  const pnlCurve = buildPnlCurve(
    closed.map((trade) => ({
      closedAt: trade.closedAt,
      createdAt: trade.createdAt,
      asset: trade.asset,
      pnl: trade.pnl?.toNumber() ?? null,
    })),
  );

  const pnlDistribution = buildPnlDistribution(results);

  return {
    openPositions,
    recentTrades,
    exposure,
    performance,
    pnlCurve,
    pnlDistribution,
  };
}
