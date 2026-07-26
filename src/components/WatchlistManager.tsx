"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type WatchlistEntry = {
  symbol: string;
  label: string;
  name: string;
};

type SearchResult = WatchlistEntry & { kind: string; group: string | null };

type WatchlistManagerProps = {
  initialEntries: WatchlistEntry[];
  max: number;
  /** The instrument the chart is currently showing. */
  selectedSymbol: string;
};

/** Long enough to stop firing per keystroke, short enough to feel immediate. */
const SEARCH_DELAY_MS = 200;

export default function WatchlistManager({
  initialEntries,
  max,
  selectedSymbol,
}: WatchlistManagerProps) {
  const router = useRouter();

  const [entries, setEntries] = useState(initialEntries);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Held in a ref rather than state: changing it must not re-render, and the
  // cleanup needs the identity of the timer this render scheduled.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clearing for an empty query happens in the change handler, not here.
    // Setting state synchronously in an effect body triggers a second render
    // for something the event that caused it could have done directly.
    if (query.trim() === "") return;

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/instruments?q=${encodeURIComponent(query)}&limit=8`,
        );
        if (!response.ok) return;

        const body = await response.json();
        setResults(Array.isArray(body.results) ? body.results : []);
      } catch {
        // A failed search is a quiet no-op; the field still works.
        setResults([]);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  async function add(symbol: string) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? "Could not add that instrument.");
      } else {
        setEntries(body.entries ?? entries);
        setQuery("");
        setResults([]);
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(symbol: string) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/watchlist?symbol=${encodeURIComponent(symbol)}`,
        { method: "DELETE" },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.error ?? "Could not remove that instrument.");
      } else {
        setEntries(body.entries ?? entries);

        // The chart is rendered on the server from this list, so removing what
        // it is showing has to re-render there.
        if (symbol === selectedSymbol) router.push("/dashboard");
        else router.refresh();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const full = entries.length >= max;

  return (
    <div>
      <ul className="divide-y divide-line">
        {entries.map((entry) => {
          const selected = entry.symbol === selectedSymbol;

          return (
            <li key={entry.symbol} className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard?symbol=${encodeURIComponent(entry.symbol)}`,
                  )
                }
                className="min-w-0 flex-1 text-left"
              >
                <span
                  className={`block text-sm ${
                    selected ? "font-medium text-accent" : "text-foreground"
                  }`}
                >
                  {entry.label}
                </span>
                <span className="block truncate text-xs text-muted">
                  {entry.name}
                </span>
              </button>

              <button
                type="button"
                onClick={() => remove(entry.symbol)}
                disabled={busy}
                aria-label={`Remove ${entry.label}`}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:text-negative disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          Nothing on the list. Search below to add an instrument.
        </p>
      ) : null}

      <div className="mt-3">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim() === "") setResults([]);
          }}
          disabled={busy || full}
          placeholder={full ? `The list holds ${max} instruments` : "Add an instrument…"}
          aria-label="Search instruments"
          className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent disabled:cursor-not-allowed"
        />

        {results.length > 0 ? (
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {results.map((result) => (
              <li key={result.symbol}>
                <button
                  type="button"
                  onClick={() => add(result.symbol)}
                  disabled={busy}
                  className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-raised disabled:opacity-50"
                >
                  <span className="text-sm">{result.label}</span>
                  <span className="truncate text-xs text-muted">
                    {result.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-negative">
          {error}
        </p>
      ) : null}
    </div>
  );
}
