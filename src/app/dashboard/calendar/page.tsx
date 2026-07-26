import Card from "@/components/Card";
import DataQualityNotice from "@/components/DataQualityNotice";
import EconomicCalendar from "@/components/EconomicCalendar";
import PageHeader from "@/components/PageHeader";
import { fetchEconomicCalendar } from "@/lib/market-data/calendar";
import { toEconomicEvents } from "@/lib/market-data/display";

export default async function CalendarPage() {
  // `fetchEconomicCalendar` resolves to stored events when the feed is down and
  // to an empty list when there is nothing stored either — it never rejects, so
  // the page renders whatever is available rather than an error screen.
  const calendar = await fetchEconomicCalendar();
  const events = toEconomicEvents(calendar.data);

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Economic events and scheduled releases."
      />

      <DataQualityNotice
        sources={[{ label: "Economic calendar", result: calendar }]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Economic Calendar" className="xl:col-span-2">
          <EconomicCalendar events={events} />
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card title="Today's Events" hint="High-impact only" />
          <Card title="Event Impact" hint="Historical reaction" />
        </div>
      </div>
    </>
  );
}
