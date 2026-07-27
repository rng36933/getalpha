import type { Locale } from "../locales.ts";
import { ltPlural } from "../plural.ts";

/** Every word on the Referrals page: `ReferralPage` and `ReferralPanel.tsx`. */
export type ReferralCopy = {
  title: string;
  subtitle: string;
  subtitleWithCounts: (
    invitesPerReward: number,
    rewardDays: number,
    maxRewards: number,
  ) => string;
  signInPrompt: string;
  cardTitle: string;
  loadFailed: string;
  inviteLinkCardTitle: string;
  yourLink: string;
  linkAriaLabel: string;
  copyLabel: string;
  copiedLabel: string;
  codeLabel: string;
  progress: string;
  progressCount: (progress: number, total: number) => string;
  maxRewardsReachedNote: (maxRewards: number, totalDays: number) => string;
  bonusEarnedNote: (invitesPerReward: number, rewardDays: number) => string;
  inviteMoreNote: (invitesUntilNextReward: number, rewardDays: number) => string;
  counted: string;
  notCountingYet: string;
  explanationLead: string;
  explanationEmphasis: string;
  explanationTail: string;
  activeRewardNote: (expiresAt: string) => string;
  bonusesEarned: string;
  active: string;
  expired: string;
};

const en: ReferralCopy = {
  title: "Referrals",
  subtitle: "Invite people, earn Pro.",
  subtitleWithCounts: (invitesPerReward, rewardDays, maxRewards) =>
    `Invite ${invitesPerReward} people who confirm their email and log a trade, and get ${rewardDays} days of Pro — up to ${maxRewards} times.`,
  signInPrompt: "Sign in to see your invite link.",
  cardTitle: "Referrals",
  loadFailed:
    "Your referral details could not be loaded just now. Reload in a moment — nothing has been lost.",
  inviteLinkCardTitle: "Your invite link",
  yourLink: "Your link",
  linkAriaLabel: "Your referral link",
  copyLabel: "Copy",
  copiedLabel: "Copied",
  codeLabel: "Code",
  progress: "Progress",
  progressCount: (progress, total) => `${progress} of ${total}`,
  maxRewardsReachedNote: (maxRewards, totalDays) =>
    `You have earned all ${maxRewards} bonuses the programme offers — ${totalDays} days in total. Further invites are still welcome; they no longer add days.`,
  bonusEarnedNote: (invitesPerReward, rewardDays) =>
    `Bonus earned. Invite ${invitesPerReward} more for another ${rewardDays} days.`,
  inviteMoreNote: (invitesUntilNextReward, rewardDays) =>
    `Invite ${invitesUntilNextReward} more ${
      invitesUntilNextReward === 1 ? "person" : "people"
    } to earn ${rewardDays} days of Pro.`,
  counted: "Counted",
  notCountingYet: "Not counting yet",
  explanationLead: "An invite counts once that person has confirmed their email address",
  explanationEmphasis: "and",
  explanationTail:
    "logged their first trade. The programme pays for people who turn up, not for registrations — and one mailbox counts once, however many addresses it can be spelled with.",
  activeRewardNote: (expiresAt) => `Pro is active from a referral bonus until ${expiresAt}.`,
  bonusesEarned: "Bonuses earned",
  active: "Active",
  expired: "Expired",
};

const lt: ReferralCopy = {
  title: "Rekomendacijos",
  subtitle: "Kviesk žmones, gauk Pro.",
  subtitleWithCounts: (invitesPerReward, rewardDays, maxRewards) =>
    `Pakviesk ${invitesPerReward} ${ltPlural(invitesPerReward, "žmogų", "žmones", "žmonių")}, kurie patvirtins el. paštą ir įrašys sandorį, ir gauk ${rewardDays} ${ltPlural(rewardDays, "dieną", "dienas", "dienų")} Pro — iki ${maxRewards} ${ltPlural(maxRewards, "karto", "kartų", "kartų")}.`,
  signInPrompt: "Prisijunk, kad pamatytum savo kvietimo nuorodą.",
  cardTitle: "Rekomendacijos",
  loadFailed:
    "Šiuo metu nepavyko įkelti tavo rekomendacijų duomenų. Perkrauk po akimirkos — niekas nebuvo prarasta.",
  inviteLinkCardTitle: "Tavo kvietimo nuoroda",
  yourLink: "Tavo nuoroda",
  linkAriaLabel: "Tavo rekomendacijos nuoroda",
  copyLabel: "Kopijuoti",
  copiedLabel: "Nukopijuota",
  codeLabel: "Kodas",
  progress: "Pažanga",
  progressCount: (progress, total) => `${progress} iš ${total}`,
  maxRewardsReachedNote: (maxRewards, totalDays) =>
    `Tu jau uždirbai visus ${maxRewards} programos siūlomus premijų ${ltPlural(maxRewards, "kartą", "kartus", "kartų")} — iš viso ${totalDays} ${ltPlural(totalDays, "dieną", "dienas", "dienų")}. Tolesni kvietimai vis tiek laukiami; jie tiesiog nebepridės dienų.`,
  bonusEarnedNote: (invitesPerReward, rewardDays) =>
    `Premija gauta. Pakviesk dar ${invitesPerReward} ir gauk dar ${rewardDays} ${ltPlural(rewardDays, "dieną", "dienas", "dienų")}.`,
  inviteMoreNote: (invitesUntilNextReward, rewardDays) =>
    `Pakviesk dar ${invitesUntilNextReward} ${ltPlural(invitesUntilNextReward, "žmogų", "žmones", "žmonių")} ir gauk ${rewardDays} ${ltPlural(rewardDays, "dieną", "dienas", "dienų")} Pro.`,
  counted: "Įskaityta",
  notCountingYet: "Dar neįskaityta",
  explanationLead: "Kvietimas įskaitomas, kai tas žmogus patvirtina savo el. pašto adresą",
  explanationEmphasis: "ir",
  explanationTail:
    "įrašo pirmą sandorį. Programa apdovanoja už žmones, kurie realiai ateina, o ne už registracijas — o viena pašto dėžutė įskaitoma vieną kartą, kad ir kiek adresų ja galima parašyti.",
  activeRewardNote: (expiresAt) => `Pro aktyvus dėl rekomendacijos premijos iki ${expiresAt}.`,
  bonusesEarned: "Gautos premijos",
  active: "Aktyvi",
  expired: "Pasibaigusi",
};

const REFERRAL: Record<Locale, ReferralCopy> = { en, lt };

export function referralCopy(locale: Locale): ReferralCopy {
  return REFERRAL[locale];
}
