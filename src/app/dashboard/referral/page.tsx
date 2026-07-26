import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import ReferralPanel from "@/components/ReferralPanel";
import {
  INVITES_PER_REWARD,
  REWARD_DAYS,
  referralStatus,
} from "@/lib/referral/program";

export const metadata = {
  title: "Referrals · getALPHA",
};

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.getalpha.org").replace(
    /\/$/,
    "",
  );
}

export default async function ReferralPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <>
        <PageHeader title="Referrals" subtitle="Invite people, earn Pro." />
        <Card title="Referrals">
          <p className="text-sm text-muted">Sign in to see your invite link.</p>
        </Card>
      </>
    );
  }

  let status;

  try {
    // Reading the page is also what grants a bonus that has been earned, which
    // is why this can fail: it talks to the identity provider to check which
    // invited accounts have confirmed their address.
    status = await referralStatus(userId);
  } catch (error) {
    console.error("Could not load referral status:", error);

    return (
      <>
        <PageHeader title="Referrals" subtitle="Invite people, earn Pro." />
        <Card title="Referrals">
          <p className="text-sm text-muted">
            Your referral details could not be loaded just now. Reload in a
            moment — nothing has been lost.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Referrals"
        subtitle={`Invite ${INVITES_PER_REWARD} people who confirm their email and get ${REWARD_DAYS} days of Pro.`}
      />

      <div className="max-w-2xl">
        <Card title="Your invite link">
          <ReferralPanel
            inviteUrl={`${appOrigin()}/?ref=${status.code}`}
            code={status.code}
            qualifiedInvites={status.qualifiedInvites}
            pendingInvites={status.pendingInvites}
            invitesUntilNextReward={status.invitesUntilNextReward}
            invitesPerReward={INVITES_PER_REWARD}
            rewardDays={REWARD_DAYS}
            rewards={status.rewards.map((reward) => ({
              grantedAt: reward.grantedAt.toISOString(),
              expiresAt: reward.expiresAt.toISOString(),
              active: reward.active,
            }))}
          />
        </Card>
      </div>
    </>
  );
}
