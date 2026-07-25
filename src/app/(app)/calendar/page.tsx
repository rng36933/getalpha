import Card from "@/components/Card";
import EconomicCalendar from "@/components/EconomicCalendar";
import PageHeader from "@/components/PageHeader";
import { mockEconomicEvents } from "@/lib/mock-data";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Economic events and scheduled releases."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Economic Calendar" className="xl:col-span-2">
          <EconomicCalendar events={mockEconomicEvents} />
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card title="Today's Events" hint="High-impact only" />
          <Card title="Event Impact" hint="Historical reaction" />
        </div>
      </div>
    </>
  );
}
