"use client";

import { useState } from "react";
import { referralCopy } from "@/lib/i18n/app/referral";
import type { Locale } from "@/lib/i18n/locales";

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
  locale: Locale;
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
  locale,
}: ReferralPanelProps) {
  const copy = referralCopy(locale);
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
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
        <p className="text-xs uppercase tracking-wider text-muted">{copy.yourLink}</p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={inviteUrl}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={copy.linkAriaLabel}
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2 font-mono text-xs text-muted outline-none"
          />
          <button
            type="button"
            onClick={copyToClipboard}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent/90"
          >
            {copied ? copy.copiedLabel : copy.copyLabel}
          </button>
        </div>

        <p className="mt-2 text-xs text-muted">
          {copy.codeLabel} <span className="font-mono text-foreground">{code}</span>
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-muted">{copy.progress}</p>
          <p className="text-xs text-muted">
            {copy.progressCount(progress, invitesPerReward)}
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
            ? copy.maxRewardsReachedNote(maxRewards, maxRewards * rewardDays)
            : invitesUntilNextReward === invitesPerReward && qualifiedInvites > 0
              ? copy.bonusEarnedNote(invitesPerReward, rewardDays)
              : copy.inviteMoreNote(invitesUntilNextReward, rewardDays)}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-surface-raised p-4">
          <dt className="text-xs text-muted">{copy.counted}</dt>
          <dd className="figure mt-1 text-2xl">
            {qualifiedInvites}
          </dd>
        </div>
        <div className="rounded-lg border border-line bg-surface-raised p-4">
          <dt className="text-xs text-muted">{copy.notCountingYet}</dt>
          <dd className="figure mt-1 text-2xl text-muted">
            {pendingInvites}
          </dd>
        </div>
      </dl>

      <p className="text-xs leading-relaxed text-muted">
        {copy.explanationLead} <em>{copy.explanationEmphasis}</em>{" "}
        {copy.explanationTail}
      </p>

      {activeReward ? (
        <p className="rounded-lg border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive">
          {copy.activeRewardNote(
            new Date(activeReward.expiresAt).toLocaleDateString(
              locale === "lt" ? "lt-LT" : "en-IE",
              { day: "numeric", month: "long", year: "numeric" },
            ),
          )}
        </p>
      ) : null}

      {rewards.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            {copy.bonusesEarned}
          </p>
          <ul className="mt-2 divide-y divide-line text-sm">
            {rewards.map((reward) => (
              <li
                key={reward.grantedAt}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="text-muted">
                  {new Date(reward.grantedAt).toLocaleDateString(
                    locale === "lt" ? "lt-LT" : "en-IE",
                  )}
                </span>
                <span className={reward.active ? "text-positive" : "text-muted"}>
                  {reward.active ? copy.active : copy.expired}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
