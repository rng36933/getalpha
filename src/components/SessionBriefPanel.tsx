"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { SessionBrief, TradingSession } from "@/lib/ai/types";

const SESSIONS: { value: TradingSession; label: string }[] = [
  { value: "LONDON", label: "London" },
  { value: "NEW_YORK", label: "New York" },
  { value: "ASIA", label: "Asia" },
];

const TONE: Record<
  SessionBrief["riskTone"]["tone"],
  { label: string; className: string }
> = {
  RISK_ON: { label: "Risk on", className: "bg-positive/15 text-positive" },
  RISK_OFF: { label: "Risk off", className: "bg-negative/15 text-negative" },
  NEUTRAL: { label: "Neutral", className: "bg-muted/15 text-muted" },
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
}: {
  /** The instruments this reader's brief is written from. */
  instruments: string[];
  /** True when that is their own watchlist rather than the free default. */
  personalised: boolean;
  /** True when their watchlist is longer than one brief may cover. */
  truncated: boolean;
}) {
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
          message: body?.error ?? "The brief could not be produced.",
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
        message: "Could not reach the server. Check your connection.",
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
                : "border-accent/30 text-accent/80 hover:border-accent hover:text-accent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {state.status === "idle" ? (
          <p className="text-sm text-muted">
            Pick a session. Readers watching the same instruments share one
            brief, so asking twice costs nothing.
          </p>
        ) : null}

        {/* Always names the instruments. The brief text says "the supplied
            watchlist", which reads as the reader's own — for a Free reader it
            is not, and somebody seeing a pair discussed that they do not trade
            deserves to know why before they read a word of it. */}
        {coverage.instruments.length > 0 ? (
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
            {coverage.personalised ? (
              <>
                Covers {coverage.truncated ? "the top of your watchlist" : "your watchlist"}{" "}
                — {coverage.instruments.join(", ")}.{" "}
                {coverage.truncated
                  ? `One brief reports on at most ${coverage.instruments.length} instruments; reorder the watchlist to change which. `
                  : ""}
                Readers watching the same instruments share one brief per
                session, which is what keeps it affordable.
              </>
            ) : (
              <>
                Covers {coverage.instruments.join(", ")} — the same brief every
                free account reads.{" "}
                <Link href="/dashboard/pricing" className="text-accent hover:underline">
                  Pro writes it from your own watchlist
                </Link>
                .
              </>
            )}
          </p>
        ) : null}

        {state.status === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
            Collecting the calendar, levels and headlines, then writing.
          </p>
        ) : null}

        {state.status === "generating" ? (
          <p className="text-sm text-muted">
            Somebody else asked first and it is being written now. Try again in
            about {state.retryAfterSeconds} seconds.
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
                See the plans
              </Link>
            ) : null}
          </div>
        ) : null}

        {state.status === "ready" ? (
          <div className="space-y-4">
            <div>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  TONE[state.brief.riskTone.tone].className
                }`}
              >
                {TONE[state.brief.riskTone.tone].label}
              </span>
              <p className="mt-2 text-sm leading-relaxed">
                {state.brief.riskTone.reason}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Key market driver
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {state.brief.keyMarketDriver}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Volatility warning
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {state.brief.watchlistVolatilityWarning}
              </p>
            </div>

            {state.degraded ? (
              <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                Some market data was stale or missing when this was written.
                Gaps are named rather than filled in.
              </p>
            ) : null}

            <p className="text-[11px] text-muted">
              {state.cached
                ? "Served from today's brief for these instruments."
                : "Written just now."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
