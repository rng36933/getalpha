import Card from "@/components/Card";
import DataQualityNotice from "@/components/DataQualityNotice";
import { CotList, ReadingList } from "@/components/MacroReadings";
import PageHeader from "@/components/PageHeader";
import { fetchCotPositioning } from "@/lib/market-data/cot";
import {
  INFLATION_SERIES,
  POLICY_SERIES,
  YIELD_SERIES,
  fetchMacroSeries,
  readingsFor,
} from "@/lib/market-data/fred";

export const metadata = {
  title: "Macro Desk",
};

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
  const [macro, cot] = await Promise.all([
    fetchMacroSeries(),
    fetchCotPositioning(),
  ]);

  return (
    <>
      <PageHeader
        title="Macro Desk"
        subtitle="Rates, the dollar, inflation and positioning — the context a session sits in."
      />

      <DataQualityNotice
        sources={[
          { label: "Macro series", result: macro },
          { label: "Positioning", result: cot },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Yields and the dollar">
          <ReadingList readings={readingsFor(macro.data, YIELD_SERIES)} />
        </Card>

        <Card title="Inflation">
          <ReadingList readings={readingsFor(macro.data, INFLATION_SERIES)} />
        </Card>

        <Card title="Policy rates">
          <ReadingList readings={readingsFor(macro.data, POLICY_SERIES)} />
        </Card>

        <Card title="Positioning" className="md:col-span-2 xl:col-span-3">
          <CotList rows={cot.data} />
        </Card>
      </div>
    </>
  );
}
