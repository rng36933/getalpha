"use client";

import LivePrice from "@/components/LivePrice";
import LocalTime from "@/components/LocalTime";
import type { Locale } from "@/lib/i18n/locales";
import { tapeCopy, type TapeCopy } from "@/lib/market-data/tape-copy";
import type { DayTape, Direction, Reading } from "@/lib/market-data/tape";

/**
 * The day's tape, drawn so it can be read in a glance.
 *
 * Green up, red down, grey for a move too small to call — and the number that
 * produced each arrow sits next to it, because an arrow whose reason is hidden
 * is indistinguishable from a tip. The panel says in words that it describes
 * the session that has happened; it must never be dressed as a forecast.
 */

/** Colour only. The word beside the arrow comes from the dictionary. */
const TONE: Record<Direction, { text: string; bg: string }> = {
  UP: { text: "text-positive", bg: "bg-positive/12" },
  DOWN: { text: "text-negative", bg: "bg-negative/12" },
  FLAT: { text: "text-muted", bg: "bg-muted/12" },
};

function toneWord(direction: Direction, copy: TapeCopy["readout"]): string {
  if (direction === "UP") return copy.up;
  if (direction === "DOWN") return copy.down;
  return copy.flat;
}

/** Same label the arrow icon used to carry, kept for screen readers now that
 * reading rows mark direction with a border instead of an icon. */
function directionLabel(direction: Direction, copy: TapeCopy["readout"]): string {
  if (direction === "UP") return copy.arrowUp;
  if (direction === "DOWN") return copy.arrowDown;
  return copy.arrowFlat;
}

/** A solid triangle up or down, a bar for flat. Size follows the font. */
function Arrow({
  direction,
  copy,
  className = "size-4",
}: {
  direction: Direction;
  copy: TapeCopy["readout"];
  className?: string;
}) {
  const label =
    direction === "UP"
      ? copy.arrowUp
      : direction === "DOWN"
        ? copy.arrowDown
        : copy.arrowFlat;

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

/**
 * The real arithmetic behind each reading, shown on hover next to its value.
 *
 * Matches `computeDayTape` in `tape.ts` exactly — this is documentation of
 * what already ran, not a new claim, so it has to stay in lockstep with that
 * file rather than describe the computation in looser words.
 */
const FORMULA: Record<string, string> = {
  VS_OPEN: "(price − open) / open × 100",
  VS_PRIOR_CLOSE: "price − prior close",
  RANGE_POSITION: "(price − low) / (high − low) × 100",
  INTRADAY_BARS: "count(close > open) vs count(close < open), last 12 bars",
  VS_AVERAGE: "price − mean(last 20 closes)",
};

/**
 * One reading, as a stat tile in the grid rather than a row in a list.
 *
 * Only tinted when it actually points somewhere — a flat reading sitting on
 * the same wash as an up or down one would blur the one signal the tint
 * exists to carry.
 */
function ReadingTile({
  reading,
  copy,
}: {
  reading: Reading;
  copy: TapeCopy["readout"];
}) {
  const tone = TONE[reading.direction];
  const formula = FORMULA[reading.key];
  // "3 up / 9 down" is a phrase, not a figure — set at the same size as the
  // others it would run past the tile's edge.
  const long = reading.value.length > 8;

  return (
    <div
      className={`group flex min-h-24 flex-col justify-between p-4 ${reading.direction === "FLAT" ? "" : tone.bg}`}
    >
      <span className="sr-only">{directionLabel(reading.direction, copy)}</span>
      <span className="font-mono text-[10px] tracking-wider text-muted/70 uppercase">
        {reading.label}
      </span>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span
          className={`font-mono tracking-tight ${long ? "text-lg font-bold" : "text-3xl font-black"} ${tone.text}`}
        >
          {reading.value}
        </span>
        {/* Hidden until the tile is hovered — the formula is a footnote for
            someone checking the arithmetic, not something every reader
            needs to see by default. */}
        {formula ? (
          <span className="hidden font-mono text-[9px] text-muted/60 group-hover:inline">
            [{formula}]
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Where price sits between the day's low and its high. */
function RangeBar({ tape, copy }: { tape: DayTape; copy: TapeCopy["readout"] }) {
  if (tape.rangePosition === null) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between font-mono text-[11px] tabular-nums text-muted">
        <span>{tape.dayLow}</span>
        <span className="font-bold text-accent">
          {tape.rangePosition}% {copy.ofRange}
        </span>
        <span>{tape.dayHigh}</span>
      </div>
      <div className="relative h-2 border border-line bg-surface-raised">
        <div
          className="absolute top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 border border-background bg-accent"
          style={{ left: `${tape.rangePosition}%` }}
        />
      </div>
    </div>
  );
}

/**
 * What the readings add up to, said accurately.
 *
 * "All" means all of them. The first version said "All 5 readings point up"
 * whenever none pointed down — so one reading up and four flat was reported as
 * unanimous, which is the sort of small lie that makes a reader stop trusting
 * the big numbers too.
 */
function agreementLine(tape: DayTape, copy: TapeCopy["readout"]): string {
  const { up, down, flat } = tape.agreeing;
  const total = tape.readings.length;

  if (total === 0) return copy.nothingMeasurable;

  if (up === total) return copy.allUp(total);
  if (down === total) return copy.allDown(total);
  if (flat === total) return copy.allFlat(total);

  const parts: string[] = [];
  if (up > 0) parts.push(copy.countUp(up));
  if (down > 0) parts.push(copy.countDown(down));
  if (flat > 0) parts.push(copy.countFlat(flat));

  const counts = parts.join(", ");

  if (up > down) return copy.leaningUp(counts, total);
  if (down > up) return copy.leaningDown(counts, total);

  return copy.noLean(counts, total);
}

export default function DayTapeReadout({
  tape,
  fetchedAt,
  stale,
  locale = "en",
}: {
  tape: DayTape;
  /** When the price series was produced, not when the page rendered. */
  fetchedAt: string | null;
  /** True when the provider failed and this is the last stored series. */
  stale?: boolean;
  /**
   * Defaulted to English, because the dashboard is English and always will be.
   * Only the public Lithuanian page passes anything else.
   */
  locale?: Locale;
}) {
  const copy = tapeCopy(locale).readout;
  const tone = TONE[tape.direction];

  return (
    <div className="space-y-5">
      {tape.barelyTraded ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-warning">
          {copy.barelyTraded}
        </p>
      ) : null}

      {/* The measurement is the largest thing on the card, because it is the
          thing being read. It used to be set at 24px beside a 56px icon, which
          gave the decoration more weight than the number. */}
      <div>
        {/* The pulse is the only looping animation in the app, and it carries
            information rather than atmosphere: it is the difference between a
            price that is moving and a price that is a historical record. A
            closed market gets a still dot. */}
        <p className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
          {/* Accent, not green: "live" is not a direction, and a green dot on a
              red session would read as one. Green and red stay reserved for
              which way price went. */}
          <span
            className={`size-1.5 rounded-full ${
              tape.barelyTraded ? "bg-muted" : "bg-accent live-dot"
            }`}
          />
          {tape.barelyTraded ? copy.marketClosed : copy.tradingNow}
        </p>

        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <LivePrice
            symbol={tape.symbol}
            timeframe="M15"
            initialPrice={tape.lastPrice}
            className="figure text-[2.75rem] sm:text-[3.5rem]"
          />

          <span
            className={`mb-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold tabular-nums ${tone.bg} ${tone.text}`}
          >
            <Arrow direction={tape.direction} copy={copy} className="size-3" />
            {tape.changeAbsolute > 0 ? "+" : ""}
            {tape.changeAbsolute}
            <span className="font-normal opacity-70">
              {tape.changePercent > 0 ? "+" : ""}
              {tape.changePercent}%
            </span>
          </span>
        </div>

        {/* The direction word is coloured, so the sentence is built from the
            dictionary with the word already in place and split around it — a
            template with a hole would not let the middle be styled. */}
        <p className="mt-2 text-sm text-muted">
          {(() => {
            const word = toneWord(tape.direction, copy);
            const sentence = copy.sessionLine(word, String(tape.dayOpen));
            const [before, after] = sentence.split(word);

            return (
              <>
                {before}
                <span className={tone.text}>{word}</span>
                {after}
              </>
            );
          })()}
        </p>
      </div>

      <RangeBar tape={tape} copy={copy} />

      <div className="grid grid-cols-2 divide-x divide-y divide-line border border-line bg-surface-raised/10 sm:grid-cols-2 lg:grid-cols-5">
        {tape.readings.map((reading) => (
          <ReadingTile key={reading.key} reading={reading} copy={copy} />
        ))}
      </div>

      {/* A status console: the same facts as before, laid out as a band of
          labelled columns plus a couple of terminal-style log lines, in one
          bordered box, so the card ends on something that reads as a system
          readout rather than a wall of grey prose. */}
      <div className="border border-line bg-surface-raised/40 p-4 font-mono text-[10px] leading-relaxed">
        <dl className="grid grid-cols-1 gap-4 divide-y divide-line border-b border-line pb-4 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="flex flex-col gap-1 md:pr-4">
            <dt className="text-[9px] font-bold tracking-widest text-muted/70 uppercase">
              {"// "}Status
            </dt>
            <dd className={`text-xs font-black uppercase ${tone.text}`}>
              {agreementLine(tape, copy)}
            </dd>
          </div>

          {tape.rangeVsAverage !== null ? (
            <div className="flex flex-col gap-1 pt-4 md:pt-0 md:px-4">
              <dt className="text-[9px] font-bold tracking-widest text-muted/70 uppercase">
                {"// "}Range
              </dt>
              <dd className="text-xs font-semibold text-foreground">
                {tape.rangeVsAverage < 0.05
                  ? copy.rangeTiny
                  : tape.rangeVsAverage >= 1.3
                    ? copy.rangeWide(tape.rangeVsAverage)
                    : tape.rangeVsAverage <= 0.7
                      ? copy.rangeQuiet(tape.rangeVsAverage)
                      : copy.rangeNormal(tape.rangeVsAverage)}
              </dd>
            </div>
          ) : null}

          <div className="flex flex-col gap-1 pt-4 md:pt-0 md:pl-4">
            <dt className="text-[9px] font-bold tracking-widest text-muted/70 uppercase">
              {"// "}Session
            </dt>
            <dd className="text-xs text-muted">
              {copy.sessionOf(tape.sessionDate)}
              {fetchedAt ? (
                <>
                  {copy.pricedAt}
                  <LocalTime at={fetchedAt} utc={fetchedAt.slice(11, 16)} />
                </>
              ) : null}
            </dd>
          </div>
        </dl>

        <div className="mt-4 space-y-1.5 text-muted">
          <p className="flex items-start gap-2 text-[11px]">
            <span className="shrink-0 font-bold text-accent">➜ [NET_LOG]:</span>
            {/* refreshNote is written to continue a sentence (leading ". "),
                so it's trimmed to stand on its own here. */}
            <span>{copy.refreshNote.replace(/^\.\s*/, "")}</span>
          </p>

          {stale ? (
            <p className="flex items-start gap-2 text-[11px]">
              <span className="shrink-0 font-bold text-warning">➜ [WARN]:</span>
              <span className="text-warning">{copy.staleNote}</span>
            </p>
          ) : null}

          {/* Skipped when the market-closed warning already ran: both
              sentences make the same "not a forecast" point, and saying it
              twice on one card reads as noise rather than caution. */}
          {tape.barelyTraded ? null : (
            <p className="flex items-start gap-2 text-[10px]">
              <span className="shrink-0 font-bold text-muted/70">➜ [DISCLAIMER]:</span>
              <span className="tracking-tight text-muted/70 uppercase">{copy.footnote}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
