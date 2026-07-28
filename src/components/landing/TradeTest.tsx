"use client";

import { ArrowRight, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { landingCopy, type LandingCopy } from "@/lib/i18n/landing";

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

const STYLE: Record<Severity, { icon: typeof ShieldX; ring: string; text: string }> = {
  CRITICAL: {
    icon: ShieldX,
    ring: "border-red-500/30 bg-red-500/[0.07]",
    text: "text-red-400",
  },
  WARNING: {
    icon: ShieldAlert,
    ring: "border-amber-500/30 bg-amber-500/[0.07]",
    text: "text-amber-400",
  },
  SOUND: {
    icon: ShieldCheck,
    ring: "border-emerald-500/30 bg-emerald-500/[0.07]",
    text: "text-emerald-400",
  },
};

/**
 * Fills `{risk}` and `{bite}` in a sentence from the dictionary.
 *
 * A whole sentence with holes in it, rather than fragments concatenated around
 * a number: Lithuanian puts the percentage in a different case and a different
 * place, and copy assembled from "start" + figure + "end" only ever reads
 * naturally in the language it was written for.
 */
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);
}

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
function evaluate(
  risk: number,
  hadStop: boolean,
  nearNews: boolean,
  copy: LandingCopy["tradeTest"],
): Verdict {
  const findings: string[] = [];

  if (!hadStop) findings.push(copy.finding.noStop);

  if (risk > 2) {
    findings.push(
      fill(copy.finding.riskHigh, {
        risk: risk.toFixed(1),
        bite: String(
          Math.min(99, Math.round((1 - (1 - risk / 100) ** 5) * 100)),
        ),
      }),
    );
  } else if (risk > 1.5) {
    findings.push(fill(copy.finding.riskHeavy, { risk: risk.toFixed(1) }));
  }

  if (nearNews) findings.push(copy.finding.news);

  if (!hadStop && risk > 2) {
    return {
      severity: "CRITICAL",
      headline: copy.headline.critical,
      findings,
      cta: copy.cta.critical,
    };
  }

  if (findings.length === 0) {
    return {
      severity: "SOUND",
      headline: copy.headline.sound,
      findings: [copy.finding.sound],
      cta: copy.cta.sound,
    };
  }

  return {
    severity: "WARNING",
    headline:
      findings.length > 1 ? copy.headline.twoLeaks : copy.headline.oneLeak,
    findings,
    cta: copy.cta.warning,
  };
}

function Toggle({
  label,
  hint,
  value,
  onChange,
  yes,
  no,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
  yes: string;
  no: string;
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
            // Tall enough to hit with a thumb. At the size these started they
            // were 28 pixels of target on a phone, which is a control that
            // works on a mouse and fights a finger.
            className={`min-h-[2.5rem] rounded-md px-5 py-2 text-sm font-medium transition-all duration-300 ease-in-out ${
              value === option
                ? "bg-white/[0.08] text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {option ? yes : no}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TradeTest() {
  const copy = landingCopy.tradeTest;

  const [risk, setRisk] = useState(3);
  const [hadStop, setHadStop] = useState(false);
  const [nearNews, setNearNews] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const style = verdict ? STYLE[verdict.severity] : null;
  const Icon = style?.icon;
  const severityLabel = verdict
    ? {
        CRITICAL: copy.severity.critical,
        WARNING: copy.severity.warning,
        SOUND: copy.severity.sound,
      }[verdict.severity]
    : null;

  return (
    <div className="lp-glass rounded-2xl p-5 sm:p-7">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="risk"
              className="text-[13px] font-medium text-zinc-200"
            >
              {copy.riskLabel}
            </label>
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
              {copy.riskHint}
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
                // `h-2` and `touch-manipulation`: a six-pixel track is a hard
                // thing to grab on a phone, and without the touch hint a drag
                // near the slider can be read as a double-tap zoom instead.
                className="h-2 min-w-0 flex-1 cursor-pointer touch-manipulation appearance-none rounded-full bg-white/[0.08] accent-[#f2c94c]"
              />
              <span className="w-16 shrink-0 text-right font-mono text-lg font-semibold tabular-nums text-white">
                {risk.toFixed(1)}%
              </span>
            </div>
          </div>

          <Toggle
            label={copy.stopLabel}
            hint={copy.stopHint}
            value={hadStop}
            onChange={setHadStop}
            yes={copy.yes}
            no={copy.no}
          />

          <Toggle
            label={copy.newsLabel}
            hint={copy.newsHint}
            value={nearNews}
            onChange={setNearNews}
            yes={copy.yes}
            no={copy.no}
          />

          <button
            type="button"
            onClick={() => setVerdict(evaluate(risk, hadStop, nearNews, copy))}
            className="lp-shimmer relative w-full overflow-hidden rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-all duration-300 ease-in-out hover:opacity-90 sm:w-auto"
          >
            {copy.evaluate}
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
                {severityLabel}
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
                {copy.footnote}
              </p>
            </div>
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/[0.08] p-6 text-center">
              <p className="max-w-xs text-[13px] leading-relaxed text-zinc-500">
                {copy.empty}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
