import type { CalendarInput } from "@/lib/ai/types";

/** One OHLC bar, in the shape `lightweight-charts` expects. */
export type Candle = {
  /**
   * `YYYY-MM-DD` for daily and weekly bars, or seconds since the epoch for
   * intraday ones.
   *
   * Both are valid to the chart library, and intraday has to be a timestamp:
   * a date string would collapse every bar in a day onto the same point and
   * the chart would draw one candle where there should be ninety-six.
   */
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ImpactLevel = "HIGH" | "MEDIUM" | "LOW";

export type EconomicEvent = {
  id: string;
  /** HH:MM in UTC. Rendered until the browser can convert it. */
  time: string;
  /** The full moment, so the browser can show it in the reader's own zone. */
  at: string | null;
  currency: string;
  title: string;
  impact: ImpactLevel;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
};

/**
 * Adds the React key the calendar list needs.
 *
 * Built from the fields rather than an index, so a row keeps its identity when
 * the feed refreshes and events shift position.
 */
export function toEconomicEvents(events: CalendarInput[]): EconomicEvent[] {
  return events.map((event, index) => ({
    id: `${event.time}-${event.currency}-${slug(event.title)}-${index}`,
    time: event.time,
    at: event.at ?? null,
    currency: event.currency,
    title: event.title,
    impact: event.impact,
    actual: event.actual,
    forecast: event.forecast,
    previous: event.previous,
  }));
}

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
