"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to; the value never changes after hydration. */
const noSubscribe = () => () => {};

/**
 * False while rendering on the server and during the first client render,
 * true afterwards.
 *
 * This is what `useSyncExternalStore` is for. Setting state in an effect would
 * do the same thing, but React's compiler rejects it — and rightly, since it
 * schedules a second render to learn something the renderer could have been
 * told directly.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

type LocalTimeProps = {
  /** Full ISO timestamp. Null when the stored record predates the field. */
  at: string | null;
  /** HH:MM in UTC, rendered on the server and until the browser takes over. */
  utc: string;
  /**
   * Print the day as well as the clock.
   *
   * Worth it wherever the reader's day can differ from the feed's. The calendar
   * is filtered to one UTC day, but a 22:00 UTC release is one in the morning
   * of the next day in Vilnius — so a bare "01:00" is a time on a date the
   * reader has to work out.
   */
  withDate?: boolean;
};

/** Fixed, so the server's locale cannot change the pre-hydration markup. */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toLocal(at: string, withDate: boolean): string | null {
  const parsed = new Date(at);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    ...(withDate ? { day: "2-digit", month: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

/** The UTC day, for the server render and for anything without a timestamp. */
function utcDate(at: string): string | null {
  const [date] = at.split("T");
  const [, month, day] = date?.split("-") ?? [];
  const index = Number(month) - 1;

  if (!day || !MONTHS[index]) return null;
  return `${day} ${MONTHS[index]}`;
}

/**
 * Shows an event time in the reader's own zone.
 *
 * The server has no idea what zone the reader is in, so it renders UTC and the
 * browser replaces it. Rendering local time directly on the server would
 * produce markup that does not match what React builds on the client, and
 * React resolves that by throwing the server's HTML away.
 *
 * This matters more than it looks. A trader reading "15:30" against an open
 * position is reading a deadline; being three hours out is not cosmetic.
 */
export default function LocalTime({
  at,
  utc,
  withDate = false,
}: LocalTimeProps) {
  const hydrated = useHydrated();
  const local = hydrated && at ? toLocal(at, withDate) : null;

  // Before hydration, and for a record with no timestamp: UTC, with the day in
  // front when one was asked for and can be read off the ISO string.
  const day = withDate && at ? utcDate(at) : null;
  const fallback = day ? `${day} ${utc}` : utc;

  return (
    <time dateTime={at ?? undefined} suppressHydrationWarning>
      {local ?? fallback}
    </time>
  );
}

/** The reader's zone abbreviation, for the column heading. */
export function LocalZoneLabel() {
  const hydrated = useHydrated();

  if (!hydrated) return <span suppressHydrationWarning>UTC</span>;

  const parts = new Intl.DateTimeFormat(undefined, {
    timeZoneName: "short",
  }).formatToParts(new Date());

  const zone = parts.find((part) => part.type === "timeZoneName")?.value;

  return <span suppressHydrationWarning>{zone ?? "UTC"}</span>;
}
