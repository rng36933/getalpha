import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Macro Desk",
};

/**
 * Rate expectations used to have a card here and no longer does.
 *
 * Everything else on this page can be built from official sources that cost
 * nothing — FRED for yields, CPI and PCE, the CFTC's own feed for positioning,
 * and central bank meeting dates which are published a year ahead. Implied
 * policy odds are the exception: they come from Fed funds futures, and futures
 * data is a monthly subscription with a separate exchange licence on top —
 * showing it to paying subscribers is redistribution, not personal use.
 *
 * Removed rather than left as a placeholder promising something that is not
 * coming soon. If it is ever worth the licence, it comes back.
 */
export default function MacroDeskPage() {
  return (
    <>
      <PageHeader
        title="Macro Desk"
        subtitle="Inflation prints, cross-asset context and positioning."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="DXY / Yields" hint="Cross-asset module" height="h-56" />
        <Card title="Inflation Prints" hint="CPI / PCE table" />
        <Card title="Central Bank Watch" hint="Meeting tracker" />
        <Card title="Commitment of Traders" hint="COT positioning" />
      </div>
    </>
  );
}
