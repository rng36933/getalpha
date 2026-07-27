/**
 * When a connected terminal counts as having stopped talking.
 *
 * Shared by the dashboard prompt and the Settings panel so the two surfaces
 * cannot disagree about whether a terminal is alive — one saying "connected"
 * while the other warns is worse than either message alone.
 *
 * No imports on purpose: `npm test` runs the bare node runner, which resolves
 * neither the `@/` alias nor a missing extension.
 */

/** How often the Expert Advisor sends, in milliseconds. Its `SyncSeconds`. */
export const SYNC_INTERVAL_MS = 120 * 1000;

/**
 * How long silence is tolerated before it is called a fault.
 *
 * Seven and a half cycles. Generous on purpose: a laptop lid closing, a
 * momentary network drop or a slow provider must not raise an alarm, because a
 * warning that cries wolf is one people learn to scroll past — and this one has
 * to still be believed months from now.
 *
 * It must stay comfortably above `SYNC_INTERVAL_MS`; `tests/mt5-liveness.test.ts`
 * fails if the two ever cross.
 */
export const STALE_AFTER_MS = 15 * 60 * 1000;

/**
 * Whether a terminal has been quiet long enough to be worth saying so.
 *
 * `null` — a key exists but nothing ever arrived — is deliberately *not* quiet:
 * that is a setup which was never finished, and it needs different words from a
 * connection that worked and then stopped.
 */
export function hasGoneQuiet(
  lastSeenAt: string | Date | null,
  now: Date = new Date(),
): boolean {
  if (lastSeenAt === null) return false;

  const at = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt;
  if (Number.isNaN(at.getTime())) return false;

  return now.getTime() - at.getTime() > STALE_AFTER_MS;
}
