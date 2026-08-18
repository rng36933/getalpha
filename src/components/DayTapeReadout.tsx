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
  UP: { text: "text-positive", bg: "bg-positive/12" },
  DOWN: { text: "text-negative", bg: "bg-negative/12" },
  FLAT: { text: "text-muted", bg: "bg-muted/12" },
};

function toneWord(direction: Direction, copy: TapeCopy["readout"]): string {
  if (direction === "UP") return copy.up;
  if (direction === "DOWN") return copy.down;
  return copy.flat;
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
 * Reading keys whose detail sentence only restates a number shown elsewhere on
 * the card — the open/now pair above, the low/high under the range bar, or a
 * boilerplate line with no data in it. Cut here rather than in the copy files,
 * so the sentence still exists for anything else that reads `tape-copy.ts`.
 */
const DETAIL_REDUNDANT: ReadonlySet<string> = new Set([
  "VS_OPEN",
  "RANGE_POSITION",
  "INTRADAY_BARS",
]);

/**
 * One reading, collapsed to its label and value until pressed.
 *
 * Rows whose detail sentence is cut as redundant (see `DETAIL_REDUNDANT`)
 * have nothing to expand into, so they render as plain, unclickable rows
 * rather than a toggle that always opens onto nothing.
 */
function ReadingRow({
  reading,
  copy,
}: {
  reading: Reading;
  copy: TapeCopy["readout"];
}) {
  const [open, setOpen] = useState(false);
  const expandable = !DETAIL_REDUNDANT.has(reading.key);
  const tone = TONE[reading.direction];

  const row = (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <Arrow direction={reading.direction} copy={copy} className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className={`text-sm ${tone.text}`}>{reading.label}</span>
          <span className={`font-mono text-xs font-semibold ${tone.text}`}>
            {reading.value}
          </span>
        </p>
      </div>
    </div>
  );

  return (
    <li className={tone.bg}>
      {expandable ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="w-full cursor-pointer text-left transition-colors hover:bg-white/[0.03]"
        >
          {row}
        </button>
      ) : (
        row
      )}

      {expandable ? (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <p className="px-3 pb-2.5 pl-10 text-[11px] leading-relaxed text-muted">
              {reading.detail}
            </p>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/** Where price sits between the day's low and its high. */
function RangeBar({ tape, copy }: { tape: DayTape; copy: TapeCopy["readout"] }) {
  if (tape.rangePosition === null) return null;

  return (
    <div>
      <div className="relative h-2 rounded-full bg-surface-raised">
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
          style={{ left: `${tape.rangePosition}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] tabular-nums text-muted">
        <span>{tape.dayLow}</span>
        <span className="text-foreground">
          {tape.rangePosition}% {copy.ofRange}
        </span>
        <span>{tape.dayHigh}</span>
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

      <ul className="divide-y divide-line border-y border-line">
        {tape.readings.map((reading) => (
          <ReadingRow key={reading.key} reading={reading} copy={copy} />
        ))}
      </ul>

      <div className="space-y-1 text-xs text-muted">
        <p className="text-foreground">{agreementLine(tape, copy)}</p>

        {tape.rangeVsAverage !== null ? (
          <p>
            {tape.rangeVsAverage < 0.05
              ? copy.rangeTiny
              : tape.rangeVsAverage >= 1.3
                ? copy.rangeWide(tape.rangeVsAverage)
                : tape.rangeVsAverage <= 0.7
                  ? copy.rangeQuiet(tape.rangeVsAverage)
                  : copy.rangeNormal(tape.rangeVsAverage)}
          </p>
        ) : null}

        <p>
          {copy.sessionOf(tape.sessionDate)}
          {fetchedAt ? (
            <>
              {copy.pricedAt}
              <LocalTime at={fetchedAt} utc={fetchedAt.slice(11, 16)} />
            </>
          ) : null}
          {copy.refreshNote}
        </p>

        {stale ? <p className="text-warning">{copy.staleNote}</p> : null}
      </div>

      {/* Skipped when the market-closed warning already ran: both sentences
          make the same "not a forecast" point, and saying it twice on one
          card reads as noise rather than caution. */}
      {tape.barelyTraded ? null : (
        <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
          {copy.footnote}
        </p>
      )}
    </div>
  );
}
