import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";

export default function JournalPage() {
  return (
    <>
      <PageHeader
        title="Journal"
        subtitle="Trade log, screenshots and post-trade review notes."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Trade Log" hint="Entries table" className="md:col-span-2 xl:col-span-3" height="h-72" />
        <Card title="Setup Breakdown" hint="Stats by setup" />
        <Card title="Mistake Tags" hint="Tag frequency" />
        <Card title="Review Notes" hint="Notes editor" />
      </div>
    </>
  );
}
