"use client";

import { useState } from "react";

type EmailPreferencesProps = {
  initialDailyBrief: boolean;
  initialNewsAlerts: boolean;
  /** False when the account cannot receive either email, so each toggle explains why. */
  entitled: boolean;
};

export default function EmailPreferences({
  initialDailyBrief,
  initialNewsAlerts,
  entitled,
}: EmailPreferencesProps) {
  const [dailyBrief, setDailyBrief] = useState(initialDailyBrief);
  const [newsAlerts, setNewsAlerts] = useState(initialNewsAlerts);
  const [saving, setSaving] = useState<"dailyBrief" | "newsAlerts" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(field: "dailyBrief" | "newsAlerts", next: boolean) {
    const setField = field === "dailyBrief" ? setDailyBrief : setNewsAlerts;

    // Moved before the request so the switch responds to the click; put back
    // if the save fails, rather than showing a state the server never took.
    setField(next);
    setSaving(field);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setField(!next);
        setError(body?.error ?? "Could not save. Try again.");
      }
    } catch {
      setField(!next);
      setError("Could not reach the server. Check your connection.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={dailyBrief}
          disabled={saving === "dailyBrief"}
          onChange={(event) => toggle("dailyBrief", event.target.checked)}
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

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={newsAlerts}
          disabled={saving === "newsAlerts"}
          onChange={(event) => toggle("newsAlerts", event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-accent"
        />
        <span>
          <span className="block text-sm text-foreground">News Alerts</span>
          <span className="mt-0.5 block text-xs text-muted">
            A separate email about 30 minutes before each high or
            medium-impact USD release. On top of, not instead of, the
            morning brief. Off by default.
          </span>
          <span className="mt-1 block text-xs text-muted">
            Names what&apos;s scheduled and how XAUUSD tends to react — never
            what to do about it.
          </span>
        </span>
      </label>

      {!entitled && (dailyBrief || newsAlerts) ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          Both of these are part of the Pro plan. Your preference is saved,
          but no email is sent while the plan is inactive.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
