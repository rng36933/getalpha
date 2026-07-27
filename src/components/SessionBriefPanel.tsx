"use client";

import Link from "next/link";
import { useState } from "react";
import { dashboardCopy } from "@/lib/i18n/app/dashboard";
import type { Locale } from "@/lib/i18n/locales";
import type { SessionBrief, TradingSession } from "@/lib/ai/types";

const TONE_CLASS: Record<SessionBrief["riskTone"]["tone"], string> = {
  RISK_ON: "bg-positive/15 text-positive",
  RISK_OFF: "bg-negative/15 text-negative",
  NEUTRAL: "bg-muted/15 text-muted",
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      brief: SessionBrief;
      cached: boolean;
      degraded: boolean;
      generatedAt?: string;
    }
  /** Somebody else is generating it; the answer exists in a few seconds. */
  | { status: "generating"; retryAfterSeconds: number }
  | { status: "error"; message: string; upgrade?: boolean };

/** What the brief covers. Server-rendered, then confirmed by each response. */
type Coverage = {
  instruments: string[];
  personalised: boolean;
  truncated: boolean;
};

export default function SessionBriefPanel({
  instruments,
  personalised,
  truncated,
  locale,
}: {
  /** The instruments this reader's brief is written from. */
  instruments: string[];
  /** True when that is their own watchlist rather than the free default. */
  personalised: boolean;
  /** True when their watchlist is longer than one brief may cover. */
  truncated: boolean;
  locale: Locale;
}) {
  const copy = dashboardCopy(locale).sessionBrief;

  const SESSIONS: { value: TradingSession; label: string }[] = [
    { value: "LONDON", label: copy.sessions.london },
    { value: "NEW_YORK", label: copy.sessions.newYork },
    { value: "ASIA", label: copy.sessions.asia },
  ];

  const TONE: Record<SessionBrief["riskTone"]["tone"], string> = {
    RISK_ON: copy.tone.riskOn,
    RISK_OFF: copy.tone.riskOff,
    NEUTRAL: copy.tone.neutral,
  };

  const [session, setSession] = useState<TradingSession>("LONDON");
  const [state, setState] = useState<State>({ status: "idle" });

  // Seeded from the server so the panel states its coverage before anyone
  // presses anything, then re-read from every response: the route resolves this
  // from the plan and the watchlist, and a subscription that lapsed or a pair
  // added in another tab should not leave the label describing the old set.
  const [coverage, setCoverage] = useState<Coverage>({
    instruments,
    personalised,
    truncated,
  });

  function absorbCoverage(body: unknown) {
    if (typeof body !== "object" || body === null) return;
    const next = body as Partial<Coverage>;

    if (Array.isArray(next.instruments) && typeof next.personalised === "boolean") {
      setCoverage({
        instruments: next.instruments,
        personalised: next.personalised,
        truncated: next.truncated === true,
      });
    }
  }

  async function load(next: TradingSession) {
    setSession(next);
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/ai/session-brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session: next }),
      });

      const body = await response.json().catch(() => null);
      absorbCoverage(body);

      if (response.status === 202) {
        setState({
          status: "generating",
          retryAfterSeconds: body?.retryAfterSeconds ?? 15,
        });
        return;
      }

      if (!response.ok) {
        setState({
          status: "error",
          message: body?.error ?? copy.genericError,
          upgrade: body?.reason === "SUBSCRIPTION_REQUIRED",
        });
        return;
      }

      setState({
        status: "ready",
        brief: body.brief as SessionBrief,
        cached: Boolean(body.cached),
        degraded: Boolean(body.degraded),
        generatedAt: body.generatedAt,
      });
    } catch {
      setState({
        status: "error",
        message: copy.couldNotReach,
      });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {SESSIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => load(option.value)}
            disabled={state.status === "loading"}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              session === option.value && state.status !== "idle"
                ? "border-accent bg-accent-soft text-accent"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {state.status === "idle" ? (
          <p className="text-sm text-muted">{copy.idle}</p>
        ) : null}

        {/* Always names the instruments. The brief text says "the supplied
            watchlist", which reads as the reader's own — for a Free reader it
            is not, and somebody seeing a pair discussed that they do not trade
            deserves to know why before they read a word of it. */}
        {coverage.instruments.length > 0 ? (
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
            {coverage.personalised ? (
              <>
                {copy.coveragePersonalised(
                  coverage.truncated ? copy.coverageTop : copy.coverageYours,
                  coverage.instruments.join(", "),
                )}{" "}
                {coverage.truncated
                  ? copy.truncatedNote(coverage.instruments.length)
                  : ""}
                {copy.sharedNote}
              </>
            ) : (
              <>
                {copy.coverageFree(coverage.instruments.join(", "))}{" "}
                <Link href="/dashboard/pricing" className="text-accent hover:underline">
                  {copy.freeLink}
                </Link>
                .
              </>
            )}
          </p>
        ) : null}

        {state.status === "loading" ? (
          <p className="text-sm text-muted">{copy.loading}</p>
        ) : null}

        {state.status === "generating" ? (
          <p className="text-sm text-muted">
            {copy.generating(state.retryAfterSeconds)}
          </p>
        ) : null}

        {state.status === "error" ? (
          <div>
            <p className="text-sm text-negative">{state.message}</p>
            {state.upgrade ? (
              <Link
                href="/dashboard/pricing"
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                {copy.seePlans}
              </Link>
            ) : null}
          </div>
        ) : null}

        {state.status === "ready" ? (
          <div className="space-y-4">
            <div>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  TONE_CLASS[state.brief.riskTone.tone]
                }`}
              >
                {TONE[state.brief.riskTone.tone]}
              </span>
              <p className="mt-2 text-sm leading-relaxed">
                {state.brief.riskTone.reason}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                {copy.keyMarketDriver}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {state.brief.keyMarketDriver}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                {copy.volatilityWarning}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {state.brief.watchlistVolatilityWarning}
              </p>
            </div>

            {state.degraded ? (
              <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                {copy.degradedNote}
              </p>
            ) : null}

            <p className="text-[11px] text-muted">
              {state.cached ? copy.servedFromCache : copy.writtenJustNow}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
