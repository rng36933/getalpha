"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

/**
 * One draggable row. A dedicated handle rather than the whole row, the same
 * reasoning as the dashboard's card grid: the row already has a select
 * button and a remove button of its own, and a drag listener on the whole
 * surface would swallow clicks meant for either.
 */
function SortableRow({
  entry,
  selected,
  busy,
  onSelect,
  onRemove,
}: {
  entry: WatchlistEntry;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.symbol });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="flex items-center gap-1 py-2"
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${entry.label}`}
        {...attributes}
        {...listeners}
        className="shrink-0 touch-none cursor-grab p-1 text-muted transition-colors hover:text-foreground active:cursor-grabbing"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.4" />
          <circle cx="15" cy="6" r="1.4" />
          <circle cx="9" cy="12" r="1.4" />
          <circle cx="15" cy="12" r="1.4" />
          <circle cx="9" cy="18" r="1.4" />
          <circle cx="15" cy="18" r="1.4" />
        </svg>
      </button>

      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span
          className={`block text-sm ${
            selected ? "font-medium text-accent" : "text-foreground"
          }`}
        >
          {entry.label}
        </span>
        <span className="block truncate text-xs text-muted">{entry.name}</span>
      </button>

      <button
        type="button"
        onClick={onRemove}
        disabled={busy}
        aria-label={`Remove ${entry.label}`}
        className="shrink-0 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:text-negative disabled:opacity-50"
      >
        Remove
      </button>
    </li>
  );
}

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

  /**
   * Fire-and-forget, same as the dashboard's card grid: the row already
   * moved on screen, so a failed or slow write should not undo it under the
   * visitor. `router.refresh()` on success because the top entry doubles as
   * the main chart's default instrument server-side — a reorder that moved
   * a new symbol to the top has to reach that render too, not just this list.
   */
  async function persistOrder(order: string[]) {
    try {
      const response = await fetch("/api/watchlist", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (response.ok) router.refresh();
    } catch {
      // Next load reflects whatever was last saved successfully.
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEntries((current) => {
      const from = current.findIndex((e) => e.symbol === active.id);
      const to = current.findIndex((e) => e.symbol === over.id);
      if (from === -1 || to === -1) return current;

      const next = arrayMove(current, from, to);
      persistOrder(next.map((e) => e.symbol));
      return next;
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const full = entries.length >= max;

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={entries.map((e) => e.symbol)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <SortableRow
                key={entry.symbol}
                entry={entry}
                selected={entry.symbol === selectedSymbol}
                busy={busy}
                onSelect={() =>
                  router.push(
                    `/dashboard?symbol=${encodeURIComponent(entry.symbol)}`,
                  )
                }
                onRemove={() => remove(entry.symbol)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

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
          className="w-full rounded-md border border-zinc-800 bg-[#0a0b0f] px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-[#f2c94c] focus:ring-0 disabled:cursor-not-allowed"
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
