import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import CalendarView from "@/components/CalendarView";
import DataQualityNotice from "@/components/DataQualityNotice";
import PageHeader from "@/components/PageHeader";
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
  const [calendar, currencies] = await Promise.all([
    fetchEconomicCalendar(),
    watchlistCurrencies(userId),
  ]);

  const events = toEconomicEvents(calendar.data);

  const highImpact = events.filter(
    (event) =>
      event.impact === "HIGH" &&
      (currencies.length === 0 || currencies.includes(event.currency)),
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Today's releases, in your timezone, for the currencies you trade."
      />

      <DataQualityNotice
        sources={[{ label: "Economic calendar", result: calendar }]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Economic calendar" className="xl:col-span-2">
          <CalendarView events={events} currencies={currencies} />
        </Card>

        {/* Was an empty "Today's Events — high-impact only" placeholder. It is
            the same list filtered twice over, which is what somebody checks
            before deciding whether to trade the session at all. */}
        <Card title="High impact today">
          {highImpact.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              {events.length === 0
                ? "No releases scheduled today."
                : currencies.length > 0
                  ? "Nothing high-impact for your currencies today."
                  : "Nothing high-impact scheduled today."}
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
