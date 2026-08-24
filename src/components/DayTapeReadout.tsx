"use client";

import { useId } from "react";
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
const TONE: Record<Direction, { text: string; bg: string; stroke: string }> = {
  UP: { text: "text-positive", bg: "bg-positive/[0.12]", stroke: "var(--positive)" },
  DOWN: { text: "text-negative", bg: "bg-negative/[0.12]", stroke: "var(--negative)" },
  FLAT: { text: "text-muted", bg: "bg-muted/[0.12]", stroke: "var(--muted)" },
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

/**
 * The real arithmetic behind each reading, shown on hover next to its value.
 *
 * Matches `computeDayTape` in `tape.ts` exactly — this is documentation of
 * what already ran, not a new claim, so it has to stay in lockstep with that
 * file rather than describe the computation in looser words.
 */
const SPARK_WIDTH = 400;
const SPARK_HEIGHT = 40;
const SPARK_PAD = 4;

/**
 * The session's own closes, laid out as an SVG line and the area beneath it.
 *
 * This is the same series `computeDayTape` already samples for VS_AVERAGE and
 * INTRADAY_BARS — drawn here instead of only measured, so the width beside the
 * price shows the real session rather than a decoration standing in for one.
 * A flat or near-flat run (a genuinely quiet session, or too few points to
 * plot) draws as a flat line down the middle rather than nothing.
 */
function buildSparkline(values: number[]): {
  line: string;
  area: string;
  end: { x: number; y: number };
} | null {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const step = SPARK_WIDTH / (values.length - 1);
  const usable = SPARK_HEIGHT - SPARK_PAD * 2;

  const points = values.map((value, i) => {
    const x = i * step;
    const y =
      range > 0
        ? SPARK_PAD + (1 - (value - min) / range) * usable
        : SPARK_HEIGHT / 2;
    return { x, y };
  });

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${SPARK_WIDTH},${SPARK_HEIGHT} L0,${SPARK_HEIGHT} Z`;

  return { line, area, end: points[points.length - 1] };
}

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
 * exists to carry. No click-to-expand: a tile just states its number, the
 * formula hint on hover is the only extra layer.
 */
function ReadingTile({
  reading,
  copy,
  majority,
}: {
  reading: Reading;
  copy: TapeCopy["readout"];
  /**
   * The direction most readings share, or null when there is no clear
   * majority. A tile that agrees with the room stays quiet — the STATUS
   * line already says "all 5 point down" once; five red tiles saying it
   * again each is the same fact shouting five times instead of one tile
   * standing out because it's the one that disagrees.
   */
  majority: Direction | null;
}) {
  const tone = TONE[reading.direction];
  const formula = FORMULA[reading.key];
  const agreesWithMajority = majority !== null && reading.direction === majority;
  // "3 up / 9 down" is a phrase, not a figure — set at the same size as the
  // others it would run past the tile's edge.
  const long = reading.value.length > 8;

  const toneClasses = `group flex min-h-24 w-full flex-col justify-between rounded-xl border p-5 text-left transition-colors ${
    reading.direction === "FLAT" || agreesWithMajority
      ? "border-line bg-white/[0.015] hover:border-[#383d4d]"
      : `border-transparent ${tone.bg} hover:border-current`
  }`;

  return (
    <div className={toneClasses}>
      <span className="sr-only">{directionLabel(reading.direction, copy)}</span>
      <span className="font-mono text-[10px] tracking-wider text-muted/70 uppercase">
        {reading.label}
      </span>
      <div className="relative mt-2">
        <span
          className={`font-mono tracking-tight ${long ? "text-2xl font-black" : "text-4xl font-black"} ${tone.text}`}
        >
          {reading.value}
        </span>
        {/* Positioned out of flow and revealed by opacity, not display — a
            tile that grows or wraps to a second line on hover shifts every
            other tile in its grid row along with it, which is the "jumps
            when I move the mouse" feeling this replaces. */}
        {formula ? (
          <span className="pointer-events-none absolute top-full left-0 mt-0.5 font-mono text-[9px] whitespace-nowrap text-muted/60 opacity-0 transition-opacity group-hover:opacity-100">
            [{formula}]
          </span>
        ) : null}
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
  const areaGradientId = useId();
  const spark = buildSparkline(tape.sparkline);

  // Which direction most readings share, for the tiles below — null when
  // there's a genuine split (e.g. 2 up, 2 down, 1 flat), since there's no
  // consensus to go quiet about in that case.
  const { up, down, flat } = tape.agreeing;
  const topCount = Math.max(up, down, flat);
  const leaders = (
    [
      ["UP", up],
      ["DOWN", down],
      ["FLAT", flat],
    ] as [Direction, number][]
  ).filter(([, count]) => count === topCount);
  const majority: Direction | null = leaders.length === 1 ? leaders[0][0] : null;

  return (
    <div className="space-y-5">
      {tape.barelyTraded ? (
        <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-warning">
          {copy.barelyTraded}
        </p>
      ) : null}

      {/* The measurement is the largest thing on the card, because it is the
          thing being read. It used to be set at 24px beside a 56px icon, which
          gave the decoration more weight than the number. */}
      <div className="relative">
        {/* The pulse is the only looping animation in the app, and it carries
            information rather than atmosphere: it is the difference between a
            price that is moving and a price that is a historical record. A
            closed market gets a still dot. */}
        <p className="relative z-10 mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
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

        <div className="relative flex flex-wrap items-end gap-x-4 gap-y-1">
          <span className="sr-only">{directionLabel(tape.direction, copy)}</span>

          {/* The change span now lives inside LivePrice itself, flashing in
              sync with the price on every tick — a static change figure
              beside a live price meant the two disagreed the moment a new
              tick landed but the page hadn't been reloaded. */}
          <LivePrice
            symbol={tape.symbol}
            timeframe="M15"
            initialPrice={tape.lastPrice}
            dayOpen={tape.dayOpen}
            className={`figure relative z-10 text-[2.75rem] sm:text-[3.5rem] ${
              tape.barelyTraded ? "glow-text" : "glow-text-live"
            }`}
            changeClassName="relative z-10 mb-1.5 inline-flex items-baseline gap-1 text-sm font-medium tabular-nums"
            changeRestClassName={tone.text}
          />

          {/* Fills the width beside the price on a wide row with the actual
              session, not a decoration standing in for one: the same closes
              behind VS_AVERAGE and INTRADAY_BARS, drawn as a line with a
              soft fill under it and — while live — a pulsing dot at the
              current close, the same "still updating" job the price's own
              pulse does. Too few points (a session just opened) draws
              nothing rather than a misleading flat line. */}
          {spark ? (
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
              preserveAspectRatio="none"
              className="relative z-10 ml-4 mb-1 hidden h-9 flex-1 self-stretch lg:block"
            >
              <defs>
                <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone.stroke} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={tone.stroke} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={spark.area} fill={`url(#${areaGradientId})`} stroke="none" />
              <path
                d={spark.line}
                fill="none"
                stroke={tone.stroke}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={tape.barelyTraded ? 0.5 : 0.9}
              />
              {tape.barelyTraded ? null : (
                <circle
                  className="spark-live-dot"
                  cx={spark.end.x}
                  cy={spark.end.y}
                  r="3.5"
                  fill={tone.stroke}
                />
              )}
            </svg>
          ) : null}
        </div>

        {/* The direction word is coloured, so the sentence is built from the
            dictionary with the word already in place and split around it — a
            template with a hole would not let the middle be styled. */}
        <p className="relative z-10 mt-2 text-sm text-muted">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tape.readings.map((reading) => (
          <ReadingTile key={reading.key} reading={reading} copy={copy} majority={majority} />
        ))}
      </div>

      {/* The same facts as before, laid out as a band of labelled columns
          plus a couple of footnotes, in one rounded glass panel. */}
      <div className="rounded-2xl border border-line bg-surface-raised/40 p-4 transition-colors hover:border-accent/60 hover:shadow-[0_0_16px_-4px_var(--accent)]">
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <dt>
              <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">
                Status
              </span>
            </dt>
            <dd className={`text-xs font-semibold uppercase ${tone.text}`}>
              {agreementLine(tape, copy)}
            </dd>
          </div>

          {tape.rangeVsAverage !== null ? (
            <div className="flex flex-col gap-1.5">
              <dt>
                <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">
                  Range
                </span>
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

          <div className="flex flex-col gap-1.5">
            <dt>
              <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">
                Session
              </span>
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

        <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
          {stale ? <p className="text-warning">{copy.staleNote}</p> : null}

          {/* Skipped when the market-closed warning already ran: both
              sentences make the same "not a forecast" point, and saying it
              twice on one card reads as noise rather than caution. */}
          {tape.barelyTraded ? null : (
            <p className="text-[10px] text-muted/70">{copy.footnote}</p>
          )}
        </div>
      </div>
    </div>
  );
}
