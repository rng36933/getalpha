/** One closed trade's result and the moment it landed. */
export type PnlPoint = { at: string; pnl: number };

export type DayPnl = { pnl: number; trades: number };

type DateParts = { year: number; month: number; day: number };

/** The reader's own calendar day. The browser default: a trade closed at 23:50 is that evening's. */
export function localParts(date: Date): DateParts {
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
}

/** UTC days, for tests that must not depend on the machine's timezone. */
export function utcParts(date: Date): DateParts {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

/** `month` is zero-based, as in `Date`. */
export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Sums closed-trade results into calendar days.
 *
 * Keyed by day only, so the caller can look up any month from one pass over
 * the trades rather than re-filtering them every time the month changes.
 */
export function bucketByDay(
  points: PnlPoint[],
  parts: (date: Date) => DateParts = localParts,
): Map<string, DayPnl> {
  const days = new Map<string, DayPnl>();

  for (const point of points) {
    const date = new Date(point.at);
    if (Number.isNaN(date.getTime())) continue;

    const { year, month, day } = parts(date);
    const key = dayKey(year, month, day);
    const existing = days.get(key) ?? { pnl: 0, trades: 0 };

    days.set(key, { pnl: existing.pnl + point.pnl, trades: existing.trades + 1 });
  }

  return days;
}

export type PeriodTotals = { today: DayPnl; week: DayPnl; month: DayPnl };

function sumDays(days: Map<string, DayPnl>, dates: Date[]): DayPnl {
  const total: DayPnl = { pnl: 0, trades: 0 };

  for (const date of dates) {
    const day = days.get(dayKey(date.getFullYear(), date.getMonth(), date.getDate()));
    if (!day) continue;
    total.pnl += day.pnl;
    total.trades += day.trades;
  }

  return total;
}

/**
 * What today, this week and this month have made so far.
 *
 * The week runs Monday to Sunday, matching the calendar grid, and "today" is
 * `now`'s own calendar day — all three read from the same per-day buckets, so
 * they cannot disagree with the cells shown below them.
 */
export function periodTotals(days: Map<string, DayPnl>, now: Date): PeriodTotals {
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const sinceMonday = (now.getDay() + 6) % 7;
  const week = Array.from({ length: 7 }, (_, i) => new Date(year, month, date - sinceMonday + i));

  const monthLength = new Date(year, month + 1, 0).getDate();
  const wholeMonth = Array.from({ length: monthLength }, (_, i) => new Date(year, month, i + 1));

  return {
    today: sumDays(days, [new Date(year, month, date)]),
    week: sumDays(days, week),
    month: sumDays(days, wholeMonth),
  };
}

/**
 * The month as weeks of seven cells, Monday first, `null` for the padding
 * before the 1st and after the last day.
 */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const length = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return weeks;
}
