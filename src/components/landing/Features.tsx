import { Calendar, Lock, Sparkles, TrendingUp } from "lucide-react";

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
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-1.5 font-mono text-[11px] tabular-nums last:border-b-0">
      <span className="text-zinc-500">{label}</span>
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
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <Readout label="Risk" value="0.94%" />
              <Readout label="Planned RR" value="2.40" />
            </div>
            <div>
              <Readout label="Result" value="+1.80R" tone="text-emerald-400" />
              <Readout label="Exit" value="Target" />
            </div>
          </div>
        }
      >
        R-multiples, planned reward-to-risk and risk as a share of equity are
        calculated from what you record. You never type an R, so you can never
        flatter one.
      </Cell>

      <Cell
        accent="violet"
        icon={<Sparkles className="size-[18px]" aria-hidden="true" />}
        title="The session, before it starts"
        demo={
          <div>
            <Readout label="Risk tone" value="Cautious" tone="text-amber-400" />
            <Readout label="Driver" value="US CPI 13:30" />
            <Readout label="Volatility" value="XAUUSD, DXY" />
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
            <Readout label="Cost" value="−4.1R" tone="text-red-400" />
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
              <Readout label="Filtered by" value="Your watchlist" />
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
