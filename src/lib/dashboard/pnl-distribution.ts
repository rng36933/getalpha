/**
 * Where a trader's results actually land, in money.
 *
 * The question a total cannot answer. A profitable month can come from grinding
 * out small wins against honoured stops, or from one enormous win carrying a
 * pile of losses twice the size they were supposed to be — the same total, two
 * completely different accounts, and only the shape tells them apart.
 *
 * The R version of this chart had fixed edges at half-R intervals, which worked
 * because R is dimensionless. Money is not: a €10 trade and a €1,000 trade
 * cannot share a fixed scale, so the step is derived from the trader's own
 * typical result. Same lesson as the flat band on the day tape, which is a
 * share of the instrument's own range rather than a fixed percentage.
 *
 * Arithmetic, no imports, so `npm test` reaches it directly.
 */

export type Bin = {
  key: string;
  /**
   * The value to print under this bin, or null for the bins between labels.
   *
   * A number rather than a string: the currency symbol belongs to the component
   * that knows which account this is, and a library that formats money has to
   * be told the currency by every caller or it will invent one.
   */
  labelValue: number | null;
  /** True on the two overflow bins, which are open-ended. */
  overflow: boolean;
  /** Inclusive lower bound; -Infinity on the overflow bin. */
  from: number;
  /** Exclusive upper bound; Infinity on the overflow bin. */
  to: number;
  count: number;
  /** Share of all closed trades, 0–100. */
  percent: number;
  sign: "LOSS" | "WIN";
};

export type PnlDistribution = {
  bins: Bin[];
  /** How many trades the shape is built from. */
  scored: number;
  /** The tallest bin's count, so bars can share a scale. */
  peak: number;
  /** The width of one bin, in the account currency. */
  step: number;
  /**
   * The largest single loss, as a positive number, and the typical one.
   *
   * Together these are the money answer to the question R answered with
   * "worse than planned": a worst loss several times the median loss is a stop
   * that was moved, widened, or never really there. Null when there are no
   * losses yet — which is a fact about a small sample, not about an edge.
   */
  worstLoss: number | null;
  medianLoss: number | null;
};

/**
 * The nearest round number at or below `value`, from the 1/2/2.5/5 family.
 *
 * Axis steps have to be numbers a reader can add up in their head. 250 and 500
 * are such numbers; 237 is not, and a chart whose gridlines land on 237 makes
 * every position on it a small arithmetic problem.
 */
function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;

  const multiplier = normalised >= 5 ? 5 : normalised >= 2.5 ? 2.5 : normalised >= 2 ? 2 : 1;

  return multiplier * magnitude;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function buildPnlDistribution(
  amounts: number[],
): PnlDistribution | null {
  const scored = amounts.filter((amount) => Number.isFinite(amount));
  if (scored.length === 0) return null;

  // The step comes from the typical trade rather than the biggest one: sized
  // off the maximum, a single outsized win would push every ordinary trade into
  // the middle bin and flatten the shape the chart exists to show.
  const sizes = scored.map(Math.abs).filter((size) => size > 0);
  const step = niceStep((median(sizes) ?? 1) || 1);

  const EDGES = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((multiple) => multiple * step);

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
    const count = scored.filter((amount) => amount >= from && amount < to).length;

    const overflow =
      from === Number.NEGATIVE_INFINITY || to === Number.POSITIVE_INFINITY;

    // Only every second edge gets a label, so the axis does not turn into a
    // wall of currency symbols.
    const atEdge = overflow ? from : from;
    const multiple = overflow ? null : Math.round(atEdge / step);

    return {
      key: `${from}:${to}`,
      labelValue:
        overflow || multiple === null || multiple % 2 !== 0 ? null : atEdge,
      overflow,
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

  const losses = scored.filter((amount) => amount < 0).map(Math.abs);

  return {
    bins,
    scored: scored.length,
    peak: Math.max(...bins.map((bin) => bin.count)),
    step,
    worstLoss: losses.length > 0 ? round(Math.max(...losses), 2) : null,
    medianLoss: losses.length > 0 ? round(median(losses) ?? 0, 2) : null,
  };
}
