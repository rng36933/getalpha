import { cleanMessage } from "../support/sanitise.ts";

/** A few sentences about what happened, not an essay. */
export const MAX_NOTE_LENGTH = 600;

/**
 * Cleans a trade note before it is stored.
 *
 * Returns null for an empty note so clearing the box removes the note rather
 * than storing an empty string — the Coach's "no context note" flag reads
 * null and blank the same way, but the journal list should not have to.
 */
export function cleanNote(raw: string): string | null {
  const cleaned = cleanMessage(raw).slice(0, MAX_NOTE_LENGTH).trim();
  return cleaned === "" ? null : cleaned;
}
