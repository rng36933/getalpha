import LocalTime, { LocalZoneLabel } from "@/components/LocalTime";
import { calendarCopy, type CalendarCopy } from "@/lib/i18n/app/calendar";
import type { Locale } from "@/lib/i18n/locales";
import type { EconomicEvent, ImpactLevel } from "@/lib/market-data/display";

function impactLabel(impact: ImpactLevel, copy: CalendarCopy): string {
  if (impact === "HIGH") return copy.impact.high;
  if (impact === "MEDIUM") return copy.impact.medium;
  return copy.impact.low;
}

const impactClassName: Record<ImpactLevel, string> = {
  HIGH: "bg-negative/15 text-negative",
  MEDIUM: "bg-warning/15 text-warning",
  LOW: "bg-muted/15 text-muted",
};

function ImpactBadge({ impact, copy }: { impact: ImpactLevel; copy: CalendarCopy }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${impactClassName[impact]}`}
    >
      {impactLabel(impact, copy)}
    </span>
  );
}

type EconomicCalendarProps = {
  events: EconomicEvent[];
  locale: Locale;
};

export default function EconomicCalendar({ events, locale }: EconomicCalendarProps) {
  const copy = calendarCopy(locale);

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">{copy.noEventsToday}</p>
    );
  }

  return (
    <div>
      <div className="hidden items-center gap-3 border-b border-line pb-2 text-[11px] uppercase tracking-wider text-muted sm:flex">
        <span className="w-20 shrink-0 sm:w-24">
          {copy.columns.when} <LocalZoneLabel />
        </span>
        <span className="w-10 shrink-0">{copy.columns.ccy}</span>
        <span className="min-w-0 flex-1">{copy.columns.event}</span>
        <span className="w-[70px] shrink-0">{copy.columns.impact}</span>
        <div className="flex w-40 shrink-0 justify-end gap-4 text-right">
          <span className="w-12">{copy.columns.actual}</span>
          <span className="w-12">{copy.columns.forecast}</span>
          <span className="w-12">{copy.columns.previous}</span>
        </div>
      </div>

      <ul className="divide-y divide-line">
        {events.map((event) => {
          // An event that already has an `actual` reading has been released.
          const released = event.actual !== null;

          return (
            <li
              key={event.id}
              className="flex items-center gap-3 py-3 last:pb-0"
            >
              {/* The date as well as the clock: the feed is one UTC day, but
                  east of London a late release falls on the reader's next day,
                  and a bare time is then a time on a date they have to work
                  out for themselves. */}
              <span className="w-20 shrink-0 font-mono text-[11px] leading-tight tabular-nums text-muted sm:w-24 sm:text-xs">
                <LocalTime at={event.at} utc={event.time} withDate />
              </span>

              <span className="w-10 shrink-0 text-xs font-medium text-muted">
                {event.currency}
              </span>

              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  released ? "text-muted" : "text-foreground"
                }`}
              >
                {event.title}
              </span>

              <span className="w-[70px] shrink-0">
                <ImpactBadge impact={event.impact} copy={copy} />
              </span>

              <div className="hidden w-40 shrink-0 justify-end gap-4 text-right font-mono text-xs sm:flex">
                <span
                  className={`w-12 ${released ? "text-foreground" : "text-muted"}`}
                >
                  {event.actual ?? "—"}
                </span>
                <span className="w-12 text-muted">{event.forecast ?? "—"}</span>
                <span className="w-12 text-muted">{event.previous ?? "—"}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
