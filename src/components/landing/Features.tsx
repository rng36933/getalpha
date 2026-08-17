import { Calendar, Lock, Sparkles, TrendingUp } from "lucide-react";
import CountUp from "@/components/CountUp";
import { landingCopy } from "@/lib/i18n/landing";

/**
 * The capabilities, as an asymmetric grid.
 *
 * They used to be three identical blocks of prose. Three boxes that differ only
 * in their words read as one box repeated, and a reader skips all three — so
 * each cell now carries a different weight and its own small visual.
 *
 * The two AI cards are marked out in violet, and violet appears nowhere else on
 * the page. It means one thing: this is what Pro pays for. A colour that carries
 * information is worth more than a colour that looks expensive.
 */

function Readout({
  label,
  value,
  tone = "text-zinc-200",
  live = false,
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
  /** Marks a reading that moves in the real product, with a pulse to say so. */
  live?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-1.5 font-mono text-[11px] tabular-nums last:border-b-0">
      <span className="flex items-center gap-1.5 text-zinc-500">
        {live ? (
          <span
            aria-hidden="true"
            className="live-dot size-1.5 shrink-0 rounded-full bg-amber-400"
          />
        ) : null}
        {label}
      </span>
      <span className={tone}>{value}</span>
    </div>
  );
}

/**
 * One cell of the grid.
 *
 * `group` drives both micro-interactions: the border lifts and the icon rises.
 * Both are triggered by the card, not the icon, so the whole surface reacts to
 * being pointed at rather than only the thing under the cursor.
 */
function Cell({
  icon,
  title,
  children,
  demo,
  className = "",
  accent = "zinc",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  demo: React.ReactNode;
  className?: string;
  accent?: "zinc" | "violet";
}) {
  const isAi = accent === "violet";

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-sm border-y border-r border-l-2 p-5 transition-all duration-300 ease-in-out sm:p-6 ${
        isAi
          ? "border-white/[0.08] border-l-accent bg-accent/[0.03] hover:border-white/[0.16]"
          : "border-white/[0.08] border-l-white/[0.18] bg-white/[0.02] hover:border-white/[0.16]"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-sm border transition-all duration-300 ease-in-out group-hover:-translate-y-1 ${
            isAi
              ? "border-accent/25 bg-accent/10 text-accent"
              : "border-white/[0.06] bg-white/[0.03] text-zinc-300"
          }`}
        >
          {icon}
        </span>

        {isAi ? (
          <span className="inline-flex items-center gap-1 rounded-sm border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
            <Lock className="size-2.5 shrink-0" aria-hidden="true" />
            pro
          </span>
        ) : null}
      </div>

      <h3 className="font-mono mt-4 text-[15px] font-semibold uppercase tracking-wide text-white">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
        {children}
      </p>

      <div className="mt-5 flex-1 rounded-sm border border-white/[0.05] bg-black/25 p-3.5">
        {demo}
      </div>
    </div>
  );
}

export default function Features() {
  const { cards, readouts } = landingCopy.features;

  return (
    // Asymmetric on purpose: the journal is what everybody gets, so it takes the
    // wide cell and the two paid modules sit beside it.
    <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 lg:grid-cols-3">
      <Cell
        className="lg:col-span-2"
        icon={<TrendingUp className="size-[18px]" aria-hidden="true" />}
        title={cards.journal.title}
        demo={
          // Counted up rather than printed. The sentence under this card says
          // you never type a number in; a figure that arrives by computing says
          // it first, and without a word.
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Readout
                label={readouts.risk}
                value={<CountUp value={0.94} decimals={2} suffix="%" />}
              />
              <Readout
                label={readouts.plannedRR}
                value={<CountUp value={2.4} decimals={2} />}
              />
            </div>
            <div>
              <Readout
                label={readouts.result}
                tone="text-emerald-400"
                value={
                  <CountUp value={340} decimals={2} prefix="+€" />
                }
              />
              <Readout label={readouts.exit} value={readouts.exitTarget} />
            </div>
          </div>
        }
      >
        {cards.journal.body}
      </Cell>

      <Cell
        accent="violet"
        icon={<Sparkles className="size-[18px]" aria-hidden="true" />}
        title={cards.brief.title}
        demo={
          <div>
            <Readout
              label={readouts.riskTone}
              value={readouts.riskToneValue}
              tone="text-amber-400"
            />
            {/* Left untranslated on purpose: a release name and a clock time
                read identically to a Lithuanian trader, and "JAV VKI" would be
                a translation of something nobody calls it. */}
            <Readout label={readouts.driver} value="US CPI 13:30" />
            {/* The one reading on this card that moves while you watch it, so
                it is the one that gets the pulse. */}
            <Readout label={readouts.volatility} value="XAUUSD, DXY" live />
          </div>
        }
      >
        {cards.brief.body}
      </Cell>

      <Cell
        accent="violet"
        icon={<Sparkles className="size-[18px]" aria-hidden="true" />}
        title={cards.review.title}
        demo={
          <div>
            <Readout
              label={readouts.primaryLeak}
              value={readouts.primaryLeakValue}
            />
            <Readout label={readouts.seenIn} value={readouts.seenInValue} />
            {/* Money, not R. The app stopped showing R-multiples, and a landing
                page quoting a unit the product no longer prints is a promise it
                does not keep. */}
            <Readout
              label={readouts.cost}
              tone="text-red-400"
              value={<CountUp value={-612.4} decimals={2} prefix="€" />}
            />
          </div>
        }
      >
        {cards.review.body}
      </Cell>

      <Cell
        className="lg:col-span-2"
        icon={<Calendar className="size-[18px]" aria-hidden="true" />}
        title={cards.calendar.title}
        demo={
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Readout label="13:30 USD" value="CPI" tone="text-red-400" />
              <Readout label="15:00 USD" value={readouts.fedSpeak} />
            </div>
            <div>
              <Readout label="09:00 EUR" value="PMI" />
              {/* The filter lights up with the card, so the thing being
                  demonstrated is the thing that reacts to the cursor. */}
              <Readout
                label={readouts.filteredBy}
                value={
                  <span className="rounded border border-white/[0.08] px-1.5 py-0.5 transition-all duration-300 ease-in-out group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent-foreground">
                    {readouts.watchlist}
                  </span>
                }
              />
            </div>
          </div>
        }
      >
        {cards.calendar.body}
      </Cell>
    </div>
  );
}
