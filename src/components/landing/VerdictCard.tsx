import { AlertTriangle, TrendingUp } from "lucide-react";

/**
 * The example review in the hero, dressed as the terminal it describes.
 *
 * A winning trade rated as a broken process. Every competitor's landing page
 * opens with a green arrow; this product's whole argument is that a green arrow
 * proves nothing, so the page has to say that before anything else.
 *
 * Static content, deliberately. Generating a real review here would cost eleven
 * cents per visitor and could not be shown before somebody has trades — and the
 * label at the bottom is not a bolted-on disclaimer. The product's argument is
 * that it reports measured facts, so an invented example that could pass for a
 * real account would undercut the page selling it.
 *
 * The scorecard carries bars as well as words: six ratings in a column read as a
 * list to skim, six bars at different lengths read as a verdict.
 */

type Rating = "STRONG" | "ADEQUATE" | "WEAK" | "NOT_ASSESSABLE";

/**
 * How full each bar is, and in what colour.
 *
 * Weak is the only rating that gets to be loud. If three of them glow the eye
 * has nowhere to land, and the finding on this card is the sizing.
 */
const RATING: Record<
  Rating,
  { fill: string; bar: string; text: string; label: string }
> = {
  STRONG: {
    fill: "100%",
    bar: "bg-emerald-400",
    text: "text-emerald-400",
    label: "Strong",
  },
  ADEQUATE: {
    fill: "62%",
    bar: "bg-zinc-500",
    text: "text-zinc-400",
    label: "Adequate",
  },
  WEAK: { fill: "24%", bar: "bg-red-500", text: "text-red-400", label: "Weak" },
  NOT_ASSESSABLE: {
    fill: "0%",
    bar: "bg-zinc-700",
    text: "text-zinc-500",
    label: "No data",
  },
};

const SCORECARD: { dimension: string; rating: Rating }[] = [
  { dimension: "Trade selection", rating: "ADEQUATE" },
  { dimension: "Position sizing", rating: "WEAK" },
  { dimension: "Stop placement", rating: "WEAK" },
  { dimension: "Exit management", rating: "ADEQUATE" },
  { dimension: "Plan adherence", rating: "WEAK" },
  { dimension: "Emotional control", rating: "NOT_ASSESSABLE" },
];

function Row({ dimension, rating }: { dimension: string; rating: Rating }) {
  const style = RATING[rating];

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
      <span className="text-[13px] text-zinc-300">{dimension}</span>
      <span
        className={`text-[10px] font-medium uppercase tracking-[0.12em] ${style.text}`}
      >
        {style.label}
      </span>
      <span className="col-span-2 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
        <span
          className={`block h-full rounded-full transition-all duration-300 ease-in-out ${style.bar}`}
          style={{ width: style.fill }}
        />
      </span>
    </div>
  );
}

export default function VerdictCard() {
  return (
    <div className="relative">
      {/* The card's own light, behind it and never over the content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_70%_20%,rgba(239,68,68,0.12),transparent_60%)]"
      />

      <div className="lp-glass overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
        {/* Terminal chrome: the strip that says instrument, not marketing panel. */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-2.5">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            process review
          </span>
          <span className="font-mono text-[10px] tabular-nums text-zinc-600">
            #1184 · 14:32 UTC
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2">
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  buy
                </span>
                <span className="font-semibold tracking-tight text-white">
                  XAUUSD
                </span>
              </p>
              <p className="mt-1.5 flex items-baseline gap-1.5">
                <TrendingUp
                  className="size-4 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
                <span className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-white">
                  +$340.00
                </span>
              </p>
            </div>

            {/* The point of the entire card: profitable and still wrong. */}
            <span className="lp-alarm inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400">
              <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
              process broken
            </span>
          </div>

          <p className="mt-4 border-l-2 border-red-500/40 pl-3 text-[13px] leading-relaxed text-zinc-400">
            Profitable, and taken at four times your median risk with no stop
            recorded.{" "}
            <span className="text-zinc-200">
              The result is not evidence the decision was right.
            </span>
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {SCORECARD.map((entry) => (
              <Row key={entry.dimension} {...entry} />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/[0.05] bg-black/20 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              rule for next time
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">
              Record the stop before entry, and size so risk stays at or below
              1.2% of equity.
            </p>
          </div>
        </div>

        <p className="border-t border-white/[0.05] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
          example review · not a real account
        </p>
      </div>
    </div>
  );
}
