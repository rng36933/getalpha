/**
 * Where a trader's outcomes actually land, in R.
 *
 * The question a total cannot answer. An expectancy of +0.2R can come from
 * grinding out small wins against honoured stops, or from one enormous win
 * carrying a pile of losses twice the size they were supposed to be — the same
 * average, two completely different accounts, and only the shape tells them
 * apart.
 *
 * Arithmetic, no imports, so `npm test` reaches it directly.
 */

export type Bin = {
  key: string;
  /** Axis label. Empty for bins that share a label with their neighbour. */
  label: string;
  /** Inclusive lower bound; -Infinity on the overflow bin. */
  from: number;
  /** Exclusive upper bound; Infinity on the overflow bin. */
  to: number;
  count: number;
  /** Share of all scored trades, 0–100. */
  percent: number;
  sign: "LOSS" | "WIN";
};

export type RDistribution = {
  bins: Bin[];
  scored: number;
  /** The tallest bin's count, so bars can share a scale. */
  peak: number;
  /**
   * Trades that lost more than the risk they were supposed to be taking.
   *
   * The single most useful number here. A stop that is honoured produces −1R;
   * anything past that is a stop that was moved, widened, or never really there,
   * and it is the difference between a losing month and a blown account.
   */
  worseThanPlanned: number;
  /** Losses that came in at or inside the planned risk. */
  withinPlan: number;
};

/**
 * Half-R bins between −2 and +2, with an overflow bin at each end.
 *
 * Half an R is fine enough to show a spike at −1 — the signature of stops being
 * honoured — without scattering a fifty-trade journal across thirty empty
 * columns. The ends are open because the tails are where the damage is, and a
 * fixed −3 edge would silently drop a −7R trade off the chart entirely.
 */
const EDGES = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2] as const;

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function labelFor(from: number, to: number): string {
  if (from === Number.NEGATIVE_INFINITY) return "≤ −2";
  if (to === Number.POSITIVE_INFINITY) return "≥ +2";
  // Only whole numbers get a label; the half-R bins between them stay bare so
  // the axis does not turn into a wall of text.
  if (Number.isInteger(from)) return from > 0 ? `+${from}` : String(from);
  return "";
}

export function buildRDistribution(rMultiples: number[]): RDistribution | null {
  const scored = rMultiples.filter((r) => Number.isFinite(r));
  if (scored.length === 0) return null;

  const bounds: [number, number][] = [
    [Number.NEGATIVE_INFINITY, EDGES[0]],
    ...EDGES.slice(0, -1).map(
      (edge, index): [number, number] => [edge, EDGES[index + 1]],
    ),
    [EDGES[EDGES.length - 1], Number.POSITIVE_INFINITY],
  ];

  const bins: Bin[] = bounds.map(([from, to]) => {
    // Lower bound inclusive, upper exclusive, so a value never lands in two
    // bins and never falls between them.
    const count = scored.filter((r) => r >= from && r < to).length;

    return {
      key: `${from}:${to}`,
      label: labelFor(from, to),
      from,
      to,
      count,
      percent: round((count / scored.length) * 100, 1),
      // Zero counts as a win-side outcome: a scratch is not a loss, and putting
      // it on the losing side would overstate the loss column on every journal
      // with a break-even trade in it.
      sign: to <= 0 ? "LOSS" : "WIN",
    };
  });

  return {
    bins,
    scored: scored.length,
    peak: Math.max(...bins.map((bin) => bin.count)),
    // Strictly worse than a full planned loss. −1.0 exactly is a stop doing its
    // job, so the comparison has to exclude it.
    worseThanPlanned: scored.filter((r) => r < -1).length,
    withinPlan: scored.filter((r) => r >= -1 && r < 0).length,
  };
}
