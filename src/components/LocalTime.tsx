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
};

function toLocal(at: string): string | null {
  const parsed = new Date(at);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
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
export default function LocalTime({ at, utc }: LocalTimeProps) {
  const hydrated = useHydrated();
  const local = hydrated && at ? toLocal(at) : null;

  return (
    <time dateTime={at ?? undefined} suppressHydrationWarning>
      {local ?? utc}
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
