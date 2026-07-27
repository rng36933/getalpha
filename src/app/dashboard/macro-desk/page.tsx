import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import DataQualityNotice from "@/components/DataQualityNotice";
import { CotList, ReadingList } from "@/components/MacroReadings";
import PageHeader from "@/components/PageHeader";
import { macroDeskCopy } from "@/lib/i18n/app/macroDesk";
import { getLocale } from "@/lib/i18n/server";
import { COT_SYMBOLS, fetchCotPositioning } from "@/lib/market-data/cot";
import {
  INFLATION_SERIES,
  POLICY_SERIES,
  YIELD_SERIES,
  fetchMacroSeries,
  readingsFor,
} from "@/lib/market-data/fred";
import { getWatchlist } from "@/lib/watchlist";

export const metadata = {
  title: "Macro Desk",
};

/**
 * Never prerendered.
 *
 * This is the only page in the dashboard that does not call `auth()`, and
 * `auth()` is what marks the others dynamic by throwing a control-flow error
 * during static generation. Without it, Next tried to render this page at build
 * time, every `no-store` fetch to FRED threw `DynamicServerError`, and the
 * provider error handling caught all eleven of them and reported a dead
 * provider — an outage manufactured by the build.
 *
 * Declaring it here rather than sniffing for the error inside the fetch helpers:
 * a control-flow error should never reach a `catch` written for HTTP failures.
 * See the same trap noted on the dashboard's `loadWatchlist`.
 */
export const dynamic = "force-dynamic";

/**
 * Built entirely on sources that cost nothing: FRED for yields, the dollar,
 * inflation and policy rates, and the CFTC's own feed for positioning.
 *
 * What is deliberately absent is implied policy odds. Those come from Fed funds
 * futures, and futures data is a monthly subscription with a separate exchange
 * licence on top — showing it to paying subscribers is redistribution, not
 * personal use. A card promising it is not coming would be worse than no card.
 */
export default async function MacroDeskPage() {
  const { userId } = await auth();

  const [macro, cot, watchlist, locale] = await Promise.all([
    fetchMacroSeries(),
    fetchCotPositioning(),
    userId ? getWatchlist(userId) : Promise.resolve([]),
    getLocale(),
  ]);

  const copy = macroDeskCopy(locale);

  // Positioning is shown only for what this person actually watches. The report
  // covers six markets and most traders care about one or two of them; the
  // other four were noise on every visit. Filtered per user rather than
  // globally, so somebody following six pairs still sees six.
  const watched = new Set(watchlist.map((entry) => entry.symbol));
  const cotRows = cot.data.filter((row) =>
    watched.has(COT_SYMBOLS[row.label] ?? ""),
  );

  return (
    <>
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <DataQualityNotice
        sources={[
          { label: copy.macroSourceLabel, result: macro },
          { label: copy.positioningSourceLabel, result: cot },
        ]}
        locale={locale}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title={copy.yieldsCardTitle}>
          <ReadingList readings={readingsFor(macro.data, YIELD_SERIES)} locale={locale} />
        </Card>

        <Card title={copy.inflationCardTitle}>
          <ReadingList readings={readingsFor(macro.data, INFLATION_SERIES)} locale={locale} />
        </Card>

        <Card title={copy.policyRatesCardTitle}>
          <ReadingList readings={readingsFor(macro.data, POLICY_SERIES)} locale={locale} />
        </Card>

        <Card title={copy.positioningCardTitle} className="md:col-span-2 xl:col-span-3">
          <CotList rows={cotRows} locale={locale} />
        </Card>
      </div>
    </>
  );
}
