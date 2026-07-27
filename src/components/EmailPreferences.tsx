"use client";

import { useState } from "react";
import { settingsCopy } from "@/lib/i18n/app/settings";
import type { Locale } from "@/lib/i18n/locales";

type EmailPreferencesProps = {
  initialDailyBrief: boolean;
  /** False when the account cannot receive the brief, so the toggle explains why. */
  entitled: boolean;
  locale: Locale;
};

export default function EmailPreferences({
  initialDailyBrief,
  entitled,
  locale,
}: EmailPreferencesProps) {
  const copy = settingsCopy(locale).email;
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
        setError(body?.error ?? copy.saveFailed);
      }
    } catch {
      setDailyBrief(!next);
      setError(copy.networkError);
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
          <span className="block text-sm text-foreground">{copy.label}</span>
          <span className="mt-0.5 block text-xs text-muted">
            {copy.description}
          </span>
        </span>
      </label>

      {!entitled && dailyBrief ? (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {copy.notEntitledNote}
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
