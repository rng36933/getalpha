import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import SupportForm from "@/components/SupportForm";
import SupportInbox, { type Ticket } from "@/components/SupportInbox";
import { supportCopy } from "@/lib/i18n/app/support";
import { getLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { isSupportReader } from "@/lib/support/admin";

export const metadata = {
  title: "Support",
};

/** Recent first, open before closed, and capped so the page stays a page. */
async function loadInbox(): Promise<Ticket[]> {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return tickets.map((ticket) => ({
    id: ticket.id,
    kind: ticket.kind,
    message: ticket.message,
    pageUrl: ticket.pageUrl,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
  }));
}

export default async function SupportPage() {
  const { userId } = await auth();
  const canRead = isSupportReader(userId);
  const locale = await getLocale();
  const copy = supportCopy(locale);

  let tickets: Ticket[] = [];
  let inboxFailed = false;

  if (canRead) {
    try {
      tickets = await loadInbox();
    } catch (error) {
      console.error("Could not load the support inbox:", error);
      inboxFailed = true;
    }
  }

  const open = tickets.filter((ticket) => ticket.status === "OPEN").length;

  return (
    <>
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      <div className="max-w-2xl space-y-4">
        <Card title={copy.sendMessageCardTitle}>
          <SupportForm locale={locale} />
        </Card>

        {canRead ? (
          <Card
            title={
              open > 0 ? copy.inboxCardTitleWithCount(open) : copy.inboxCardTitle
            }
          >
            {inboxFailed ? (
              <p className="py-8 text-center text-sm text-muted">
                {copy.inboxLoadFailed}
              </p>
            ) : (
              <SupportInbox tickets={tickets} locale={locale} />
            )}
          </Card>
        ) : null}
      </div>
    </>
  );
}
