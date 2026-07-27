import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import CalendarView from "@/components/CalendarView";
import DataQualityNotice from "@/components/DataQualityNotice";
import PageHeader from "@/components/PageHeader";
import { calendarCopy } from "@/lib/i18n/app/calendar";
import { getLocale } from "@/lib/i18n/server";
import { fetchEconomicCalendar } from "@/lib/market-data/calendar";
import { currenciesFromSymbols } from "@/lib/market-data/currencies";
import { toEconomicEvents } from "@/lib/market-data/display";
import { getWatchlist } from "@/lib/watchlist";

export const metadata = {
  title: "Calendar",
};

/**
 * The currencies this user is actually exposed to.
 *
 * A failure here shows the calendar unfiltered — a worse default than a
 * filtered one, and a far better one than an error page.
 */
async function watchlistCurrencies(userId: string | null): Promise<string[]> {
  if (!userId) return [];

  try {
    const entries = await getWatchlist(userId);
    return currenciesFromSymbols(entries.map((entry) => entry.symbol));
  } catch (error) {
    console.error("Calendar could not read the watchlist:", error);
    return [];
  }
}

export default async function CalendarPage() {
  const { userId } = await auth();

  // `fetchEconomicCalendar` resolves to stored events when the feed is down and
  // to an empty list when there is nothing stored either — it never rejects, so
  // the page renders whatever is available rather than an error screen.
  const [calendar, currencies, locale] = await Promise.all([
    fetchEconomicCalendar(),
    watchlistCurrencies(userId),
    getLocale(),
  ]);

  const copy = calendarCopy(locale);
  const events = toEconomicEvents(calendar.data);

  const highImpact = events.filter(
    (event) =>
      event.impact === "HIGH" &&
      (currencies.length === 0 || currencies.includes(event.currency)),
  );

  return (
    <>
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <DataQualityNotice
        sources={[{ label: copy.calendarSourceLabel, result: calendar }]}
        locale={locale}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title={copy.calendarCardTitle} className="xl:col-span-2">
          <CalendarView events={events} currencies={currencies} locale={locale} />
        </Card>

        {/* Was an empty "Today's Events — high-impact only" placeholder. It is
            the same list filtered twice over, which is what somebody checks
            before deciding whether to trade the session at all. */}
        <Card title={copy.highImpactCardTitle}>
          {highImpact.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              {events.length === 0
                ? copy.noEventsToday
                : currencies.length > 0
                  ? copy.nothingHighImpactForCurrencies
                  : copy.nothingHighImpact}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {highImpact.map((event) => (
                <li key={event.id} className="flex items-baseline gap-3 py-2.5">
                  <span className="w-10 shrink-0 font-mono text-xs text-muted">
                    {event.currency}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{event.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
