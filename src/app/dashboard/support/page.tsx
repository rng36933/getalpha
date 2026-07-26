import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import SupportForm from "@/components/SupportForm";

export const metadata = {
  title: "Support",
};

export default function SupportPage() {
  return (
    <>
      <PageHeader
        title="Support"
        subtitle="Report something broken, or tell us what would make this better."
      />

      <div className="max-w-2xl">
        <Card title="Send a message">
          <SupportForm />
        </Card>
      </div>
    </>
  );
}
