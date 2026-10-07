import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import CalendarView from "@/components/CalendarView";
import DataQualityNotice from "@/components/DataQualityNotice";
import PageHeader from "@/components/PageHeader";
import PnlMonthCalendar from "@/components/PnlMonthCalendar";
import type { PnlPoint } from "@/lib/journal/month-pnl";
import { fetchEconomicCalendar } from "@/lib/market-data/calendar";
import { currenciesFromSymbols } from "@/lib/market-data/currencies";
import { toEconomicEvents } from "@/lib/market-data/display";
import { getAccountCurrency } from "@/lib/mt5/account";
import { prisma } from "@/lib/prisma";
import { getWatchlist } from "@/lib/watchlist";

/** Same cap the Journal reads, so the calendar and the log describe the same trades. */
const MAX_TRADES = 2000;

/**
 * Every closed trade's result, dated by when it closed.
 *
 * A trade with no close time falls back to when it was logged. A failure here
 * leaves the calendar empty rather than taking the page down — the economic
 * calendar beside it does not depend on it.
 */
async function loadPnlPoints(userId: string | null): Promise<PnlPoint[]> {
  if (!userId) return [];

  try {
    const trades = await prisma.trade.findMany({
      where: { userId, pnl: { not: null } },
      orderBy: { createdAt: "desc" },
      take: MAX_TRADES,
      select: { pnl: true, closedAt: true, createdAt: true },
    });

    return trades.flatMap((trade) =>
      trade.pnl === null
        ? []
        : [{ at: (trade.closedAt ?? trade.createdAt).toISOString(), pnl: trade.pnl.toNumber() }],
    );
  } catch (error) {
    console.error("Calendar could not read the closed trades:", error);
    return [];
  }
}

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
  const [calendar, currencies, pnlPoints, accountCurrency] = await Promise.all([
    fetchEconomicCalendar(),
    watchlistCurrencies(userId),
    loadPnlPoints(userId),
    getAccountCurrency(userId),
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

        <div className="space-y-4">
          <Card title="Daily P&L">
            <PnlMonthCalendar points={pnlPoints} currency={accountCurrency} />
          </Card>

          {/* Was an empty "Today's Events — high-impact only" placeholder. It
              is the same list filtered twice over, which is what somebody
              checks before deciding whether to trade the session at all. */}
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
      </div>
    </>
  );
}
