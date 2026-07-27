import type { SessionBriefInput, TradingSession } from "@/lib/ai/types";
import { fetchEconomicCalendar } from "./calendar";
import { fetchTechnicalLevels } from "./levels";
import { fetchNewsHeadlines } from "./news";
import type { BriefSymbol, MarketSnapshot } from "./types";

/**
 * Collects every input the brief needs, on the server.
 *
 * The client used to send this data, which quietly broke once briefs became
 * shared: a cached brief built from one user's payload was served to the next.
 * Collecting it here means there is only ever one version of the truth — and
 * that argument still holds now that briefs are shared per *instrument set*
 * rather than globally. The symbols come from the caller, who resolved them
 * from the reader's plan; nothing here trusts a request body.
 *
 * The calendar and the news are not filtered to `symbols` on the way in. Both
 * are whole-market documents, the brief prompt is what relates them to the
 * instruments in front of it, and dropping a dollar release from a gold brief
 * would remove the very thing that explains the day.
 */
export async function collectMarketSnapshot(
  session: TradingSession,
  symbols: readonly BriefSymbol[],
  now: Date = new Date(),
): Promise<MarketSnapshot> {
  // Sequential fetching would triple the latency for no benefit — the three
  // providers are unrelated, and each already has its own deadline.
  const [economicEvents, technicalLevels, newsHeadlines] = await Promise.all([
    fetchEconomicCalendar(now),
    fetchTechnicalLevels(symbols, now),
    fetchNewsHeadlines(now),
  ]);

  const degraded = [economicEvents, technicalLevels, newsHeadlines].some(
    (source) => source.status !== "LIVE",
  );

  return {
    session,
    asOf: now.toISOString(),
    economicEvents,
    technicalLevels,
    newsHeadlines,
    degraded,
  };
}

/** True when nothing at all was collected — there is no brief to write. */
export function isSnapshotEmpty(snapshot: MarketSnapshot): boolean {
  return (
    snapshot.economicEvents.data.length === 0 &&
    snapshot.technicalLevels.data.length === 0 &&
    snapshot.newsHeadlines.data.length === 0
  );
}

/**
 * Flattens the snapshot into the model's input, carrying the provenance of each
 * source with it.
 *
 * The model is told which parts are stale and which are missing, because the
 * system prompt requires it to name gaps rather than fill them in.
 */
export function toBriefInput(snapshot: MarketSnapshot): SessionBriefInput & {
  dataQuality: Record<string, string>;
} {
  const describe = (
    label: string,
    source: { status: string; fetchedAt: string | null },
  ): [string, string] => {
    switch (source.status) {
      case "LIVE":
        return [label, "live"];
      case "CACHED":
        return [
          label,
          `provider unavailable; last good data from ${source.fetchedAt}`,
        ];
      default:
        return [label, "unavailable — treat as missing, do not infer"];
    }
  };

  return {
    session: snapshot.session,
    asOf: snapshot.asOf,
    economicEvents: snapshot.economicEvents.data,
    technicalLevels: snapshot.technicalLevels.data,
    newsHeadlines: snapshot.newsHeadlines.data,
    dataQuality: Object.fromEntries([
      describe("economicEvents", snapshot.economicEvents),
      describe("technicalLevels", snapshot.technicalLevels),
      describe("newsHeadlines", snapshot.newsHeadlines),
    ]),
  };
}

/** Provenance for the API response and the UI warning. */
export function toSourceReport(snapshot: MarketSnapshot) {
  return {
    degraded: snapshot.degraded,
    sources: {
      economicEvents: {
        status: snapshot.economicEvents.status,
        fetchedAt: snapshot.economicEvents.fetchedAt,
        count: snapshot.economicEvents.data.length,
      },
      technicalLevels: {
        status: snapshot.technicalLevels.status,
        fetchedAt: snapshot.technicalLevels.fetchedAt,
        count: snapshot.technicalLevels.data.length,
      },
      newsHeadlines: {
        status: snapshot.newsHeadlines.status,
        fetchedAt: snapshot.newsHeadlines.fetchedAt,
        count: snapshot.newsHeadlines.data.length,
      },
    },
  };
}
