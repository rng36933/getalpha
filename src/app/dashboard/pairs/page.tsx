import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import Card from "@/components/Card";
import EconomicCalendar from "@/components/EconomicCalendar";
import PageHeader from "@/components/PageHeader";
import PairAnalysis from "@/components/PairAnalysis";
import DraggableGrid, {
  type GridItem,
} from "@/components/dashboard/DraggableGrid";
import { analyseJournal, type JournalAnalysis } from "@/lib/analysis/per-pair";
import { PAIRS_CARD_KEYS } from "@/lib/dashboard/card-keys";
import { loadOrder, resolveOrder } from "@/lib/dashboard/layout";
import { fetchEconomicCalendar } from "@/lib/market-data/calendar";
import { currenciesFromSymbols } from "@/lib/market-data/currencies";
import { toEconomicEvents } from "@/lib/market-data/display";
import { getAccountCurrency } from "@/lib/mt5/account";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Pairs",
};

/**
 * Everything, not a page of it.
 *
 * A per-pair record built from the most recent fifty trades would answer a
 * different question than the one being asked, and quietly. The cap is a
 * guard against a runaway sync, not a window.
 */
const MAX_TRADES = 2000;

async function loadAnalysis(userId: string): Promise<JournalAnalysis | null> {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: MAX_TRADES,
    });

    return analyseJournal(trades);
  } catch (error) {
    console.error("Could not read the journal for the pair breakdown:", error);
    return null;
  }
}

export default async function PairsPage({
  searchParams,
}: {
  searchParams: Promise<{ pair?: string }>;
}) {
  const { userId } = await auth();
  const { pair: requested } = await searchParams;

  const [analysis, currency, savedOrder] = await Promise.all([
    userId ? loadAnalysis(userId) : Promise.resolve(null),
    getAccountCurrency(userId),
    userId
      ? loadOrder(userId, "pairs").catch((error) => {
          console.error("Could not read the pairs layout:", error);
          return null;
        })
      : Promise.resolve(null),
  ]);

  if (analysis === null) {
    return (
      <>
        <PageHeader title="Pairs" />
        <Card title="Per-pair record">
          <p className="py-8 text-center text-sm text-muted">
            Your journal could not be read just now. Reload in a moment —
            nothing has been lost.
          </p>
        </Card>
      </>
    );
  }

  if (analysis.pairs.length === 0) {
    return (
      <>
        <PageHeader
          title="Pairs"
          subtitle="What your own record says about each instrument you trade."
        />
        <Card title="Per-pair record">
          <div className="py-8 text-center">
            <p className="text-sm text-muted">
              Nothing to break down yet. This page is built entirely from your
              journal — it has no opinion of its own about any pair.
            </p>
            <p className="mt-2 text-sm text-muted">
              Connect your platform and ninety days of history arrives on the first
              sync, broken down per instrument.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm text-accent hover:underline"
            >
              Connect your platform
            </Link>
          </div>
        </Card>
      </>
    );
  }

  // An unknown or absent `?pair=` falls back to the most-traded rather than to
  // an error: a stale bookmark should still show something true.
  const selected =
    analysis.pairs.find((p) => p.asset === requested) ?? analysis.pairs[0];

  // Gold has no calendar of its own, and a per-pair page showing "here's
  // today's USD calendar" under a XAUUSD heading reads as a finding about
  // gold rather than what it actually is — releases that happen to share a
  // currency with gold's quote leg. Left out here rather than folded into
  // `currenciesFromSymbols`, which other callers still want the quote-leg
  // behaviour from.
  const isGold = selected.asset.toUpperCase().startsWith("XAU");

  // Widened to string, because an event's currency comes off a feed and is not
  // known to be one of ours until it is compared.
  const currencies: string[] = isGold
    ? []
    : currenciesFromSymbols([selected.asset]);
  const calendar =
    currencies.length > 0 ? await fetchEconomicCalendar() : null;
  const events = calendar
    ? toEconomicEvents(calendar.data).filter((event) =>
        currencies.includes(event.currency),
      )
    : [];

  return (
    <>
      <PageHeader
        title="Pairs"
        subtitle="Counted from your own trades. Nothing here predicts anything."
      />

      <nav className="mb-4 flex flex-wrap gap-2">
        {analysis.pairs.map((p) => {
          const active = p.asset === selected.asset;

          return (
            <Link
              key={p.asset}
              href={`/dashboard/pairs?pair=${encodeURIComponent(p.asset)}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-muted hover:text-foreground"
              }`}
            >
              {p.asset}
              <span className="ml-2 font-mono opacity-70">{p.trades}</span>
            </Link>
          );
        })}
      </nav>

      {(() => {
        const cards: Record<(typeof PAIRS_CARD_KEYS)[number], GridItem | null> = {
          record: {
            key: "record",
            children: (
              <Card title={`${selected.asset} — your record`}>
                <PairAnalysis pair={selected} currency={currency} />
              </Card>
            ),
          },
          calendar:
            currencies.length > 0
              ? {
                  key: "calendar",
                  children: (
                    <Card title={`Today's calendar for ${currencies.join(", ")}`}>
                      <EconomicCalendar events={events} />
                    </Card>
                  ),
                }
              : null,
        };

        const present = PAIRS_CARD_KEYS.filter((key) => cards[key] !== null);
        const order = resolveOrder(savedOrder ?? [], present);
        const items = present.map((key) => cards[key]!);

        return (
          <DraggableGrid
            page="pairs"
            items={items}
            initialOrder={order}
            className="space-y-4"
          />
        );
      })()}
    </>
  );
}
