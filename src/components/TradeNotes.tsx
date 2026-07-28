"use client";

import { useState } from "react";
import { MAX_NOTE_LENGTH } from "@/lib/trades/notes";

/** The four fields a trade can gain after the fact. */
export type Notes = {
  setup: string | null;
  timeframe: string | null;
  marketContext: string | null;
  emotionalState: string | null;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-muted">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

/**
 * Writing the reasoning onto a trade that already exists.
 *
 * Aimed at synced trades in particular: MetaTrader knows every price and no
 * reason, and the two note fields are the ones the review has most to say
 * about. Nothing here touches a price — those belong to whatever produced the
 * row, and on a synced trade the next sync would overwrite them anyway.
 */
export default function TradeNotes({
  tradeId,
  notes,
  onSaved,
}: {
  tradeId: string;
  notes: Notes;
  onSaved: (notes: Notes) => void;
}) {
  const [draft, setDraft] = useState<Notes>(notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof Notes>(key: K, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    // Every field goes in every time. The route reads a missing key as "leave
    // it" and an empty string as "clear it", so sending the whole form is what
    // makes deleting a note possible.
    const payload: Notes = {
      setup: draft.setup ?? "",
      timeframe: draft.timeframe ?? "",
      marketContext: draft.marketContext ?? "",
      emotionalState: draft.emotionalState ?? "",
    };

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          body?.details?.[0] ?? body?.error ?? "The notes could not be saved.",
        );
        return;
      }

      const stored: Notes = {
        setup: body?.setup ?? null,
        timeframe: body?.timeframe ?? null,
        marketContext: body?.marketContext ?? null,
        emotionalState: body?.emotionalState ?? null,
      };

      setDraft(stored);
      setSaved(true);
      onSaved(stored);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Setup">
          <input
            className={inputClass}
            value={draft.setup ?? ""}
            onChange={(e) => set("setup", e.target.value)}
            placeholder="H1 order block retest"
            maxLength={120}
          />
        </Field>

        <Field label="Timeframe">
          <input
            className={inputClass}
            value={draft.timeframe ?? ""}
            onChange={(e) => set("timeframe", e.target.value)}
            placeholder="M15"
            maxLength={32}
          />
        </Field>
      </div>

      <Field
        label="Market context"
        hint="What was true before the entry — the level, the session, the release due."
      >
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          value={draft.marketContext ?? ""}
          onChange={(e) => set("marketContext", e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
        />
      </Field>

      <Field
        label="How it felt"
        hint="Impatience, hesitation, revenge after a loss — in your own words."
      >
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          value={draft.emotionalState ?? ""}
          onChange={(e) => set("emotionalState", e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>

        {error ? <span className="text-sm text-negative">{error}</span> : null}
        {saved && !error ? (
          <span className="text-sm text-muted">Saved.</span>
        ) : null}
      </div>
    </form>
  );
}
