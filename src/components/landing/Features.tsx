import { Calendar, Lock, Sparkles, TrendingUp } from "lucide-react";
import CountUp from "@/components/landing/CountUp";

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
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300 ease-in-out sm:p-6 ${
        isAi
          ? "border-violet-500/20 bg-violet-500/[0.03] hover:border-violet-500/40"
          : "border-white/[0.06] bg-white/[0.02] hover:border-zinc-700"
      } ${className}`}
    >
      {/* The Pro halo. Brightens on hover, always behind the content. */}
      {isAi ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px -z-10 rounded-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.22),transparent_65%)] opacity-70 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
        />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-lg border transition-all duration-300 ease-in-out group-hover:-translate-y-1 ${
            isAi
              ? "border-violet-500/25 bg-violet-500/10 text-violet-300"
              : "border-white/[0.06] bg-white/[0.03] text-zinc-300"
          }`}
        >
          {icon}
        </span>

        {isAi ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-violet-300">
            <Lock className="size-2.5 shrink-0" aria-hidden="true" />
            pro
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
        {children}
      </p>

      <div className="mt-5 flex-1 rounded-xl border border-white/[0.05] bg-black/25 p-3.5">
        {demo}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    // Asymmetric on purpose: the journal is what everybody gets, so it takes the
    // wide cell and the two paid modules sit beside it.
    <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 lg:grid-cols-3">
      <Cell
        className="lg:col-span-2"
        icon={<TrendingUp className="size-[18px]" aria-hidden="true" />}
        title="A journal that computes"
        demo={
          // Counted up rather than printed. The sentence under this card says
          // you never type a number in; a figure that arrives by computing says
          // it first, and without a word.
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Readout
                label="Risk"
                value={<CountUp value={0.94} decimals={2} suffix="%" />}
              />
              <Readout
                label="Planned RR"
                value={<CountUp value={2.4} decimals={2} />}
              />
            </div>
            <div>
              <Readout
                label="Result"
                tone="text-emerald-400"
                value={
                  <CountUp value={340} decimals={2} prefix="+€" />
                }
              />
              <Readout label="Exit" value="Target" />
            </div>
          </div>
        }
      >
        Your P&amp;L, the risk you took as a share of the account, and the
        reward you planned against it — all read straight from the terminal. You
        never type a number in, so you can never flatter one.
      </Cell>

      <Cell
        accent="violet"
        icon={<Sparkles className="size-[18px]" aria-hidden="true" />}
        title="The session, before it starts"
        demo={
          <div>
            <Readout label="Risk tone" value="Cautious" tone="text-amber-400" />
            <Readout label="Driver" value="US CPI 13:30" />
            {/* The one reading on this card that moves while you watch it, so
                it is the one that gets the pulse. */}
            <Readout label="Volatility" value="XAUUSD, DXY" live />
          </div>
        }
      >
        One short brief: the tone of the session, the single driver that matters,
        and where volatility is likely — each claim naming the calendar entry or
        headline it came from.
      </Cell>

      <Cell
        accent="violet"
        icon={<Sparkles className="size-[18px]" aria-hidden="true" />}
        title="A review of your process"
        demo={
          <div>
            <Readout label="Primary leak" value="Sizing after a loss" />
            <Readout label="Seen in" value="7 of 22 trades" />
            {/* Money, not R. The app stopped showing R-multiples, and a landing
                page quoting a unit the product no longer prints is a promise it
                does not keep. */}
            <Readout
              label="Cost"
              tone="text-red-400"
              value={<CountUp value={-612.4} decimals={2} prefix="€" />}
            />
          </div>
        }
      >
        Six dimensions, judged against your own history rather than a generic
        ideal. &ldquo;Twice your median risk&rdquo; is a finding. &ldquo;Risk
        should be 1%&rdquo; is a platitude.
      </Cell>

      <Cell
        className="lg:col-span-2"
        icon={<Calendar className="size-[18px]" aria-hidden="true" />}
        title="The releases that move your pairs"
        demo={
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Readout label="13:30 USD" value="CPI" tone="text-red-400" />
              <Readout label="15:00 USD" value="Fed speak" />
            </div>
            <div>
              <Readout label="09:00 EUR" value="PMI" />
              {/* The filter lights up with the card, so the thing being
                  demonstrated is the thing that reacts to the cursor. */}
              <Readout
                label="Filtered by"
                value={
                  <span className="rounded border border-white/[0.08] px-1.5 py-0.5 transition-all duration-300 ease-in-out group-hover:border-emerald-400/40 group-hover:bg-emerald-400/10 group-hover:text-emerald-300">
                    Your watchlist
                  </span>
                }
              />
            </div>
          </div>
        }
      >
        Today&rsquo;s calendar in your own timezone, filtered to the currencies
        you actually hold — both legs of every pair, because a release moves the
        pair whichever leg it lands on.
      </Cell>
    </div>
  );
}
