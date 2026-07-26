/**
 * The cumulative P&L curve — the account, trade by trade.
 *
 * Replaces the R curve on screen. R answered "was the decision sound", which is
 * the better question and the one this product argues for, but it exists only
 * where a stop was recorded: on this desk's own journal that is 69 trades out of
 * 220. The curve people actually came to see was being drawn from under a third
 * of their history. R still exists inside `trade-metrics.ts`, where the AI coach
 * reads it — the swap is what a user sees, not what the model is given.
 *
 * Plotted against trade number rather than the calendar. A dozen trades spread
 * over three months drawn on a date axis is mostly empty space with a few marks
 * huddled together, and the question the curve answers — "is the edge
 * compounding or leaking?" — is a question about the sequence of decisions, not
 * about which Tuesdays they fell on.
 *
 * Takes finished numbers, no imports: this is arithmetic, so `npm test` can
 * reach it directly.
 */

export type CurvePoint = {
  /** 1-based position in the sequence of closed trades. */
  n: number;
  /** When the trade closed, ISO. For the tooltip, not for the axis. */
  at: string;
  asset: string;
  /** This trade's own realised P&L, in the account currency. */
  pnl: number;
  /** Cumulative P&L after it. */
  cumulative: number;
};

export type PnlCurve = {
  points: CurvePoint[];
  /** Lowest and highest the cumulative line reaches, including the zero start. */
  min: number;
  max: number;
  /** Where the line ends — the same figure as total P&L. */
  final: number;
  /**
   * The largest peak-to-trough fall in cumulative P&L, as a positive number.
   *
   * The number a curve exists to show and a total hides: +€800 reached by a
   * smooth climb and +€800 reached after being €1,400 underwater are the same
   * total and not remotely the same account.
   */
  maxDrawdown: number;
};

/** A trade the curve can use: closed, with a realised P&L. */
export type ClosedTrade = {
  closedAt: Date | null;
  createdAt: Date;
  asset: string;
  pnl: number | null;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Builds the curve from every closed trade that has a P&L.
 *
 * Sorted by when each trade closed, falling back to when it opened for a row
 * that has a result but no close time — the order has to be the order the
 * account actually experienced, or the drawdown is measured against a sequence
 * that never happened.
 */
export function buildPnlCurve(trades: ClosedTrade[]): PnlCurve | null {
  const closed = trades
    .filter((trade): trade is ClosedTrade & { pnl: number } => trade.pnl !== null)
    .sort(
      (a, b) =>
        (a.closedAt ?? a.createdAt).getTime() -
        (b.closedAt ?? b.createdAt).getTime(),
    );

  // One point is a dot, not a curve. Below two there is no shape to read and a
  // line drawn through a single trade implies a trend that does not exist.
  if (closed.length < 2) return null;

  const points: CurvePoint[] = [];
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  closed.forEach((trade, index) => {
    cumulative += trade.pnl;

    // Measured from the running peak, which is what a drawdown is: how far
    // below its own best the account has been, not how far below zero.
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    points.push({
      n: index + 1,
      at: (trade.closedAt ?? trade.createdAt).toISOString(),
      asset: trade.asset,
      pnl: round(trade.pnl, 2),
      cumulative: round(cumulative, 2),
    });
  });

  const values = points.map((point) => point.cumulative);

  return {
    points,
    // Zero is always in range, so the baseline is always on the chart. A curve
    // that never shows its own zero line lets a losing account look like a
    // gently rising one.
    min: round(Math.min(0, ...values), 2),
    max: round(Math.max(0, ...values), 2),
    final: round(cumulative, 2),
    maxDrawdown: round(maxDrawdown, 2),
  };
}
