"use client";

import { useState } from "react";
import EconomicCalendar from "@/components/EconomicCalendar";
import { calendarCopy } from "@/lib/i18n/app/calendar";
import type { Locale } from "@/lib/i18n/locales";
import type { EconomicEvent } from "@/lib/market-data/display";

type CalendarViewProps = {
  events: EconomicEvent[];
  /** Currencies derived from the user's watchlist. Empty when they have none. */
  currencies: string[];
  locale: Locale;
};

export default function CalendarView({ events, currencies, locale }: CalendarViewProps) {
  const copy = calendarCopy(locale);
  // Defaults to the watchlist. Somebody trading three pairs does not need
  // every release from eight economies, and the whole point of having a
  // watchlist is that the app knows which ones matter to them.
  const [mineOnly, setMineOnly] = useState(currencies.length > 0);

  const filtered = mineOnly
    ? events.filter((event) => currencies.includes(event.currency))
    : events;

  const hidden = events.length - filtered.length;

  return (
    <div>
      {currencies.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            aria-pressed={mineOnly}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              mineOnly
                ? "border-accent bg-accent-soft text-accent"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            {copy.view.myWatchlist}
          </button>

          <button
            type="button"
            onClick={() => setMineOnly(false)}
            aria-pressed={!mineOnly}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              mineOnly
                ? "border-line text-muted hover:text-foreground"
                : "border-accent bg-accent-soft text-accent"
            }`}
          >
            {copy.view.allCurrencies}
          </button>

          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {currencies.join(" · ")}
          </span>
        </div>
      ) : null}

      {mineOnly && filtered.length === 0 && events.length > 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {copy.view.nothingForFollowed}{" "}
          <button
            type="button"
            onClick={() => setMineOnly(false)}
            className="text-accent hover:underline"
          >
            {copy.view.showAll(events.length)}
          </button>
          .
        </p>
      ) : (
        <EconomicCalendar events={filtered} locale={locale} />
      )}

      {mineOnly && hidden > 0 && filtered.length > 0 ? (
        <p className="mt-3 text-xs text-muted">{copy.view.hiddenNote(hidden)}</p>
      ) : null}
    </div>
  );
}
