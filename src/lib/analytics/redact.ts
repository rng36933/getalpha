/**
 * The privacy boundary, kept in its own file with no imports so it can be
 * tested directly.
 *
 * Several fields that end up in analytics are free text in the database:
 * `asset` and `timeframe` are whatever the user typed. Most of the time that
 * is "XAUUSD" and "H1", but nothing stops someone using the instrument field
 * as a scratch note, and that note must not reach a third party.
 */

/** Longer than any real symbol or timeframe, short enough to exclude prose. */
const MAX_LENGTH = 12;

/** Symbols and timeframes only: letters, digits, and the separators they use. */
const SHAPE = /^[A-Z0-9/.\-_]+$/;

/**
 * Passes a value through only if it looks like a symbol or a timeframe.
 *
 * Anything else collapses to "other" — the event still counts, but whatever
 * was typed stays on this side of the network. An empty value is "unknown",
 * which is a different fact from "the user typed something unusable".
 */
export function safeLabel(value: string | null | undefined): string {
  if (value === null || value === undefined) return "unknown";

  const trimmed = value.trim().toUpperCase();
  if (trimmed === "") return "unknown";

  return trimmed.length <= MAX_LENGTH && SHAPE.test(trimmed) ? trimmed : "other";
}
