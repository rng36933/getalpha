import type { CotRow } from "@/lib/market-data/cot";
import type { MacroReading } from "@/lib/market-data/fred";

/**
 * A row per series: what it is, what it reads, and which way it moved.
 *
 * The observation date is shown next to the value rather than once at the top
 * of the card. Daily yields and monthly CPI sit side by side, and a reader
 * needs to see that one is from yesterday and the other from three weeks ago.
 */
export function ReadingList({ readings }: { readings: MacroReading[] }) {
  if (readings.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        Not available right now.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {readings.map((reading) => (
        <li key={reading.id} className="flex items-baseline gap-3 py-2.5">
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
        </li>
      ))}
    </ul>
  );
}

/**
 * Speculative positioning, drawn as a tilt rather than as a number.
 *
 * The bar reads from the centre: right for net long, left for net short. The
 * raw contract counts mean nothing without knowing the size of each market,
 * and the share of the two sides combined is comparable across all of them.
 */
export function CotList({ rows }: { rows: CotRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        Positioning is not available right now.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {rows.map((row) => {
          const long = row.skew > 0;
          const width = Math.min(Math.abs(row.skew), 100) / 2;

          return (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">{row.label}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    long ? "text-positive" : "text-negative"
                  }`}
                >
                  {long ? "net long" : "net short"} {Math.abs(row.skew)}%
                </span>
              </div>

              <div
                className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised"
                role="img"
                aria-label={`${row.label}: ${Math.abs(row.skew)}% net ${long ? "long" : "short"}`}
              >
                {/* The centre line is the reference, so a small tilt reads as
                    small rather than as a bar starting from nothing. */}
                <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
                <span
                  className={`absolute top-0 h-full ${long ? "bg-positive" : "bg-negative"}`}
                  style={
                    long
                      ? { left: "50%", width: `${width}%` }
                      : { right: "50%", width: `${width}%` }
                  }
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        Non-commercial positions from the CFTC, held on {rows[0]?.asOf} and
        published the following Friday. The lag is the report itself, not this
        page.
      </p>
    </div>
  );
}
