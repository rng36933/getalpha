"use client";

import { useState } from "react";

type EmailPreferencesProps = {
  initialDailyBrief: boolean;
  /** False when the account cannot receive the brief, so the toggle explains why. */
  entitled: boolean;
};

export default function EmailPreferences({
  initialDailyBrief,
  entitled,
}: EmailPreferencesProps) {
  const [dailyBrief, setDailyBrief] = useState(initialDailyBrief);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(next: boolean) {
    // Moved before the request so the switch responds to the click; put back
    // if the save fails, rather than showing a state the server never took.
    setDailyBrief(next);
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dailyBrief: next }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setDailyBrief(!next);
        setError(body?.error ?? "Could not save. Try again.");
      }
    } catch {
      setDailyBrief(!next);
      setError("Could not reach the server. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={dailyBrief}
          disabled={saving}
          onChange={(event) => toggle(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-accent"
        />
        <span>
          <span className="block text-sm text-foreground">
            Morning Session Brief
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            One email before the London open, 07:30 UK time. Off by default.
          </span>
          <span className="mt-1 block text-xs text-muted">
            Currently XAUUSD only, regardless of your watchlist — more
            instruments may be added later.
          </span>
        </span>
      </label>

      {!entitled && dailyBrief ? (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          The Session Brief is part of the Pro plan. This preference is saved,
          but no email is sent while the plan is inactive.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
