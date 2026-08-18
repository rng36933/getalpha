"use client";

import { useState } from "react";
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
  UP: { text: "text-positive", bg: "bg-positive/[0.06]" },
  DOWN: { text: "text-negative", bg: "bg-negative/[0.06]" },
  FLAT: { text: "text-muted", bg: "bg-muted/[0.06]" },
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
const FORMULA: Record<string, string> = {
  VS_OPEN: "(price − open) / open × 100",
  VS_PRIOR_CLOSE: "price − prior close",
  RANGE_POSITION: "(price − low) / (high − low) × 100",
  INTRADAY_BARS: "count(close > open) vs count(close < open), last 12 bars",
  VS_AVERAGE: "price − mean(last 20 closes)",
};

/**
 * Reading keys whose detail sentence only restates a number shown elsewhere
 * on the card — the open/now pair above, the low/high under the range bar,
 * or a boilerplate line with no data in it. Those tiles aren't clickable:
 * a tap that opens onto a sentence saying nothing new is worse than no tap
 * at all.
 */
const DETAIL_REDUNDANT: ReadonlySet<string> = new Set([
  "VS_OPEN",
  "RANGE_POSITION",
  "INTRADAY_BARS",
]);

/**
 * One reading, as a stat tile in the grid rather than a row in a list.
 *
 * Only tinted when it actually points somewhere — a flat reading sitting on
 * the same wash as an up or down one would blur the one signal the tint
 * exists to carry. Tiles with a real detail sentence (see
 * `DETAIL_REDUNDANT`) are buttons that expand it in place — the formula on
 * hover answers "how was this computed", the detail sentence on click
 * answers "what does that number actually mean".
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
  const [open, setOpen] = useState(false);
  const tone = TONE[reading.direction];
  const formula = FORMULA[reading.key];
  const expandable = !DETAIL_REDUNDANT.has(reading.key);
  const agreesWithMajority = majority !== null && reading.direction === majority;
  // "3 up / 9 down" is a phrase, not a figure — set at the same size as the
  // others it would run past the tile's edge.
  const long = reading.value.length > 8;

  const toneClasses = `group flex min-h-20 w-full flex-col justify-between rounded-lg border p-4 text-left transition-colors ${
    reading.direction === "FLAT" || agreesWithMajority
      ? "border-line bg-white/[0.015] hover:border-[#383d4d]"
      : `border-line ${tone.bg} hover:border-[#383d4d]`
  }`;

  const body = (
    <>
      <span className="sr-only">{directionLabel(reading.direction, copy)}</span>
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] tracking-wider text-muted/70 uppercase">
          {reading.label}
        </span>
        {expandable ? (
          <svg
            viewBox="0 0 24 24"
            className={`size-3 shrink-0 transition-transform duration-300 ${tone.text} ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        ) : null}
      </span>
      <div className="relative mt-2">
        <span
          className={`font-mono tracking-tight ${long ? "text-base font-semibold" : "text-2xl font-semibold"} ${tone.text}`}
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

      {expandable ? (
        <div
          className="grid"
          style={{
            gridTemplateRows: open ? "1fr" : "0fr",
            transition: "grid-template-rows 300ms ease-in-out",
          }}
        >
          <div className="overflow-hidden">
            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
              {reading.detail}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );

  if (!expandable) {
    return <div className={toneClasses}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => setOpen((current) => !current)}
      aria-expanded={open}
      className={`${toneClasses} cursor-pointer`}
    >
      {body}
    </button>
  );
}

/**
 * The session's closes, drawn as a line — the shape behind the reading
 * tiles below, not only their summary in words.
 *
 * No axes, no grid, no hover: it sits beside a real price and a real
 * change figure, both already exact, so this only has to answer "what did
 * the path there look like" at a glance. Too few points to draw anything
 * from (a session just opened) is silently nothing rather than a flat
 * line pretending to be data.
 */
function Sparkline({ closes, tone }: { closes: number[]; tone: { text: string } }) {
  if (closes.length < 3) return null;

  const w = 96;
  const h = 32;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const points = closes
    .map((value, index) => {
      const x = (index / (closes.length - 1)) * w;
      const y = h - ((value - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`ml-auto h-8 w-24 shrink-0 ${tone.text}`}
      role="img"
      aria-label={`Session price path, from ${min} to ${max}.`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Where price sits between the day's low and its high. */
function RangeBar({ tape, copy }: { tape: DayTape; copy: TapeCopy["readout"] }) {
  if (tape.rangePosition === null) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between font-mono text-[11px] tabular-nums text-muted">
        <span>{tape.dayLow}</span>
        <span className="font-medium text-foreground">
          {tape.rangePosition}% {copy.ofRange}
        </span>
        <span>{tape.dayHigh}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-surface-raised">
        <div
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
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
  sparkline,
  locale = "en",
}: {
  tape: DayTape;
  /** When the price series was produced, not when the page rendered. */
  fetchedAt: string | null;
  /** True when the provider failed and this is the last stored series. */
  stale?: boolean;
  /** Today's session closes, oldest first. Omitted or too short draws nothing. */
  sparkline?: number[];
  /**
   * Defaulted to English, because the dashboard is English and always will be.
   * Only the public Lithuanian page passes anything else.
   */
  locale?: Locale;
}) {
  const copy = tapeCopy(locale).readout;
  const tone = TONE[tape.direction];

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
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-warning">
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
            className={`mb-1.5 inline-flex items-baseline gap-1 text-sm font-medium tabular-nums ${tone.text}`}
          >
            <span className="sr-only">{directionLabel(tape.direction, copy)}</span>
            {tape.changeAbsolute > 0 ? "+" : ""}
            {tape.changeAbsolute}
            <span className="text-muted">
              ({tape.changePercent > 0 ? "+" : ""}
              {tape.changePercent}%)
            </span>
          </span>

          <Sparkline closes={sparkline ?? []} tone={tone} />
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tape.readings.map((reading) => (
          <ReadingTile key={reading.key} reading={reading} copy={copy} majority={majority} />
        ))}
      </div>

      {/* The same facts as before, laid out as a band of labelled columns
          plus a couple of footnotes, in one rounded glass panel. */}
      <div className="rounded-lg border border-line bg-surface-raised/40 p-5">
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <dt>
              <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">
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
                <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">
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
              <span className="rounded-md bg-surface px-2 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-muted uppercase">
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

        <div className="mt-4 space-y-2 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
          {/* refreshNote is written to continue a sentence (leading ". "),
              so it's trimmed to stand on its own here. */}
          <p>{copy.refreshNote.replace(/^\.\s*/, "")}</p>

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
