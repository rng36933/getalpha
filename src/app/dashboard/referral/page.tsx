import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import ReferralPanel from "@/components/ReferralPanel";
import { referralCopy } from "@/lib/i18n/app/referral";
import { getLocale } from "@/lib/i18n/server";
import {
  INVITES_PER_REWARD,
  MAX_REWARDS,
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
  const locale = await getLocale();
  const copy = referralCopy(locale);

  if (!userId) {
    return (
      <>
        <PageHeader title={copy.title} subtitle={copy.subtitle} />
        <Card title={copy.cardTitle}>
          <p className="text-sm text-muted">{copy.signInPrompt}</p>
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
        <PageHeader title={copy.title} subtitle={copy.subtitle} />
        <Card title={copy.cardTitle}>
          <p className="text-sm text-muted">{copy.loadFailed}</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitleWithCounts(INVITES_PER_REWARD, REWARD_DAYS, MAX_REWARDS)}
      />

      <div className="max-w-2xl">
        <Card title={copy.inviteLinkCardTitle}>
          <ReferralPanel
            inviteUrl={`${appOrigin()}/?ref=${status.code}`}
            code={status.code}
            qualifiedInvites={status.qualifiedInvites}
            pendingInvites={status.pendingInvites}
            invitesUntilNextReward={status.invitesUntilNextReward}
            invitesPerReward={INVITES_PER_REWARD}
            rewardDays={REWARD_DAYS}
            maxRewards={MAX_REWARDS}
            maxRewardsReached={status.maxRewardsReached}
            rewards={status.rewards.map((reward) => ({
              grantedAt: reward.grantedAt.toISOString(),
              expiresAt: reward.expiresAt.toISOString(),
              active: reward.active,
            }))}
            locale={locale}
          />
        </Card>
      </div>
    </>
  );
}
