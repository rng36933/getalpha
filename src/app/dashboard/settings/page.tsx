import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import EmailPreferences from "@/components/EmailPreferences";
import PageHeader from "@/components/PageHeader";
import { checkAccess } from "@/lib/billing/subscription";
import { prisma } from "@/lib/prisma";

async function loadPreference(userId: string): Promise<boolean> {
  try {
    const row = await prisma.emailPreference.findUnique({ where: { userId } });
    return row?.dailyBrief ?? false;
  } catch (error) {
    // A settings page that fails to load is worse than one that shows the
    // default: the user can still set it, and the save is what matters.
    console.error("Could not read email preferences:", error);
    return false;
  }
}

export default async function SettingsPage() {
  const { userId } = await auth();

  const [dailyBrief, access] = await Promise.all([
    userId ? loadPreference(userId) : Promise.resolve(false),
    userId ? checkAccess(userId) : Promise.resolve({ allowed: false } as const),
  ]);

  return (
    <>
      <PageHeader title="Settings" subtitle="Email and account preferences." />

      <div className="grid max-w-2xl grid-cols-1 gap-4">
        <Card title="Email">
          <EmailPreferences
            initialDailyBrief={dailyBrief}
            entitled={access.allowed}
          />
        </Card>
      </div>
    </>
  );
}
