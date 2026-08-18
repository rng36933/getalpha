/**
 * A shared feed of things that actually just happened in the browser —
 * a poll went out, a price changed, a request failed — so a terminal-style
 * panel can show them as they occur.
 *
 * Deliberately fed only by real events. The dashboard's whole argument is
 * that every number on it is computed, never invented — a "system log" that
 * prints fabricated lines to look busy would be the one place on this page
 * that lied. `LivePrice` (and anything else wired up later) publishes here
 * only when it has genuinely just done something; nothing here is a timer
 * pretending to be an event.
 */

export type LogEntry = {
  at: number;
  text: string;
  tone?: "default" | "positive" | "negative" | "muted";
};

type Listener = (entry: LogEntry) => void;

const listeners = new Set<Listener>();

export function publishLog(text: string, tone: LogEntry["tone"] = "default"): void {
  const entry: LogEntry = { at: Date.now(), text, tone };
  for (const listener of listeners) listener(entry);
}

export function subscribeLog(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
