/**
 * The cumulative R curve — the one chart a trading journal is expected to have,
 * and the one this desk did not draw.
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
  /** 1-based position in the sequence of scored trades. */
  n: number;
  /** When the trade closed, ISO. For the tooltip, not for the axis. */
  at: string;
  asset: string;
  /** This trade's own R. */
  r: number;
  /** Cumulative R after it. */
  cumulative: number;
};

export type RCurve = {
  points: CurvePoint[];
  /** Lowest and highest the cumulative line reaches, including the zero start. */
  min: number;
  max: number;
  /** Where the line ends — the same figure as total R. */
  final: number;
  /**
   * The largest peak-to-trough fall in cumulative R, as a positive number.
   *
   * The number a curve exists to show and a total hides: +8R reached by a smooth
   * climb and +8R reached after being 14R underwater are the same total and not
   * remotely the same account.
   */
  maxDrawdownR: number;
};

/** A trade the curve can use: closed, with a defined risk, so an R exists. */
export type ScoredTrade = {
  closedAt: Date | null;
  createdAt: Date;
  asset: string;
  realizedR: number | null;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Builds the curve from whatever in the journal has an R.
 *
 * Sorted by when each trade closed, falling back to when it opened for a row
 * that has an R but no close time — the order has to be the order the account
 * actually experienced, or the drawdown is measured against a sequence that
 * never happened.
 */
export function buildRCurve(trades: ScoredTrade[]): RCurve | null {
  const scored = trades
    .filter(
      (trade): trade is ScoredTrade & { realizedR: number } =>
        trade.realizedR !== null,
    )
    .sort(
      (a, b) =>
        (a.closedAt ?? a.createdAt).getTime() -
        (b.closedAt ?? b.createdAt).getTime(),
    );

  // One point is a dot, not a curve. Below two there is no shape to read and a
  // line drawn through a single trade implies a trend that does not exist.
  if (scored.length < 2) return null;

  const points: CurvePoint[] = [];
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  scored.forEach((trade, index) => {
    cumulative += trade.realizedR;

    // Measured from the running peak, which is what a drawdown is: how far
    // below its own best the account has been, not how far below zero.
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    points.push({
      n: index + 1,
      at: (trade.closedAt ?? trade.createdAt).toISOString(),
      asset: trade.asset,
      r: round(trade.realizedR, 2),
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
    maxDrawdownR: round(maxDrawdown, 2),
  };
}
