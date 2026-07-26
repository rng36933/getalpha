import type { CalendarInput } from "@/lib/ai/types";
import { recallSnapshot, rememberSnapshot } from "./store";
import {
  describeError,
  fetchWithTimeout,
  type SourceResult,
} from "./types";

/**
 * The weekly calendar feed behind ForexFactory. No API key, no quota.
 *
 * Financial Modeling Prep was the first choice, but its economic calendar moved
 * behind a paid plan (402 Restricted on the free tier), and every other free
 * provider checked either charges for the calendar or does not publish one.
 */
const FEED_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

/** Currencies the desk cares about. Everything else is noise in the brief. */
const CURRENCIES = new Set(["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "NZD", "CAD"]);

type FeedEvent = {
  title?: string;
  country?: string;
  /** ISO 8601 with a UTC offset, e.g. "2026-07-25T15:30:00-04:00". */
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
};

function normaliseImpact(raw: string | undefined): CalendarInput["impact"] | null {
  switch ((raw ?? "").toLowerCase()) {
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    case "low":
      return "LOW";
    case "holiday":
      // Not a release, but a thin-liquidity session is worth a mention.
      return "LOW";
    default:
      return null;
  }
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toCalendarInput(raw: FeedEvent, todayUtc: string): CalendarInput | null {
  const impact = normaliseImpact(raw.impact);
  const currency = raw.country?.toUpperCase();

  if (!impact || !currency || !CURRENCIES.has(currency) || !raw.title || !raw.date) {
    return null;
  }

  // The feed timestamps carry an offset; normalise to UTC so the day boundary
  // and the displayed time agree with everything else in the app.
  const when = new Date(raw.date);
  if (Number.isNaN(when.getTime())) return null;

  const iso = when.toISOString();
  if (iso.slice(0, 10) !== todayUtc) return null;

  return {
    time: iso.slice(11, 16),
    at: iso,
    currency,
    title: raw.title,
    impact,
    // The feed publishes forecast and previous only — released figures are not
    // in it, so `actual` is honestly null rather than guessed.
    actual: null,
    forecast: blankToNull(raw.forecast),
    previous: blankToNull(raw.previous),
  };
}

/**
 * Today's economic calendar, falling back to the last stored set when the feed
 * is unreachable.
 */
export async function fetchEconomicCalendar(
  now: Date = new Date(),
): Promise<SourceResult<CalendarInput[]>> {
  const todayUtc = now.toISOString().slice(0, 10);

  try {
    const response = await fetchWithTimeout(FEED_URL);

    if (!response.ok) {
      throw new Error(`feed returned ${response.status}`);
    }

    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      throw new Error("feed returned an unexpected shape");
    }

    const events = body
      .map((entry): CalendarInput | null =>
        toCalendarInput(entry as FeedEvent, todayUtc),
      )
      .filter((e): e is CalendarInput => e !== null)
      .sort((a, b) => a.time.localeCompare(b.time));

    // An empty calendar is a legitimate answer — quiet days exist — but it is
    // not worth overwriting a good fallback with.
    if (events.length > 0) {
      await rememberSnapshot("ECONOMIC_CALENDAR", events, todayUtc);
    }

    return { data: events, status: "LIVE", fetchedAt: now.toISOString() };
  } catch (error) {
    const reason = describeError(error);

    // Keyed by the day, so a stored set from yesterday is simply not found.
    // Without that key an outage on a quiet morning served yesterday's
    // releases under a heading that says "today" — which is worse than showing
    // nothing, because a trader has no way to tell it is wrong.
    const stored = await recallSnapshot<CalendarInput[]>(
      "ECONOMIC_CALENDAR",
      todayUtc,
    );

    if (!stored) {
      return { data: [], status: "UNAVAILABLE", fetchedAt: null, error: reason };
    }

    return {
      data: stored.data,
      status: "CACHED",
      fetchedAt: stored.fetchedAt.toISOString(),
      error: reason,
    };
  }
}
