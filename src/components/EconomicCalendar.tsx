import type { EconomicEvent, ImpactLevel } from "@/lib/mock-data";

const impactStyles: Record<ImpactLevel, { label: string; className: string }> = {
  HIGH: { label: "High", className: "bg-negative/15 text-negative" },
  MEDIUM: { label: "Medium", className: "bg-warning/15 text-warning" },
  LOW: { label: "Low", className: "bg-muted/15 text-muted" },
};

function ImpactBadge({ impact }: { impact: ImpactLevel }) {
  const { label, className } = impactStyles[impact];

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

type EconomicCalendarProps = {
  events: EconomicEvent[];
};

export default function EconomicCalendar({ events }: EconomicCalendarProps) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No events scheduled for today.
      </p>
    );
  }

  return (
    <div>
      <div className="hidden items-center gap-3 border-b border-line pb-2 text-[11px] uppercase tracking-wider text-muted sm:flex">
        <span className="w-12 shrink-0">Time</span>
        <span className="w-10 shrink-0">Ccy</span>
        <span className="min-w-0 flex-1">Event</span>
        <span className="w-[70px] shrink-0">Impact</span>
        <div className="flex w-40 shrink-0 justify-end gap-4 text-right">
          <span className="w-12">Act</span>
          <span className="w-12">Fcst</span>
          <span className="w-12">Prev</span>
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
              <time className="w-12 shrink-0 font-mono text-xs text-muted">
                {event.time}
              </time>

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
                <ImpactBadge impact={event.impact} />
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
