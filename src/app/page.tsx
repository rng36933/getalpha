import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import PriceChart from "@/components/PriceChart";
import { generateMockCandles } from "@/lib/mock-data";

export default function DashboardPage() {
  const candles = generateMockCandles({ count: 180, startPrice: 2320 });

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of the desk. Modules will be plugged into the cards below."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="XAUUSD · D1" className="md:col-span-2">
          <PriceChart data={candles} height={280} />
        </Card>
        <Card title="Equity Curve" hint="Chart module" height="h-56" />
        <Card
          title="Account Summary"
          hint="Balance / equity / drawdown"
          height="h-56"
        />
        <Card title="Open Positions" hint="Positions table" />
        <Card title="Signal Feed" hint="Live signal stream" />
        <Card title="Risk Exposure" hint="Exposure by symbol" />
        <Card title="Macro Snapshot" hint="Key macro readings" />
        <Card title="Recent Trades" hint="Closed trades list" />
        <Card title="Performance Stats" hint="Win rate / PF / expectancy" />
      </div>
    </>
  );
}
