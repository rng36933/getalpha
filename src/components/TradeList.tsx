"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import CoachReviewPanel from "@/components/CoachReviewPanel";
import TradeNotes, { type Notes } from "@/components/TradeNotes";
import type { TradeMetrics } from "@/lib/ai/trade-metrics";
import type { CoachReview } from "@/lib/ai/types";

export type TradeRow = {
  id: string;
  asset: string;
  direction: "BUY" | "SELL";
  setup: string | null;
  timeframe: string | null;
  entryPrice: number;
  exitPrice: number | null;
  pnl: number | null;
  createdAt: string;
  /** MT5 rows are owned by the terminal; only their notes can be edited. */
  source: "MANUAL" | "MT5";
  marketContext: string | null;
  emotionalState: string | null;
  metrics: TradeMetrics;
};

const EXIT_LABEL: Record<TradeMetrics["exitClassification"], string> = {
  HIT_TARGET: "Target",
  HIT_STOP: "Stop",
  DISCRETIONARY_EXIT: "Discretionary",
  BEYOND_TARGET: "Past target",
  BEYOND_STOP: "Past stop",
  STILL_OPEN: "Open",
  UNKNOWN: "—",
};

/** Two decimals and a sign, because "+1.80R" reads faster than "1.8". */
function formatR(value: number | null): string {
  if (value === null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}R`;
}

function toneFor(value: number | null): string {
  if (value === null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

type ReviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; review: CoachReview }
  | { status: "error"; message: string; upgrade?: boolean };

export default function TradeList({ trades }: { trades: TradeRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  // Notes saved in this session, layered over the server's rows rather than
  // replacing them. Copying `trades` into state instead would freeze the table
  // at whatever the first render held, and a newly logged trade would not
  // appear when the page refreshes itself.
  const [edits, setEdits] = useState<Record<string, Notes>>({});

  const rows = trades.map((trade) =>
    edits[trade.id] ? { ...trade, ...edits[trade.id] } : trade,
  );

  function stateOf(id: string): ReviewState {
    return reviews[id] ?? { status: "idle" };
  }

  function applyNotes(id: string, notes: Notes) {
    setEdits((current) => ({ ...current, [id]: notes }));

    // The review the user is looking at was written without these notes. Drop
    // it rather than leave a verdict on screen that says the context is
    // missing while the context sits filled in above it.
    setReviews((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
    if (openId === id) setOpenId(null);
  }

  async function review(id: string) {
    // Already fetched: reopening must not pay for a second call.
    if (stateOf(id).status === "ready") {
      setOpenId(openId === id ? null : id);
      return;
    }

    setOpenId(id);
    setReviews((current) => ({ ...current, [id]: { status: "loading" } }));

    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tradeId: id }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setReviews((current) => ({
          ...current,
          [id]: {
            status: "error",
            message:
              body?.error ?? "The review could not be produced. Try again.",
            // 403 with this reason is the only failure the user can fix by
            // buying something. Everything else is ours to fix.
            upgrade: body?.reason === "SUBSCRIPTION_REQUIRED",
          },
        }));
        return;
      }

      setReviews((current) => ({
        ...current,
        [id]: { status: "ready", review: body.review as CoachReview },
      }));
    } catch {
      setReviews((current) => ({
        ...current,
        [id]: {
          status: "error",
          message: "Could not reach the server. Check your connection.",
        },
      }));
    }
  }

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No trades yet. Log one above and the R-multiple appears here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
            <th className="py-2 pr-3 text-left font-normal">Date</th>
            <th className="py-2 pr-3 text-left font-normal">Instrument</th>
            <th className="py-2 pr-3 text-left font-normal">Side</th>
            <th className="py-2 pr-3 text-left font-normal">Setup</th>
            <th className="py-2 pr-3 text-right font-normal">Risk</th>
            <th className="py-2 pr-3 text-right font-normal">Planned RR</th>
            <th className="py-2 pr-3 text-left font-normal">Exit</th>
            <th className="py-2 pr-3 text-right font-normal">Result</th>
            <th className="py-2 pr-3 text-right font-normal">Notes</th>
            <th className="py-2 text-right font-normal">Review</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {rows.map((trade) => {
            const state = stateOf(trade.id);
            const open = openId === trade.id;
            const editing = notesId === trade.id;
            const hasNotes =
              trade.marketContext !== null || trade.emotionalState !== null;

            return (
              // The key belongs on the fragment, not on the rows inside it: a
              // trade renders as two sibling rows and React keys whatever the
              // map returns.
              <Fragment key={trade.id}>
                <tr>
                  <td className="py-3 pr-3 font-mono text-xs text-muted">
                    {trade.createdAt.slice(0, 10)}
                  </td>
                  <td className="py-3 pr-3 font-medium">
                    {trade.asset}
                    {trade.source === "MT5" ? (
                      <span
                        title="Synced from MetaTrader. The prices belong to the terminal; the notes are yours."
                        className="ml-2 rounded border border-line px-1 py-0.5 align-middle text-[10px] font-normal tracking-wide text-muted"
                      >
                        MT5
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={
                        trade.direction === "BUY"
                          ? "text-positive"
                          : "text-negative"
                      }
                    >
                      {trade.direction === "BUY" ? "Buy" : "Sell"}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-muted">{trade.setup ?? "—"}</td>
                  <td className="py-3 pr-3 text-right font-mono text-xs">
                    {trade.metrics.riskPercent === null ? (
                      // Not a missing value to shrug at: no stop means no
                      // defined risk, and the review says so too.
                      <span className="text-warning">no stop</span>
                    ) : (
                      <span
                        className={
                          trade.metrics.flags.riskAboveTwoPercent
                            ? "text-warning"
                            : "text-muted"
                        }
                      >
                        {trade.metrics.riskPercent.toFixed(2)}%
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-xs text-muted">
                    {trade.metrics.plannedRR === null
                      ? "—"
                      : trade.metrics.plannedRR.toFixed(2)}
                  </td>
                  <td className="py-3 pr-3 text-xs text-muted">
                    {EXIT_LABEL[trade.metrics.exitClassification]}
                  </td>
                  <td
                    className={`py-3 pr-3 text-right font-mono ${toneFor(
                      trade.metrics.realizedR,
                    )}`}
                  >
                    {formatR(trade.metrics.realizedR)}
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setNotesId(editing ? null : trade.id)
                      }
                      aria-expanded={editing}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors hover:border-accent hover:text-accent ${
                        hasNotes
                          ? "border-line text-foreground"
                          : "border-line text-muted"
                      }`}
                    >
                      {editing ? "Close" : hasNotes ? "Notes" : "Add notes"}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => review(trade.id)}
                      disabled={state.status === "loading"}
                      aria-expanded={open}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {state.status === "loading"
                        ? "Reviewing…"
                        : state.status === "ready"
                          ? open
                            ? "Hide"
                            : "Show"
                          : "Review"}
                    </button>
                  </td>
                </tr>

                {editing ? (
                  <tr>
                    <td colSpan={10} className="pb-6">
                      <div className="rounded-lg border border-line bg-surface-raised p-4">
                        {trade.source === "MT5" ? (
                          <p className="mb-3 text-xs text-muted">
                            MetaTrader sends the prices and can never send the
                            reason. What you write here is the half the review
                            cannot compute.
                          </p>
                        ) : null}

                        <TradeNotes
                          tradeId={trade.id}
                          notes={{
                            setup: trade.setup,
                            timeframe: trade.timeframe,
                            marketContext: trade.marketContext,
                            emotionalState: trade.emotionalState,
                          }}
                          onSaved={(notes) => applyNotes(trade.id, notes)}
                        />
                      </div>
                    </td>
                  </tr>
                ) : null}

                {open ? (
                  <tr>
                    <td colSpan={10} className="pb-6">
                      <div className="rounded-lg border border-line bg-surface-raised p-4">
                        {state.status === "loading" ? (
                          <p className="text-sm text-muted">
                            Reading the trade against your history. This takes
                            about half a minute.
                          </p>
                        ) : null}

                        {state.status === "error" ? (
                          <div>
                            <p className="text-sm text-negative">
                              {state.message}
                            </p>
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
                          <CoachReviewPanel review={state.review} />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
