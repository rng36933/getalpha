import type { CotRow } from "@/lib/market-data/cot";
import type { MacroReading } from "@/lib/market-data/fred";
import { GOLD_RELATIONSHIP } from "@/lib/market-data/gold-relationship";

/**
 * A row per series: what it is, what it reads, and which way it moved.
 *
 * The observation date is shown next to the value rather than once at the top
 * of the card. Daily yields and monthly CPI sit side by side, and a reader
 * needs to see that one is from yesterday and the other from three weeks ago.
 */
/**
 * Where a print sits in its own twelve-month range, as a bar.
 *
 * A thin fill bar rather than a ring: the same one-glance reading, in the
 * terminal-flat vocabulary the rest of the desk uses instead of a circular
 * gauge.
 */
function RangeDial({ reading }: { reading: MacroReading }) {
  if (reading.rangePercent === null) return null;

  const label = `${reading.rangePercent}% of its 12-month range, between ${reading.rangeLow} and ${reading.rangeHigh}`;

  return (
    <span className="group relative flex w-16 shrink-0 flex-col items-end gap-1">
      <span className="figure font-mono text-[11px] text-muted">
        {reading.rangePercent}%
      </span>
      <span role="img" aria-label={label} className="h-1 w-full bg-line">
        <span
          className="block h-full bg-accent"
          style={{ width: `${reading.rangePercent}%` }}
        />
      </span>

      {/* Out of flow and opacity-revealed, same as the session card's
          formula tooltip — a bar that grew on hover would push its own
          neighbours in the row. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 bottom-full z-10 mb-2 w-max max-w-40 rounded-md border border-line bg-surface-raised px-2 py-1.5 text-[11px] leading-snug whitespace-normal text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {reading.rangeLow} — {reading.rangeHigh} over the last 12 months
      </span>
    </span>
  );
}

export function ReadingList({ readings }: { readings: MacroReading[] }) {
  if (readings.length === 0) {
    // One quiet line, not a tall centred box. When the provider is down all
    // three cards hit this at once, and three paragraphs of "Not available
    // right now" under a notice that has already explained why reads as a
    // broken page rather than as a missing feed.
    return <p className="py-1 text-sm text-muted">No readings — see above.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {readings.map((reading) => {
        const relationship = GOLD_RELATIONSHIP[reading.id];

        return (
          <li key={reading.id} className="py-2.5">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{reading.label}</span>
                {reading.asOf ? (
                  <span className="block font-mono text-[11px] text-muted">
                    {reading.asOf}
                  </span>
                ) : null}
              </span>

              <span className="shrink-0 text-right">
                <span className="figure block font-mono text-xl font-semibold tabular-nums">
                  {reading.value ?? "—"}
                </span>
                {reading.change ? (
                  <span
                    className={`block font-mono text-[11px] tabular-nums ${
                      reading.direction > 0
                        ? "text-positive"
                        : reading.direction < 0
                          ? "text-negative"
                          : "text-muted"
                    }`}
                  >
                    {reading.change}
                  </span>
                ) : null}
              </span>

              <RangeDial reading={reading} />
            </div>

            {/* A fixed statement of mechanism, not a live prediction — see
                `gold-relationship.ts`. Reads the same whatever today's print
                was, on purpose. */}
            {relationship ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                <span className="text-accent">→ XAUUSD:</span> {relationship}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * One market's long/short split as a bar.
 *
 * The two sides are drawn as shares of the whole, so the picture is the
 * balance itself rather than a tilt away from a centre line — the same
 * reading the ring gave, as a flat terminal-style ratio bar instead of a
 * circular gauge. The net figure is printed beside it: green and red
 * cannot carry the meaning on their own.
 */
function CotDial({ row }: { row: CotRow }) {
  const total = row.long + row.short;
  const longShare = total > 0 ? (row.long / total) * 100 : 50;

  const isLong = row.skew > 0;

  return (
    <li className="group relative flex w-40 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{row.label}</span>
        <span
          className={`figure font-mono text-lg ${
            isLong ? "text-positive" : "text-negative"
          }`}
        >
          {Math.abs(row.skew)}%
        </span>
      </div>

      <div
        role="img"
        aria-label={`${row.label}: ${Math.round(longShare)} percent of speculative positions are long, ${Math.abs(row.skew)} percent net ${isLong ? "long" : "short"}.`}
        className="flex h-2 w-full overflow-hidden bg-negative/75"
      >
        <div
          className="h-full bg-positive/85"
          style={{ width: `${longShare}%` }}
        />
      </div>

      <span
        className={`font-mono text-[11px] uppercase tracking-wider ${
          isLong ? "text-positive" : "text-negative"
        }`}
      >
        net {isLong ? "long" : "short"}
      </span>

      {/* The raw contract counts behind the bar — the percentage above is
          the headline, this is the arithmetic for anyone checking it. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-md border border-line bg-surface-raised px-2 py-1.5 font-mono text-[11px] whitespace-nowrap text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {row.long.toLocaleString()} long / {row.short.toLocaleString()} short
      </span>
    </li>
  );
}

/**
 * Speculative positioning, one ring per market.
 *
 * The raw contract counts mean nothing without knowing the size of each market,
 * so every dial shows the split between the two sides — comparable across all
 * of them, and the same shape whether the market is gold or bitcoin.
 */
export function CotList({ rows }: { rows: CotRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-1 text-sm text-muted">
        Nothing here matches your watchlist. The CFTC publishes this report for
        gold, silver, the euro, the pound, the yen and bitcoin — add one of those
        and its positioning appears.
      </p>
    );
  }

  return (
    <div>
      {/* One line, plainly said, before the rings — what large speculative
          traders are positioned for, not what will happen next. */}
      <p className="text-center text-sm text-muted">
        How large speculative traders are positioned right now — long (betting
        on a rise) versus short (betting on a fall).
      </p>

      {/* Centred rather than left-packed in a fixed grid: this card usually
          holds one or two rings, since it only shows markets on the user's
          own watchlist, and a couple of large dials stranded at the left
          edge of an otherwise empty row read as a layout bug. */}
      <ul className="mt-5 flex flex-wrap justify-center gap-x-8 gap-y-6">
        {rows.map((row) => (
          <CotDial key={row.label} row={row} />
        ))}
      </ul>

      <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 bg-positive" aria-hidden="true" />
          long
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 bg-negative" aria-hidden="true" />
          short
        </span>
        <span>
          Non-commercial positions from the CFTC, held on {rows[0]?.asOf} and
          published the following Friday. The lag is the report itself, not this
          page.
        </span>
      </p>
    </div>
  );
}
