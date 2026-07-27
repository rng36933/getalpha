"use client";

import { AlertTriangle, RotateCcw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * The example review in the hero, dressed as the terminal it describes — and
 * playable.
 *
 * A winning trade rated as a broken process. Every competitor's landing page
 * opens with a green arrow; this product's whole argument is that a green arrow
 * proves nothing, so the page has to say that before anything else. Letting a
 * visitor press the button themselves is the difference between reading that
 * argument and watching it happen: they take the trade, they see it win, and
 * then they are told it was badly taken.
 *
 * The content is fixed, deliberately. Generating a real review here would cost
 * eleven cents per visitor and could not be shown before somebody has trades —
 * and the label at the bottom is not a bolted-on disclaimer. The product's
 * argument is that it reports measured facts, so an invented example that could
 * pass for a real account would undercut the page selling it.
 *
 * The scorecard carries bars as well as words: six ratings in a column read as
 * a list to skim, six bars at different lengths read as a verdict.
 */

type Rating = "STRONG" | "ADEQUATE" | "WEAK" | "NOT_ASSESSABLE";

/** Where the simulation has got to. Each step reveals the next. */
type Phase = "idle" | "filling" | "typing" | "done";

const TARGET_PNL = 340;
const FILL_MS = 1100;
const TYPE_MS = 1900;

const VERDICT =
  "Profitable, and taken at four times your median risk with no stop recorded. The result is not evidence the decision was right.";

/** Where the emphasis falls once the sentence has finished typing. */
const VERDICT_HEAD = VERDICT.slice(0, VERDICT.indexOf("The result"));
const VERDICT_TAIL = VERDICT.slice(VERDICT.indexOf("The result"));

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

/** The shape of the winning trade, as a fraction of the box. */
const CURVE = "0,34 14,30 26,33 40,22 54,25 68,14 82,10 100,3";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function Row({
  dimension,
  rating,
  revealed,
  index,
}: {
  dimension: string;
  rating: Rating;
  revealed: boolean;
  index: number;
}) {
  const style = RATING[rating];

  return (
    <div
      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 transition-opacity duration-300 ease-in-out"
      style={{
        opacity: revealed ? 1 : 0,
        transitionDelay: `${index * 70}ms`,
      }}
    >
      <span className="text-[13px] text-zinc-300">{dimension}</span>
      <span
        className={`text-[10px] font-medium uppercase tracking-[0.12em] ${style.text}`}
      >
        {style.label}
      </span>
      <span className="col-span-2 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
        {/* Width animates from nothing, so the bars fill rather than appear —
            the scorecard being computed, not a picture of one. */}
        <span
          className={`block h-full rounded-full transition-[width] duration-500 ease-out ${style.bar}`}
          style={{
            width: revealed ? style.fill : "0%",
            transitionDelay: `${index * 70}ms`,
          }}
        />
      </span>
    </div>
  );
}

export default function VerdictCard() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pnl, setPnl] = useState(0);
  const [typed, setTyped] = useState(0);

  const started = phase !== "idle";

  // The money counting up. A ticking figure is what makes the win feel earned,
  // which is the setup the verdict then knocks down.
  useEffect(() => {
    if (phase !== "filling") return;

    let frame = 0;
    const startedAt = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / FILL_MS, 1);
      // Eased out, so it surges and settles instead of crawling linearly.
      const eased = 1 - (1 - progress) ** 3;

      setPnl(TARGET_PNL * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setPhase("typing");
      }
    };

    frame = requestAnimationFrame(step);

    /**
     * The guarantee that this finishes.
     *
     * `requestAnimationFrame` does not run in a hidden tab. Somebody who starts
     * the trade and switches away would come back to a card frozen at zero with
     * no verdict and no way to restart, because the reset only appears at the
     * end. Timers are throttled in the background but they still fire, so this
     * lands the card on the finished state whatever the browser decided to do
     * with the frames.
     */
    const safety = setTimeout(() => {
      setPnl(TARGET_PNL);
      setPhase("typing");
    }, FILL_MS + 400);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(safety);
    };
  }, [phase]);

  // The verdict, typed. Slow enough to read as it arrives, fast enough that
  // nobody waits: a sentence this length lands in about two seconds.
  useEffect(() => {
    if (phase !== "typing") return;

    // Driven by elapsed time, not by counting ticks. A background tab clamps
    // `setInterval` to about a second, and a per-tick counter would then spend
    // ninety seconds typing a two-second sentence. Reading the clock instead
    // means the sentence lands on time however often the callback actually runs.
    const startedAt = performance.now();

    const timer = setInterval(() => {
      const progress = Math.min((performance.now() - startedAt) / TYPE_MS, 1);
      setTyped(Math.round(VERDICT.length * progress));

      if (progress >= 1) {
        clearInterval(timer);
        setPhase("done");
      }
    }, 20);

    const safety = setTimeout(() => {
      setTyped(VERDICT.length);
      setPhase("done");
    }, TYPE_MS + 400);

    return () => {
      clearInterval(timer);
      clearTimeout(safety);
    };
  }, [phase]);

  function run() {
    // Reduced motion skips straight to the finished card. Decided here rather
    // than inside the effects: an effect that sets state the moment it runs is
    // the cascading render the React compiler rejects, and a reader who has
    // asked for no animation wants the answer, not a faster animation.
    if (prefersReducedMotion()) {
      setPnl(TARGET_PNL);
      setTyped(VERDICT.length);
      setPhase("done");
      return;
    }

    setPnl(0);
    setTyped(0);
    setPhase("filling");
  }

  function reset() {
    setPnl(0);
    setTyped(0);
    setPhase("idle");
  }

  return (
    <div className="relative">
      {/* The card's own light, behind it and never over the content. It only
          turns red once the verdict is in — before that there is nothing to
          warn about. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] transition-all duration-700 ease-in-out"
        style={{
          background:
            phase === "done" || phase === "typing"
              ? "radial-gradient(circle at 70% 20%, rgba(239,68,68,0.12), transparent 60%)"
              : "radial-gradient(circle at 70% 20%, rgba(16,185,129,0.10), transparent 60%)",
        }}
      />

      <div className="lp-glass overflow-hidden rounded-2xl shadow-2xl shadow-black/40">
        {/* Terminal chrome: the strip that says instrument, not marketing panel. */}
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-2.5">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            <span
              className={`size-1.5 rounded-full ${
                started ? "bg-emerald-400" : "bg-zinc-600"
              }`}
            />
            {started ? "process review" : "demo terminal"}
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
                  className={`size-4 shrink-0 transition-colors duration-300 ${
                    started ? "text-emerald-400" : "text-zinc-600"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`font-mono text-2xl font-semibold tabular-nums tracking-tight transition-colors duration-300 ${
                    started ? "text-white" : "text-zinc-600"
                  }`}
                >
                  {started ? `+$${pnl.toFixed(2)}` : "+$0.00"}
                </span>
              </p>
            </div>

            {/* The point of the entire card: profitable and still wrong. Held
                back until the trade has closed, so the visitor gets to enjoy
                the win for a second first. */}
            <span
              className={`lp-alarm inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400 transition-opacity duration-300 ${
                phase === "typing" || phase === "done" ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={phase === "idle" || phase === "filling"}
            >
              <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
              process broken
            </span>
          </div>

          {/* The trade itself, drawn as it fills. */}
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="mt-3 h-14 w-full"
          >
            <polyline
              points={CURVE}
              fill="none"
              stroke="rgb(16 185 129)"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{
                strokeDasharray: 200,
                strokeDashoffset: started ? 0 : 200,
                transition: `stroke-dashoffset ${FILL_MS}ms ease-out`,
              }}
            />
          </svg>

          {phase === "idle" ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={run}
                className="lp-shimmer relative w-full overflow-hidden rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#030712] transition-all duration-300 ease-in-out hover:bg-emerald-400"
              >
                Take the trade
              </button>
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                press it · it wins · read what happens next
              </p>
            </div>
          ) : (
            <>
              {/* `min-h` so the card does not jump as the sentence types. */}
              <p
                aria-live="polite"
                className="mt-4 min-h-[4.5rem] border-l-2 border-red-500/40 pl-3 text-[13px] leading-relaxed text-zinc-400"
              >
                {phase === "done" ? (
                  <>
                    {VERDICT_HEAD}
                    <span className="text-zinc-200">{VERDICT_TAIL}</span>
                  </>
                ) : (
                  <>
                    {VERDICT.slice(0, typed)}
                    <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-zinc-400" />
                  </>
                )}
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {SCORECARD.map((entry, index) => (
                  <Row
                    key={entry.dimension}
                    {...entry}
                    index={index}
                    revealed={phase === "done"}
                  />
                ))}
              </div>

              <div
                className="mt-5 rounded-xl border border-white/[0.05] bg-black/20 p-3.5 transition-opacity duration-500 ease-in-out"
                style={{ opacity: phase === "done" ? 1 : 0 }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  rule for next time
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">
                  Record the stop before entry, and size so risk stays at or
                  below 1.2% of equity.
                </p>
              </div>

              {phase === "done" ? (
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 transition-colors duration-300 hover:text-zinc-300"
                >
                  <RotateCcw className="size-3 shrink-0" aria-hidden="true" />
                  run it again
                </button>
              ) : null}
            </>
          )}
        </div>

        <p className="border-t border-white/[0.05] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
          example review · not a real account
        </p>
      </div>
    </div>
  );
}
