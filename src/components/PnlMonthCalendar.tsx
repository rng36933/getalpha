"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCompactMoney, formatSignedMoney } from "@/lib/format/money";
import {
  type PnlPoint,
  bucketByDay,
  dayKey,
  monthGrid,
} from "@/lib/journal/month-pnl";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const navClass =
  "rounded-lg border border-line p-1.5 text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted";

/**
 * A month of closed trades, one cell per day, each showing what that day made
 * or lost.
 *
 * Bucketed in the browser so a trade that closed at 23:50 lands on the
 * reader's own evening, not on a UTC day that is already tomorrow for them.
 */
export default function PnlMonthCalendar({
  points,
  currency,
}: {
  points: PnlPoint[];
  currency: string | null;
}) {
  const days = useMemo(() => bucketByDay(points), [points]);

  const [shown, setShown] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const today = new Date();
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());

  const weeks = monthGrid(shown.year, shown.month);
  const label = new Date(shown.year, shown.month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  function move(delta: number) {
    setShown((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  const isCurrentMonth =
    shown.year === today.getFullYear() && shown.month === today.getMonth();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" onClick={() => move(-1)} aria-label="Previous month" className={navClass}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <p className="text-sm font-medium" aria-live="polite">
          {label}
        </p>

        <button
          type="button"
          onClick={() => move(1)}
          disabled={isCurrentMonth}
          aria-label="Next month"
          className={navClass}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="pb-1 text-[10px] font-medium uppercase tracking-wider text-muted"
          >
            {weekday}
          </span>
        ))}

        {weeks.flat().map((day, index) => {
          if (day === null) return <span key={`pad-${index}`} />;

          const key = dayKey(shown.year, shown.month, day);
          const result = days.get(key);
          const tone =
            !result || result.pnl === 0
              ? "border-line text-muted"
              : result.pnl > 0
                ? "border-positive/30 bg-positive/10 text-positive"
                : "border-negative/30 bg-negative/10 text-negative";

          return (
            <div
              key={key}
              title={
                result
                  ? `${key}: ${formatSignedMoney(result.pnl, currency)} from ${result.trades} ${
                      result.trades === 1 ? "trade" : "trades"
                    }`
                  : key
              }
              className={`flex aspect-square min-w-0 flex-col items-center justify-between rounded-md border px-0.5 py-1 ${tone} ${
                key === todayKey ? "ring-1 ring-accent" : ""
              }`}
            >
              <span className="self-start pl-0.5 text-[9px] leading-none text-muted">
                {day}
              </span>
              <span className="font-mono text-[10px] font-medium leading-none tabular-nums">
                {result ? (result.pnl === 0 ? "0" : formatCompactMoney(result.pnl, null)) : ""}
              </span>
            </div>
          );
        })}
      </div>

      {points.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          Closed trades appear here on the day they closed.
        </p>
      ) : null}
    </div>
  );
}
