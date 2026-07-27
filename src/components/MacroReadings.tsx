import { macroDeskCopy } from "@/lib/i18n/app/macroDesk";
import type { Locale } from "@/lib/i18n/locales";
import type { CotRow } from "@/lib/market-data/cot";
import type { MacroReading } from "@/lib/market-data/fred";

/**
 * A row per series: what it is, what it reads, and which way it moved.
 *
 * The observation date is shown next to the value rather than once at the top
 * of the card. Daily yields and monthly CPI sit side by side, and a reader
 * needs to see that one is from yesterday and the other from three weeks ago.
 */
export function ReadingList({
  readings,
  locale,
}: {
  readings: MacroReading[];
  locale: Locale;
}) {
  const copy = macroDeskCopy(locale);

  if (readings.length === 0) {
    // One quiet line, not a tall centred box. When the provider is down all
    // three cards hit this at once, and three paragraphs of "Not available
    // right now" under a notice that has already explained why reads as a
    // broken page rather than as a missing feed.
    return <p className="py-1 text-sm text-muted">{copy.noReadings}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {readings.map((reading) => (
        <li key={reading.id} className="py-2.5">
          <div className="flex items-baseline gap-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{reading.label}</span>
              {reading.asOf ? (
                <span className="block font-mono text-[11px] text-muted">
                  {reading.asOf}
                </span>
              ) : null}
            </span>

            <span className="shrink-0 text-right">
              <span className="block font-mono text-sm tabular-nums">
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
          </div>

          {/* Where the print sits in its own year.
              "4.71%" tells a reader nothing unless they already know what a
              normal ten-year yield is. A marker inside the twelve-month range
              answers "high or low" without any prior knowledge, and because it
              is a share of a whole it is the one figure here that compares
              across a yield, a spread and an index. */}
          {reading.rangePercent !== null ? (
            <div className="mt-2">
              <div
                className="relative h-1 rounded-full bg-surface-raised"
                role="img"
                aria-label={copy.rangeAriaLabel(
                  reading.rangePercent,
                  reading.rangeLow,
                  reading.rangeHigh,
                )}
              >
                <span
                  className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-background"
                  style={{ left: `${reading.rangePercent}%` }}
                />
              </div>

              <div className="mt-1.5 flex items-baseline justify-between gap-2 font-mono text-[10px] tabular-nums text-muted">
                <span>{reading.rangeLow}</span>
                <span className="text-accent">
                  {copy.rangeLabel(reading.rangePercent)}
                </span>
                <span>{reading.rangeHigh}</span>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Geometry for one dial. A ring rather than a filled circle: the hole is
 *  where the figure goes, and a solid pie has nowhere to put it. */
const R = 30;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * One market's long/short split as a ring.
 *
 * The two sides are drawn as shares of the whole, so the picture is the balance
 * itself rather than a tilt away from a centre line. The net figure sits in the
 * hole, printed — green and red cannot carry the meaning on their own, and this
 * card is read at a glance by people who may not separate the two hues.
 */
function CotDial({ row, locale }: { row: CotRow; locale: Locale }) {
  const copy = macroDeskCopy(locale);
  const total = row.long + row.short;
  const longShare = total > 0 ? (row.long / total) * 100 : 50;

  const isLong = row.skew > 0;
  const longArc = (longShare / 100) * CIRCUMFERENCE;
  const direction = isLong ? "long" : "short";

  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <span className="relative">
        <svg
          viewBox="0 0 80 80"
          className="size-[4.5rem]"
          role="img"
          aria-label={copy.dialAriaLabel(
            row.label,
            Math.round(longShare),
            Math.abs(row.skew),
            direction,
          )}
        >
          {/* Rotated so both arcs start at twelve o'clock, which is where the
              eye starts reading a dial. */}
          <g transform="rotate(-90 40 40)">
            <circle
              cx={40}
              cy={40}
              r={R}
              fill="none"
              stroke="var(--negative)"
              strokeWidth={STROKE}
              opacity={0.75}
            />
            <circle
              cx={40}
              cy={40}
              r={R}
              fill="none"
              stroke="var(--positive)"
              strokeWidth={STROKE}
              strokeDasharray={`${longArc} ${CIRCUMFERENCE - longArc}`}
              opacity={0.85}
            />
          </g>
        </svg>

        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            className={`figure text-[0.8rem] ${
              isLong ? "text-positive" : "text-negative"
            }`}
          >
            {Math.abs(row.skew)}%
          </span>
        </span>
      </span>

      <span className="text-xs font-medium">{row.label}</span>
      <span
        className={`font-mono text-[10px] uppercase tracking-wider ${
          isLong ? "text-positive" : "text-negative"
        }`}
      >
        {copy.netLabel(direction)}
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
export function CotList({ rows, locale }: { rows: CotRow[]; locale: Locale }) {
  const copy = macroDeskCopy(locale);

  if (rows.length === 0) {
    return <p className="py-1 text-sm text-muted">{copy.noPositioning}</p>;
  }

  return (
    <div>
      <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
        {rows.map((row) => (
          <CotDial key={row.label} row={row} locale={locale} />
        ))}
      </ul>

      <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-positive" aria-hidden="true" />
          {copy.long}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-negative" aria-hidden="true" />
          {copy.short}
        </span>
        <span>{copy.positioningFootnote(rows[0]?.asOf ?? "")}</span>
      </p>
    </div>
  );
}
