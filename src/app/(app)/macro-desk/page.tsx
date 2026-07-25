import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";

export default function MacroDeskPage() {
  return (
    <>
      <PageHeader
        title="Macro Desk"
        subtitle="Rates, inflation prints and cross-asset context."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Rate Expectations" hint="Curve module" className="md:col-span-2" height="h-56" />
        <Card title="DXY / Yields" hint="Cross-asset module" height="h-56" />
        <Card title="Inflation Prints" hint="CPI / PCE table" />
        <Card title="Central Bank Watch" hint="Meeting tracker" />
        <Card title="Commitment of Traders" hint="COT positioning" />
      </div>
    </>
  );
}
