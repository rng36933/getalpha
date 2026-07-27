"use client";

import { ArrowRight, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Three questions about the visitor's own last trade, judged on the spot.
 *
 * The page argues that a result is not evidence a decision was sound. This is
 * the shortest way to let somebody test that claim against a trade they
 * actually took, before signing up for anything — and the answer arrives in
 * their own terms rather than as another feature description.
 *
 * Everything here runs in the browser against fixed rules. Nothing is sent
 * anywhere, no account is needed, and the panel says so: a widget that quietly
 * posted somebody's risk numbers to a server, on a page whose whole argument is
 * about handling records honestly, would be the wrong thing to build.
 *
 * It is also **not** the AI review, and the result says that too. Three inputs
 * cannot judge a trade; they can only show the shape of the questions the real
 * review asks, which is the honest version of this widget.
 */

type Severity = "CRITICAL" | "WARNING" | "SOUND";

type Verdict = {
  severity: Severity;
  headline: string;
  findings: string[];
  /** What the CTA underneath should say, given what was just found. */
  cta: string;
};

const STYLE: Record<
  Severity,
  { icon: typeof ShieldX; ring: string; text: string; label: string }
> = {
  CRITICAL: {
    icon: ShieldX,
    ring: "border-red-500/30 bg-red-500/[0.07]",
    text: "text-red-400",
    label: "Process broken",
  },
  WARNING: {
    icon: ShieldAlert,
    ring: "border-amber-500/30 bg-amber-500/[0.07]",
    text: "text-amber-400",
    label: "Leaks worth closing",
  },
  SOUND: {
    icon: ShieldCheck,
    ring: "border-emerald-500/30 bg-emerald-500/[0.07]",
    text: "text-emerald-400",
    label: "Sound on these three",
  },
};

/**
 * The rules.
 *
 * Deliberately blunt, and deliberately about the decision rather than the
 * outcome — the visitor is never asked whether the trade won, because that is
 * the input this product argues has no bearing on whether it was well taken.
 *
 * Two percent is the line because it is the conventional one, not because it is
 * correct for everybody. The real review compares a trade against the trader's
 * own median rather than against a number somebody read in a book, and the note
 * under the result says so.
 */
function evaluate(risk: number, hadStop: boolean, nearNews: boolean): Verdict {
  const findings: string[] = [];

  if (!hadStop) {
    findings.push(
      "No stop recorded before entry. There was no defined risk, so the size cannot be justified and the loss had no floor — whatever happened next was the market's decision, not yours.",
    );
  }

  if (risk > 2) {
    findings.push(
      `${risk.toFixed(1)}% of equity on one trade. At this size a run of five losses — an ordinary week — takes about a ${Math.min(99, Math.round((1 - (1 - risk / 100) ** 5) * 100))}% bite out of the account before anything unusual has happened.`,
    );
  } else if (risk > 1.5) {
    findings.push(
      `${risk.toFixed(1)}% is on the heavy side of normal. Survivable once; a habit worth watching if it is where you always sit.`,
    );
  }

  if (nearNews) {
    findings.push(
      "Entered inside fifteen minutes of a high-impact release. Spreads widen and stops get filled past where they were placed, so the risk taken was larger than the risk planned.",
    );
  }

  if (!hadStop && risk > 2) {
    return {
      severity: "CRITICAL",
      headline:
        "Critical sizing leak. High risk of ruin, and stop placement missing.",
      findings,
      cta: "See this run against every trade you have taken",
    };
  }

  if (findings.length === 0) {
    return {
      severity: "SOUND",
      headline:
        "Nothing broken in these three. Whether it was a good trade is a question about the other twenty.",
      findings: [
        "Risk inside a defensible band, a stop recorded before entry, and no release sitting on top of the entry. On these three, the decision holds regardless of what the trade made.",
      ],
      cta: "Check that against your whole record",
    };
  }

  return {
    severity: "WARNING",
    headline:
      findings.length > 1
        ? "Two leaks in one trade. Either alone is survivable; together they compound."
        : "One leak, and it is the kind that repeats.",
    findings,
    cta: "Find out how often you do this",
  };
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-zinc-200">{label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{hint}</p>

      <div
        role="group"
        aria-label={label}
        className="mt-2.5 inline-flex rounded-lg border border-white/[0.08] p-0.5"
      >
        {[true, false].map((option) => (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out ${
              value === option
                ? "bg-white/[0.08] text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {option ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TradeTest() {
  const [risk, setRisk] = useState(3);
  const [hadStop, setHadStop] = useState(false);
  const [nearNews, setNearNews] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const style = verdict ? STYLE[verdict.severity] : null;
  const Icon = style?.icon;

  return (
    <div className="lp-glass rounded-2xl p-5 sm:p-7">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="risk"
              className="text-[13px] font-medium text-zinc-200"
            >
              Risk taken on your last trade
            </label>
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
              As a share of your account, if the stop had been hit.
            </p>

            <div className="mt-3 flex items-center gap-4">
              <input
                id="risk"
                type="range"
                min={0.1}
                max={10}
                step={0.1}
                value={risk}
                onChange={(event) => setRisk(Number(event.target.value))}
                className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-violet-500"
              />
              <span className="w-16 shrink-0 text-right font-mono text-lg font-semibold tabular-nums text-white">
                {risk.toFixed(1)}%
              </span>
            </div>
          </div>

          <Toggle
            label="Was the stop recorded before you entered?"
            hint="Before, not after. A stop decided once the trade is moving is a reaction."
            value={hadStop}
            onChange={setHadStop}
          />

          <Toggle
            label="Did you enter within 15 minutes of a high-impact release?"
            hint="Non-farm payrolls, CPI, a rate decision — anything on the calendar in red."
            value={nearNews}
            onChange={setNearNews}
          />

          <button
            type="button"
            onClick={() => setVerdict(evaluate(risk, hadStop, nearNews))}
            className="lp-shimmer relative w-full overflow-hidden rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-300 ease-in-out hover:bg-violet-400 sm:w-auto"
          >
            Evaluate my decision
          </button>
        </div>

        {/* The answer. A fixed panel rather than one that appears below the
            inputs, so pressing the button does not shove the page around. */}
        <div className="min-h-[18rem]">
          {verdict && style && Icon ? (
            <div
              aria-live="polite"
              className={`h-full rounded-xl border p-4 sm:p-5 ${style.ring}`}
            >
              <p
                className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] ${style.text}`}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                {style.label}
              </p>

              <p className="mt-3 text-[15px] font-semibold leading-snug tracking-tight text-white">
                {verdict.headline}
              </p>

              <ul className="mt-4 space-y-3">
                {verdict.findings.map((finding) => (
                  <li
                    key={finding}
                    className="border-l-2 border-white/[0.08] pl-3 text-[13px] leading-relaxed text-zinc-400"
                  >
                    {finding}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="group mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#030712] transition-all duration-300 ease-in-out hover:bg-zinc-200"
              >
                {verdict.cta}
                <ArrowRight
                  className="size-4 shrink-0 transition-all duration-300 ease-in-out group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>

              <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-zinc-500">
                Three questions and a rule of thumb — not the review. The real
                one reads the trades your terminal already sent, compares the
                size against your own median rather than a number from a book,
                and has your notes in front of it.
              </p>
            </div>
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/[0.08] p-6 text-center">
              <p className="max-w-xs text-[13px] leading-relaxed text-zinc-500">
                Answer the three on the left and press the button. Nothing is
                sent anywhere — this runs in your browser, and no account is
                needed to read the answer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
