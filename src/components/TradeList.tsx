"use client";

import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import CoachReviewPanel from "@/components/CoachReviewPanel";
import LocalTime from "@/components/LocalTime";
import TradeNotes, { type Notes } from "@/components/TradeNotes";
import type { CoachBudgetStatus } from "@/lib/ai/budget";
import { journalCopy } from "@/lib/i18n/app/journal";
import type { Locale } from "@/lib/i18n/locales";
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

type Outcome = "ALL" | "WINS" | "LOSSES" | "OPEN" | "NO_STOP";

/** Rows per page. Short enough to read without scrolling past the filters. */
const PER_PAGE = 25;

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

export default function TradeList({
  trades,
  currency,
  coachBudget,
  locale,
}: {
  trades: TradeRow[];
  currency: string | null;
  /** Null for a Free account, or if the count could not be read. */
  coachBudget: CoachBudgetStatus | null;
  locale: Locale;
}) {
  const copy = journalCopy(locale);

  const EXIT_LABEL: Record<TradeMetrics["exitClassification"], string> = {
    HIT_TARGET: copy.table.exitLabels.target,
    HIT_STOP: copy.table.exitLabels.stop,
    DISCRETIONARY_EXIT: copy.table.exitLabels.discretionary,
    BEYOND_TARGET: copy.table.exitLabels.pastTarget,
    BEYOND_STOP: copy.table.exitLabels.pastStop,
    STILL_OPEN: copy.table.exitLabels.openTrade,
    UNKNOWN: copy.table.exitLabels.unknown,
  };

  const OUTCOMES: { value: Outcome; label: string }[] = [
    { value: "ALL", label: copy.filters.all },
    { value: "WINS", label: copy.filters.wins },
    { value: "LOSSES", label: copy.filters.losses },
    { value: "OPEN", label: copy.filters.open },
    // Not a result but the thing most worth being able to isolate: a trade
    // taken with no stop has no defined risk, so nothing here can say whether
    // its size was sensible — only what it happened to make or lose.
    { value: "NO_STOP", label: copy.filters.noStop },
  ];

  // Anchors the scroll when the page changes; the pager sits below the table.
  const topRef = useRef<HTMLDivElement>(null);
  // Seeded from the server, then decremented locally on each completed
  // review. A full round trip to re-read the count after every review would
  // be a second request purely to display a number the client already knows
  // the answer to, since it just watched the request that spent it succeed.
  const [reviewsLeft, setReviewsLeft] = useState(coachBudget?.reviewsRemaining ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  // Notes saved in this session, layered over the server's rows rather than
  // replacing them. Copying `trades` into state instead would freeze the table
  // at whatever the first render held, and a newly logged trade would not
  // appear when the page refreshes itself.
  const [edits, setEdits] = useState<Record<string, Notes>>({});

  // Filtering is client-side on purpose. The page already has every row it is
  // going to show, so a round trip per filter would spend a request to hide
  // rows the browser is holding.
  const [asset, setAsset] = useState("ALL");
  const [setup, setSetup] = useState("ALL");
  const [outcome, setOutcome] = useState<Outcome>("ALL");

  const withEdits = trades.map((trade) =>
    edits[trade.id] ? { ...trade, ...edits[trade.id] } : trade,
  );

  // Filter options come from what is actually in the journal, so nobody is
  // offered a pair or a setup that would return nothing.
  const assets = [...new Set(withEdits.map((row) => row.asset))].sort();
  const setups = [
    ...new Set(
      withEdits
        .map((row) => row.setup)
        .filter((setup): setup is string => setup !== null && setup !== ""),
    ),
  ].sort();

  const rows = withEdits.filter((row) => {
    if (asset !== "ALL" && row.asset !== asset) return false;
    if (setup !== "ALL" && row.setup !== setup) return false;
    if (outcome === "WINS" && !((row.pnl ?? 0) > 0)) return false;
    if (outcome === "LOSSES" && !((row.pnl ?? 0) < 0)) return false;
    if (outcome === "OPEN" && row.metrics.exitClassification !== "STILL_OPEN") {
      return false;
    }
    if (outcome === "NO_STOP" && row.metrics.flags.stopWasSet) return false;
    return true;
  });

  const filtered = rows.length !== withEdits.length;

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
  const filterKey = `${asset}|${setup}|${outcome}`;
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
        // A 402 from the daily allowance means zero are left, whatever the
        // count on screen currently says — the count is an estimate seeded at
        // page load, and this response is the ground truth overtaking it.
        if (response.status === 402) setReviewsLeft(0);

        setReviews((current) => ({
          ...current,
          [id]: {
            status: "error",
            message: body?.error ?? copy.table.genericError,
            // 403 with this reason is the only failure the user can fix by
            // buying something. Everything else is ours to fix.
            upgrade: body?.reason === "SUBSCRIPTION_REQUIRED",
          },
        }));
        return;
      }

      // Decremented on a real, completed review — not merely attempted, so a
      // request that failed above never reaches this line.
      setReviewsLeft((current) =>
        current === null ? null : Math.max(0, current - 1),
      );

      setReviews((current) => ({
        ...current,
        [id]: { status: "ready", review: body.review as CoachReview },
      }));
    } catch {
      setReviews((current) => ({
        ...current,
        [id]: {
          status: "error",
          message: copy.table.couldNotReach,
        },
      }));
    }
  }

  // The whole journal, not the filtered view. "No trades yet" is a different
  // statement from "nothing matches those filters", and showing the first when
  // the second is true tells somebody their records are gone.
  if (withEdits.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        {copy.noTradesYet}
      </p>
    );
  }

  return (
    // `scroll-mt-20` clears the sticky top bar on a phone, so scrolling here
    // does not park the filters underneath it.
    <div ref={topRef} className="scroll-mt-20">
      {/* Reviews remaining today. Placed above the filters so it is the first
          thing read on this card, not something noticed only after pressing
          Review and hitting a refusal. Absent entirely for a Free account —
          see `loadCoachBudget` in the journal page — because a count for a
          feature that account cannot use at all would just advertise a
          paywall, not inform anyone. */}
      {coachBudget && reviewsLeft !== null ? (
        <p className="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
          {reviewsLeft > 0 ? (
            <>
              <span className="font-medium text-accent">{reviewsLeft}</span>
              <span>{copy.reviewsBanner.ofEstimate(coachBudget.estimatedDailyReviews)}</span>
            </>
          ) : (
            <span className="text-warning">{copy.reviewsBanner.none}</span>
          )}
          <span aria-hidden="true">·</span>
          <span>
            {copy.reviewsBanner.resets}{" "}
            <LocalTime
              at={coachBudget.resetsAt}
              utc={coachBudget.resetsAt.slice(11, 16)}
            />
          </span>
        </p>
      ) : null}

      {/* Filters in one row above the table, as a toolbar rather than scattered
          controls. Only offered when there is more than one thing to choose
          between — a select with a single option is furniture. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label={copy.filters.outcomeAria}
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

        {assets.length > 1 ? (
          <select
            value={asset}
            onChange={(event) => setAsset(event.target.value)}
            aria-label={copy.filters.instrumentAria}
            className={selectClass}
          >
            <option value="ALL">{copy.filters.everyInstrument}</option>
            {assets.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}

        {setups.length > 1 ? (
          <select
            value={setup}
            onChange={(event) => setSetup(event.target.value)}
            aria-label={copy.filters.setupAria}
            className={selectClass}
          >
            <option value="ALL">{copy.filters.everySetup}</option>
            {setups.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}

        {filtered ? (
          <span className="text-xs text-muted">
            {copy.filters.filteredCount(rows.length, withEdits.length)}
          </span>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {copy.filters.noMatches}{" "}
          <button
            type="button"
            onClick={() => {
              setAsset("ALL");
              setSetup("ALL");
              setOutcome("ALL");
            }}
            className="text-accent hover:underline"
          >
            {copy.filters.clear}
          </button>
          .
        </p>
      ) : null}

      <div className={`overflow-x-auto ${rows.length === 0 ? "hidden" : ""}`}>
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
            <th className="py-2 pr-3 text-left font-normal">{copy.table.date}</th>
            <th className="py-2 pr-3 text-left font-normal">{copy.table.instrument}</th>
            <th className="py-2 pr-3 text-left font-normal">{copy.table.side}</th>
            <th className="py-2 pr-3 text-left font-normal">{copy.table.setup}</th>
            <th className="py-2 pr-3 text-right font-normal">{copy.table.risk}</th>
            <th className="py-2 pr-3 text-right font-normal">{copy.table.plannedRR}</th>
            <th className="py-2 pr-3 text-left font-normal">{copy.table.exit}</th>
            <th className="py-2 pr-3 text-right font-normal">{copy.table.result}</th>
            <th className="py-2 pr-3 text-right font-normal">{copy.table.notes}</th>
            <th className="py-2 text-right font-normal">{copy.table.review}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {visible.map((trade) => {
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
                        title={copy.table.mt5Title}
                        className="ml-2 rounded border border-line px-1 py-0.5 align-middle text-[10px] font-normal tracking-wide text-muted"
                      >
                        {copy.table.mt5Badge}
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
                      {trade.direction === "BUY" ? copy.table.buy : copy.table.sell}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-muted">{trade.setup ?? "—"}</td>
                  <td className="py-3 pr-3 text-right font-mono text-xs">
                    {trade.metrics.riskPercent === null ? (
                      // Not a missing value to shrug at: no stop means no
                      // defined risk, and the review says so too.
                      <span className="text-warning">{copy.table.noStop}</span>
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
                      {editing
                        ? copy.table.close
                        : hasNotes
                          ? copy.table.editNotes
                          : copy.table.addNotes}
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
                        ? copy.table.reviewing
                        : state.status === "ready"
                          ? open
                            ? copy.table.hide
                            : copy.table.show
                          : copy.table.review}
                    </button>
                  </td>
                </tr>

                {editing ? (
                  <tr>
                    <td colSpan={10} className="pb-6">
                      <div className="rounded-lg border border-line bg-surface-raised p-4">
                        {trade.source === "MT5" ? (
                          <p className="mb-3 text-xs text-muted">
                            {copy.table.mt5NotesHint}
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
                          locale={locale}
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
                            {copy.table.reviewLoading}
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
                                {copy.table.seePlans}
                              </Link>
                            ) : null}
                          </div>
                        ) : null}

                        {state.status === "ready" ? (
                          <CoachReviewPanel review={state.review} locale={locale} />
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
          aria-label={copy.pager.ariaLabel}
          className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"
        >
          <span className="text-xs tabular-nums text-muted">
            {copy.pager.range(
              start + 1,
              Math.min(start + PER_PAGE, rows.length),
              rows.length,
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className={pagerClass}
            >
              {copy.pager.previous}
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
                  aria-label={copy.pager.pageAria(entry)}
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
              {copy.pager.next}
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
