import LocalTime from "@/components/LocalTime";
import type { DayTape, Direction } from "@/lib/market-data/tape";

/**
 * The day's tape, drawn so it can be read in a glance.
 *
 * Green up, red down, grey for a move too small to call — and the number that
 * produced each arrow sits next to it, because an arrow whose reason is hidden
 * is indistinguishable from a tip. The panel says in words that it describes
 * the session that has happened; it must never be dressed as a forecast.
 */

const TONE: Record<Direction, { text: string; bg: string; word: string }> = {
  UP: { text: "text-positive", bg: "bg-positive/12", word: "Up" },
  DOWN: { text: "text-negative", bg: "bg-negative/12", word: "Down" },
  FLAT: { text: "text-muted", bg: "bg-muted/12", word: "Flat" },
};

/** A solid triangle up or down, a bar for flat. Size follows the font. */
function Arrow({
  direction,
  className = "size-4",
}: {
  direction: Direction;
  className?: string;
}) {
  const label =
    direction === "UP" ? "up" : direction === "DOWN" ? "down" : "little changed";

  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} ${TONE[direction].text}`}
      role="img"
      aria-label={label}
      fill="currentColor"
    >
      {direction === "UP" ? <path d="M12 4l8 14H4z" /> : null}
      {direction === "DOWN" ? <path d="M12 20L4 6h16z" /> : null}
      {direction === "FLAT" ? <rect x="4" y="10.5" width="16" height="3" /> : null}
    </svg>
  );
}

/** Where price sits between the day's low and its high. */
function RangeBar({ tape }: { tape: DayTape }) {
  if (tape.rangePosition === null) return null;

  return (
    <div>
      <div className="relative h-2 rounded-full bg-surface-raised">
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
          style={{ left: `${tape.rangePosition}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted">
        <span>{tape.dayLow}</span>
        <span className="text-foreground">{tape.lastPrice}</span>
        <span>{tape.dayHigh}</span>
      </div>
    </div>
  );
}

function agreementLine(tape: DayTape): string {
  const { up, down, flat } = tape.agreeing;
  const total = tape.readings.length;

  if (up > 0 && down === 0) {
    return `All ${total} readings point up.`;
  }
  if (down > 0 && up === 0) {
    return `All ${total} readings point down.`;
  }
  if (up > down) {
    return `${up} of ${total} readings point up, ${down} down.`;
  }
  if (down > up) {
    return `${down} of ${total} readings point down, ${up} up.`;
  }
  return `The readings disagree — ${up} up, ${down} down, ${flat} flat.`;
}

export default function DayTapeReadout({
  tape,
  fetchedAt,
  stale,
}: {
  tape: DayTape;
  /** When the price series was produced, not when the page rendered. */
  fetchedAt: string | null;
  /** True when the provider failed and this is the last stored series. */
  stale?: boolean;
}) {
  const tone = TONE[tape.direction];

  return (
    <div className="space-y-5">
      {tape.barelyTraded ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-warning">
          This session has barely traded — its whole range so far is a fraction
          of a normal day. Almost certainly a closed market. The arrows below are
          correct and mean very little until it opens.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <div
          className={`grid size-14 shrink-0 place-items-center rounded-xl ${tone.bg}`}
        >
          <Arrow direction={tape.direction} className="size-7" />
        </div>

        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-2xl font-semibold tracking-tight">
              {tape.lastPrice}
            </span>
            <span className={`font-mono text-sm ${tone.text}`}>
              {tape.changeAbsolute > 0 ? "+" : ""}
              {tape.changeAbsolute} ({tape.changePercent > 0 ? "+" : ""}
              {tape.changePercent}%)
            </span>
          </p>
          <p className="mt-0.5 text-sm text-muted">
            <span className={tone.text}>{tone.word}</span> on the session, from
            an open of {tape.dayOpen}.
          </p>
        </div>
      </div>

      <RangeBar tape={tape} />

      <ul className="divide-y divide-line border-y border-line">
        {tape.readings.map((reading) => (
          <li key={reading.key} className="flex items-start gap-3 py-2.5">
            <Arrow direction={reading.direction} className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm">{reading.label}</span>
                <span
                  className={`font-mono text-xs ${TONE[reading.direction].text}`}
                >
                  {reading.value}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {reading.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-1 text-xs text-muted">
        <p className="text-foreground">{agreementLine(tape)}</p>

        {tape.rangeVsAverage !== null ? (
          <p>
            {tape.rangeVsAverage < 0.05
              ? "The session's range is under a twentieth of a normal day."
              : tape.rangeVsAverage >= 1.3
                ? `A wider session than usual — ${tape.rangeVsAverage}× the recent average range.`
                : tape.rangeVsAverage <= 0.7
                  ? `A quieter session than usual — ${tape.rangeVsAverage}× the recent average range.`
                  : `Range is about normal for this instrument (${tape.rangeVsAverage}× the recent average).`}
          </p>
        ) : null}

        <p>
          Session of {tape.sessionDate}
          {fetchedAt ? (
            <>
              , priced at <LocalTime at={fetchedAt} utc={fetchedAt.slice(11, 16)} />
            </>
          ) : null}
          . Intraday readings refresh every few minutes, not tick by tick — the
          free price feed allows eight requests a minute across the whole desk.
        </p>

        {stale ? (
          <p className="text-warning">
            The price feed did not answer just now, so this is the last series we
            stored. The arrows describe that moment, not this one.
          </p>
        ) : null}
      </div>

      <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        Every arrow above is a measurement of the session that has already
        happened — where price sits against its open, its range and its own
        average. None of it is a forecast, and none of it is a suggestion to buy
        or sell anything.
      </p>
    </div>
  );
}
