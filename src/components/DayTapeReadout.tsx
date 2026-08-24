"use client";

import LivePrice from "@/components/LivePrice";
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
  UP: { text: "text-positive", bg: "bg-positive/[0.12]" },
  DOWN: { text: "text-negative", bg: "bg-negative/[0.12]" },
  FLAT: { text: "text-muted", bg: "bg-muted/[0.12]" },
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

const SPARK_WIDTH = 400;
const SPARK_HEIGHT = 40;
const SPARK_PAD = 1;
/** Width reserved on the right so the last candle's glow doesn't sit under
 * the price tag — the tag floats past the chart's own drawing area rather
 * than on top of it. */
const SPARK_RIGHT_GAP = 34;

type CandleBar = {
  x: number;
  bodyWidth: number;
  wickTop: number;
  wickBottom: number;
  bodyTop: number;
  bodyBottom: number;
  up: boolean;
};

/**
 * The session's own M15 bars, laid out as real candlesticks — wicks and
 * bodies, not a line connecting closes.
 *
 * This is the same series `computeDayTape` already samples for VS_AVERAGE and
 * INTRADAY_BARS, drawn here instead of only measured. The high/low across the
 * whole window sets the scale, so a long wick on one bar doesn't get clipped
 * by a scale built only from closes.
 */
function buildCandlesticks(
  bars: { time: number; open: number; high: number; low: number; close: number }[],
): {
  candles: CandleBar[];
  lastX: number;
  lastY: number;
  /** Evenly spaced x positions with the bar time at each, for the axis
   * below the chart — first bar, last bar, and a couple of points between. */
  ticks: { x: number; time: number }[];
} | null {
  if (bars.length < 2) return null;

  const min = Math.min(...bars.map((b) => b.low));
  const max = Math.max(...bars.map((b) => b.high));
  const range = max - min;
  const usable = SPARK_HEIGHT - SPARK_PAD * 2;
  const drawWidth = SPARK_WIDTH - SPARK_RIGHT_GAP;
  const slot = drawWidth / bars.length;
  const bodyWidth = Math.max(slot * 0.4, 1.25);

  const y = (value: number) =>
    range > 0 ? SPARK_PAD + (1 - (value - min) / range) * usable : SPARK_HEIGHT / 2;

  const candles = bars.map((bar, i) => {
    const bodyTop = y(Math.max(bar.open, bar.close));
    const bodyBottom = y(Math.min(bar.open, bar.close));

    return {
      x: slot * i + slot / 2,
      bodyWidth,
      wickTop: y(bar.high),
      wickBottom: y(bar.low),
      // A doji (open === close) would draw a zero-height rect and vanish —
      // every bar gets at least a hairline body so the row it traded in is
      // still visible.
      bodyTop: Math.min(bodyTop, bodyBottom - 1),
      bodyBottom: Math.max(bodyBottom, bodyTop + 1),
      up: bar.close >= bar.open,
    };
  });

  const last = bars[bars.length - 1];

  // Seven evenly spaced ticks — dense enough to read the session's shape
  // without a label per bar, which would be unreadable at this density.
  const TICK_COUNT = 20;
  const tickIndices = Array.from({ length: TICK_COUNT }, (_, i) =>
    Math.round((i * (bars.length - 1)) / (TICK_COUNT - 1)),
  );
  const ticks = tickIndices.map((i) => ({ x: candles[i].x, time: bars[i].time }));

  return {
    candles,
    lastX: candles[candles.length - 1].x,
    lastY: y(last.close),
    ticks,
  };
}

/**
 * A tick's time, in the reader's own local time zone and clock — the same
 * epoch-seconds value MT5/the broker feed uses, formatted client-side rather
 * than assuming a fixed offset.
 */
function formatTickTime(epochSeconds: number, showDate: boolean): string {
  const date = new Date(epochSeconds * 1000);
  // 24-hour, no AM/PM — at 20 ticks in a fixed width, every character spent
  // on formatting is a character not spent on the next label fitting.
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  if (!showDate) return time;

  const day = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${day} ${time}`;
}

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
  const agreesWithMajority = majority !== null && reading.direction === majority;
  // "3 up / 9 down" is a phrase, not a figure — set at the same size as the
  // others it would run past the tile's edge.
  const long = reading.value.length > 8;

  const toneClasses = `group flex min-h-16 w-full flex-col justify-between rounded-xl border p-3 text-left transition-colors ${
    reading.direction === "FLAT" || agreesWithMajority
      ? "border-line bg-white/[0.015] hover:border-[#383d4d]"
      : `border-transparent ${tone.bg} hover:border-current`
  }`;

  return (
    <div className={toneClasses}>
      <span className="sr-only">{directionLabel(reading.direction, copy)}</span>
      <span className="font-mono text-[9px] tracking-wider text-muted/70 uppercase">
        {reading.label}
      </span>
      <div className="relative mt-1">
        <span
          className={`font-mono tracking-tight ${long ? "text-lg font-black" : "text-2xl font-black"} ${tone.text}`}
        >
          {reading.value}
        </span>
      </div>
    </div>
  );
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
  const candlesticks = buildCandlesticks(tape.sparkline);

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
    <div className="space-y-3">
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
        </div>

        {/* A real chart panel, not a sliver beside the price — the same M15
            bars behind VS_AVERAGE and INTRADAY_BARS, drawn as real candles
            (wick + body, red or green per bar) at a height where the shape
            actually reads, matching the proportions of a proper candlestick
            chart rather than a squeezed-in strip. The last candle glows and
            pulses while the session is live, the same "still updating" job
            the price's own pulse does. Too few bars (a session just opened)
            draws nothing rather than a misleading single stick. */}
        {candlesticks ? (
          <div className="relative z-10 mt-4 hidden lg:block">
          <div className="relative h-56">
            <svg
                aria-hidden="true"
                viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
                preserveAspectRatio="none"
                className="size-full"
              >
                {/* The dashed reference line at the last close — same job as
                    the price tag on a real chart's right edge, so "where's
                    the price" has an answer right beside the candles rather
                    than only far to the left. */}
                <line
                  x1="0"
                  x2={SPARK_WIDTH}
                  y1={candlesticks.lastY}
                  y2={candlesticks.lastY}
                  stroke={tape.direction === "DOWN" ? "var(--negative)" : "var(--positive)"}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.35"
                />

                {candlesticks.candles.map((candle, i) => {
                  const isLast = i === candlesticks.candles.length - 1;
                  const live = isLast && !tape.barelyTraded;
                  const color = candle.up ? "var(--positive)" : "var(--negative)";

                  return (
                    <g
                      key={i}
                      opacity={tape.barelyTraded ? 0.5 : live ? 1 : 0.75}
                      style={live ? { filter: `drop-shadow(0 0 2.5px ${color})` } : undefined}
                    >
                      <line
                        x1={candle.x}
                        x2={candle.x}
                        y1={candle.wickTop}
                        y2={candle.wickBottom}
                        stroke={color}
                        strokeWidth="0.75"
                      />
                      <rect
                        className={live ? "spark-live-dot" : undefined}
                        x={candle.x - candle.bodyWidth / 2}
                        y={candle.bodyTop}
                        width={candle.bodyWidth}
                        height={candle.bodyBottom - candle.bodyTop}
                        fill={color}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* HTML, not SVG text — the viewBox is stretched non-uniformly
                  (preserveAspectRatio="none"), which would distort a native
                  SVG label. Positioned by percentage so it tracks the line
                  regardless of the box's actual rendered size. */}
              <span
                className={`pointer-events-none absolute right-0 -translate-y-1/2 rounded px-1 py-0.5 font-mono text-[9px] font-semibold tabular-nums ${
                  tape.direction === "DOWN"
                    ? "bg-negative/15 text-negative"
                    : "bg-positive/15 text-positive"
                }`}
                style={{ top: `${(candlesticks.lastY / SPARK_HEIGHT) * 100}%` }}
              >
                {tape.lastPrice}
              </span>
            </div>

            {/* The axis a real chart has along its bottom edge — which bar is
                which, not just what the bars are worth. Four points rather
                than one per bar, unreadable at this density. */}
            <div className="mt-1 flex justify-between font-mono text-[7px] whitespace-nowrap text-muted/60">
              {candlesticks.ticks.map((tick, i) => {
                const prev = candlesticks.ticks[i - 1];
                const dayChanged =
                  !prev ||
                  new Date(tick.time * 1000).toDateString() !==
                    new Date(prev.time * 1000).toDateString();

                return <span key={i}>{formatTickTime(tick.time, dayChanged)}</span>;
              })}
            </div>
          </div>
          ) : null}

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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {tape.readings.map((reading) => (
          <ReadingTile key={reading.key} reading={reading} copy={copy} majority={majority} />
        ))}
      </div>

      {stale ? (
        <p className="text-[11px] leading-relaxed text-warning">{copy.staleNote}</p>
      ) : null}
    </div>
  );
}
