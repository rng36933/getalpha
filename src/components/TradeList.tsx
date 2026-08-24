"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import CoachReviewPanel from "@/components/CoachReviewPanel";
import type { TradeMetrics } from "@/lib/ai/trade-metrics";
import type { CoachReview } from "@/lib/ai/types";
import { formatSignedMoney } from "@/lib/format/money";

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
  // No stop and no target were ever recorded for this trade — most often
  // because it closed within the same sync window it was opened and
  // modified in, before the terminal had a chance to report the stop it
  // was given (see MT5 sync.ts). A closed trade with neither price never
  // hit anything automatically, so this is the honest guess, not "—".
  UNKNOWN: "Possible manual exit",
};

function formatResult(value: number | null, currency: string | null): string {
  if (value === null) return "—";
  return formatSignedMoney(value, currency);
}

function toneFor(value: number | null): string {
  if (value === null) return "text-muted";
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted";
}

type Outcome = "ALL" | "WINS" | "LOSSES" | "OPEN";

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WINS", label: "Wins" },
  { value: "LOSSES", label: "Losses" },
  { value: "OPEN", label: "Open" },
];

type SortKey = "DATE_DESC" | "DATE_ASC" | "RESULT_DESC" | "RESULT_ASC" | "RISK_DESC";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "DATE_DESC", label: "Newest first" },
  { value: "DATE_ASC", label: "Oldest first" },
  { value: "RESULT_DESC", label: "Biggest win first" },
  { value: "RESULT_ASC", label: "Biggest loss first" },
  { value: "RISK_DESC", label: "Highest risk first" },
];

/**
 * Ordered without mutating the array the caller handed in — `sort` is
 * in-place, and `rows` here is a `.filter()` result that only happens to be a
 * fresh array today.
 */
function sortRows(rows: TradeRow[], key: SortKey): TradeRow[] {
  const sorted = [...rows];

  switch (key) {
    case "DATE_ASC":
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "RESULT_DESC":
      return sorted.sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
    case "RESULT_ASC":
      return sorted.sort((a, b) => (a.pnl ?? 0) - (b.pnl ?? 0));
    case "RISK_DESC":
      // No stop means undefined risk, not zero — sorted to the back rather
      // than read as the safest trades in the list.
      return sorted.sort(
        (a, b) => (b.metrics.riskPercent ?? -1) - (a.metrics.riskPercent ?? -1),
      );
    case "DATE_DESC":
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/** Rows per page. Short enough to read without scrolling past the filters. */
const PER_PAGE = 10;

const pagerClass =
  "rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted";

/**
 * Which page numbers to show, with gaps.
 *
 * First, last, and the pages either side of where you are. Nine pages of
 * journal is nine buttons, which is fine; a year of trading is forty, which is
 * a wall. The ends are always offered because "back to the start" and "the
 * oldest trade I have" are the two jumps people actually make.
 */
function pageWindow(page: number, count: number): (number | "gap")[] {
  if (count <= 7) {
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  const pages = new Set([1, count, page, page - 1, page + 1]);
  const kept = [...pages].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);

  const out: (number | "gap")[] = [];
  let previous = 0;

  for (const n of kept) {
    if (previous && n - previous > 1) out.push("gap");
    out.push(n);
    previous = n;
  }

  return out;
}

const selectClass =
  "rounded-lg border border-line bg-surface-raised px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent";

type ReviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; review: CoachReview }
  | { status: "error"; message: string; upgrade?: boolean };

/**
 * The realised result as a bar as well as a number.
 *
 * Read from the centre and scaled against the biggest result on the page, so a
 * small loss and a large win stop looking alike at a glance. Every row still
 * carries its own figure, which is what keeps the bar honest for anyone who
 * cannot separate the two hues.
 */
function ResultBar({ value, scale }: { value: number | null; scale: number }) {
  if (value === null || scale <= 0) return null;

  const width = (Math.abs(value) / scale) * 50;

  return (
    <span
      aria-hidden="true"
      className="relative hidden h-1.5 w-16 shrink-0 sm:block"
    >
      <span className="absolute left-1/2 top-0 h-full w-px bg-line" />
      <span
        className={`absolute top-0 h-full rounded-sm ${
          value > 0 ? "bg-positive/70" : "bg-negative/70"
        }`}
        style={
          value > 0
            ? { left: "50%", width: `${width}%` }
            : { right: "50%", width: `${width}%` }
        }
      />
    </span>
  );
}

/**
 * A `<th>` that sorts the table when clicked, in addition to the "Sort by"
 * dropdown that already controls the same state — the dropdown covers every
 * order including ones with no column of their own (biggest risk first has
 * no ascending column to click), the header click is the fast path for the
 * two orders that do.
 */
function SortableHeader({
  label,
  align = "left",
  ascKey,
  descKey,
  sortKey,
  onSort,
}: {
  label: string;
  align?: "left" | "right";
  /** Null when this column has no ascending order to toggle into. */
  ascKey: SortKey | null;
  descKey: SortKey;
  sortKey: SortKey;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === ascKey || sortKey === descKey;
  const ascending = sortKey === ascKey;

  function toggle() {
    if (sortKey === descKey && ascKey) onSort(ascKey);
    else onSort(descKey);
  }

  return (
    <th className={`py-2 pr-3 font-normal ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
          active ? "text-foreground" : ""
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          className={`size-3 shrink-0 transition-opacity ${active ? "opacity-100" : "opacity-30"} ${
            ascending ? "rotate-180" : ""
          }`}
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>
    </th>
  );
}

export default function TradeList({
  trades,
  currency,
}: {
  trades: TradeRow[];
  currency: string | null;
}) {
  // Anchors the scroll when the page changes; the pager sits below the table.
  const topRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});

  // Filtering is client-side on purpose. The page already has every row it is
  // going to show, so a round trip per filter would spend a request to hide
  // rows the browser is holding.
  const [outcome, setOutcome] = useState<Outcome>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("DATE_DESC");

  const rows = sortRows(
    trades.filter((row) => {
      if (outcome === "WINS" && !((row.pnl ?? 0) > 0)) return false;
      if (outcome === "LOSSES" && !((row.pnl ?? 0) < 0)) return false;
      if (
        outcome === "OPEN" &&
        row.metrics.exitClassification !== "STILL_OPEN"
      ) {
        return false;
      }
      return true;
    }),
    sortKey,
  );

  const filtered = rows.length !== trades.length;

  /**
   * Which page of the filtered rows is on screen.
   *
   * Paged after filtering, not in the query. Paging in the database would make
   * every filter mean "among these twenty-five" — a "Wins" count that changes
   * as you turn pages is worse than no filter at all.
   *
   * The page number is stored with the filters it belongs to, so narrowing the
   * list while on page 6 lands you on page 1 of the new result instead of on an
   * empty page. Derived rather than reset in an effect, which is the cascading
   * render the React compiler rejects.
   */
  const filterKey = `${outcome}|${sortKey}`;
  const [paging, setPaging] = useState({ key: filterKey, page: 1 });

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(
    paging.key === filterKey ? paging.page : 1,
    pageCount,
  );

  const start = (page - 1) * PER_PAGE;
  const visible = rows.slice(start, start + PER_PAGE);

  function goToPage(next: number) {
    setPaging({ key: filterKey, page: Math.min(Math.max(next, 1), pageCount) });

    // Back to the top of the list, because the pager is at the bottom: without
    // this you press Next and stay looking at the end of the page you just
    // asked to leave, which reads as though nothing happened.
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // One scale for every bar in the whole filtered set, not just this page:
  // scaled per page, the same trade would draw a different length depending on
  // which page it landed on.
  const resultScale = Math.max(
    ...rows.map((row) => Math.abs(row.pnl ?? 0)),
    0,
  );

  function stateOf(id: string): ReviewState {
    return reviews[id] ?? { status: "idle" };
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

  // The whole journal, not the filtered view. "No trades yet" is a different
  // statement from "nothing matches those filters", and showing the first when
  // the second is true tells somebody their records are gone.
  if (trades.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No trades yet. Connect MetaTrader from the dashboard and ninety days of
        history arrives on the first sync.
      </p>
    );
  }

  return (
    // `scroll-mt-20` clears the sticky top bar on a phone, so scrolling here
    // does not park the filters underneath it.
    <div ref={topRef} className="scroll-mt-20">
      {/* Filters in one row above the table, as a toolbar rather than scattered
          controls. Only offered when there is more than one thing to choose
          between — a select with a single option is furniture. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Filter by outcome"
          className="flex flex-wrap gap-1"
        >
          {OUTCOMES.map((option) => {
            const active = outcome === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setOutcome(option.value)}
                aria-pressed={active}
                className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
          aria-label="Sort by"
          className={selectClass}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {filtered ? (
          <span className="text-xs text-muted">
            {rows.length} of {trades.length}
          </span>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No trades match those filters.{" "}
          <button
            type="button"
            onClick={() => setOutcome("ALL")}
            className="text-accent hover:underline"
          >
            Clear them
          </button>
          .
        </p>
      ) : null}

      <div className={`overflow-x-auto ${rows.length === 0 ? "hidden" : ""}`}>
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
            <SortableHeader
              label="Date"
              ascKey="DATE_ASC"
              descKey="DATE_DESC"
              sortKey={sortKey}
              onSort={setSortKey}
            />
            <th className="py-2 pr-3 text-left font-normal">Instrument</th>
            <th className="py-2 pr-3 text-left font-normal">Side</th>
            <SortableHeader
              label="Risk"
              align="right"
              ascKey={null}
              descKey="RISK_DESC"
              sortKey={sortKey}
              onSort={setSortKey}
            />
            <th className="py-2 pr-3 text-right font-normal">Planned RR</th>
            <th className="py-2 pr-3 text-left font-normal">Exit</th>
            <SortableHeader
              label="Result"
              align="right"
              ascKey="RESULT_ASC"
              descKey="RESULT_DESC"
              sortKey={sortKey}
              onSort={setSortKey}
            />
            <th className="py-2 text-right font-normal">Review</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {visible.map((trade) => {
            const state = stateOf(trade.id);
            const open = openId === trade.id;

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
                        title="Synced from MetaTrader."
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
                  <td className="py-3 pr-3">
                    <span className="flex items-center justify-end gap-2.5">
                      <ResultBar value={trade.pnl} scale={resultScale} />
                      <span
                        className={`w-20 text-right font-mono tabular-nums ${toneFor(
                          trade.pnl,
                        )}`}
                      >
                        {formatResult(trade.pnl, currency)}
                      </span>
                    </span>
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

                {open ? (
                  <tr>
                    <td colSpan={9} className="pb-6">
                      <div className="rounded-lg border border-line bg-surface-raised p-4">
                        {state.status === "loading" ? (
                          <p className="flex items-center gap-2 text-sm text-muted">
                            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
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

      {/* The pager says where you are in the record, not just how to move.
          "301–325 of 220 trades" is the sentence somebody actually wants when
          they are looking for a trade from three weeks ago. Hidden when it
          would be a control with one destination. */}
      {pageCount > 1 ? (
        <nav
          aria-label="Journal pages"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"
        >
          <span className="text-xs tabular-nums text-muted">
            {start + 1}–{Math.min(start + PER_PAGE, rows.length)} of{" "}
            {rows.length}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className={pagerClass}
            >
              Previous
            </button>

            {pageWindow(page, pageCount).map((entry, index) =>
              entry === "gap" ? (
                <span
                  key={`gap-${index}`}
                  aria-hidden="true"
                  className="px-0.5 text-xs text-muted"
                >
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  onClick={() => goToPage(entry)}
                  aria-current={entry === page ? "page" : undefined}
                  aria-label={`Page ${entry}`}
                  className={`rounded-lg border px-2.5 py-1.5 font-mono text-xs tabular-nums transition-colors ${
                    entry === page
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line text-muted hover:text-foreground"
                  }`}
                >
                  {entry}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page === pageCount}
              className={pagerClass}
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
