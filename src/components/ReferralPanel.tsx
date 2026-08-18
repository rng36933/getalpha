"use client";

import { useState } from "react";

type ReferralPanelProps = {
  inviteUrl: string;
  code: string;
  qualifiedInvites: number;
  pendingInvites: number;
  invitesUntilNextReward: number;
  invitesPerReward: number;
  rewardDays: number;
  rewards: { grantedAt: string; expiresAt: string; active: boolean }[];
  /** Every bonus the programme offers has been earned. */
  maxRewardsReached: boolean;
  maxRewards: number;
};

export default function ReferralPanel({
  inviteUrl,
  code,
  qualifiedInvites,
  pendingInvites,
  invitesUntilNextReward,
  invitesPerReward,
  rewardDays,
  rewards,
  maxRewardsReached,
  maxRewards,
}: ReferralPanelProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the link is on screen to select.
      setCopied(false);
    }
  }

  const progress = qualifiedInvites % invitesPerReward;
  const activeReward = rewards.find((reward) => reward.active);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Your link</p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={inviteUrl}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="Your referral link"
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface-raised px-3 py-2 font-mono text-xs text-muted outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background shadow-[0_4px_20px_-4px_rgba(242,201,76,0.5)] transition-colors hover:bg-accent/90"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <p className="mt-2 text-xs text-muted">
          Code <span className="font-mono text-foreground">{code}</span>
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-muted">Progress</p>
          <p className="text-xs text-muted">
            {progress} of {invitesPerReward}
          </p>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={invitesPerReward}
          className="mt-2 flex gap-1.5"
        >
          {Array.from({ length: invitesPerReward }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index < progress ? "bg-accent" : "bg-surface-raised"
              }`}
            />
          ))}
        </div>

        <p className="mt-3 text-sm text-muted">
          {maxRewardsReached
            ? `You have earned all ${maxRewards} bonuses the programme offers — ${maxRewards * rewardDays} days in total. Further invites are still welcome; they no longer add days.`
            : invitesUntilNextReward === invitesPerReward && qualifiedInvites > 0
              ? `Bonus earned. Invite ${invitesPerReward} more for another ${rewardDays} days.`
              : `Invite ${invitesUntilNextReward} more ${
                  invitesUntilNextReward === 1 ? "person" : "people"
                } to earn ${rewardDays} days of Pro.`}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-line bg-surface-raised p-4">
          <dt className="text-xs text-muted">Counted</dt>
          <dd className="figure mt-1 text-2xl">
            {qualifiedInvites}
          </dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface-raised p-4">
          <dt className="text-xs text-muted">Not counting yet</dt>
          <dd className="figure mt-1 text-2xl text-muted">
            {pendingInvites}
          </dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-muted">
        An invite counts once that person has confirmed their email address{" "}
        <em>and</em> logged their first trade. The programme pays for people who
        turn up, not for registrations — and one mailbox counts once, however
        many addresses it can be spelled with.
      </p>

      {activeReward ? (
        <p className="rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive">
          Pro is active from a referral bonus until{" "}
          {new Date(activeReward.expiresAt).toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      ) : null}

      {rewards.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Bonuses earned
          </p>
          <ul className="mt-2 divide-y divide-line text-sm">
            {rewards.map((reward) => (
              <li
                key={reward.grantedAt}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="text-muted">
                  {new Date(reward.grantedAt).toLocaleDateString()}
                </span>
                <span className={reward.active ? "text-positive" : "text-muted"}>
                  {reward.active ? "Active" : "Expired"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
