import type { Locale } from "../locales.ts";

/**
 * Words used by components that appear on more than one page of the signed-in
 * app — currently just `DataQualityNotice`, shown on Dashboard, Calendar and
 * Macro Desk.
 *
 * Split from any single page's dictionary for the reason `nav.ts` is split
 * from `landing.ts`: a component reused across pages needs one definition, not
 * one copy per page that could drift.
 */
export type SharedCopy = {
  dataQuality: {
    heading: string;
    cachedLine: (label: string, age: string) => string;
    unavailableLine: (label: string) => string;
    nothingGuessed: string;
    unknownAge: string;
    momentsAgo: string;
    minutesAgo: (n: number) => string;
    hourAgo: string;
    hoursAgo: (n: number) => string;
  };
};

const en: SharedCopy = {
  dataQuality: {
    heading: "Data may be temporarily incomplete or out of date",
    cachedLine: (label, age) =>
      `${label}: provider unreachable, showing the last stored data (${age}).`,
    unavailableLine: (label) =>
      `${label}: provider unreachable and nothing stored for today, so nothing is shown.`,
    nothingGuessed:
      "Nothing is being guessed — a missing source is left blank rather than filled in.",
    unknownAge: "unknown age",
    momentsAgo: "moments ago",
    minutesAgo: (n) => `${n} min ago`,
    hourAgo: "1 hour ago",
    hoursAgo: (n) => `${n} hours ago`,
  },
};

const lt: SharedCopy = {
  dataQuality: {
    heading: "Duomenys gali būti laikinai neišsamūs arba pasenę",
    cachedLine: (label, age) =>
      `${label}: šaltinis nepasiekiamas, rodomi paskutiniai išsaugoti duomenys (${age}).`,
    unavailableLine: (label) =>
      `${label}: šaltinis nepasiekiamas ir šiandien nieko neišsaugota, tad nieko nerodoma.`,
    nothingGuessed:
      "Niekas nespėliojama — trūkstamas šaltinis paliekamas tuščias, o ne užpildomas.",
    unknownAge: "amžius nežinomas",
    momentsAgo: "prieš akimirką",
    minutesAgo: (n) => `prieš ${n} min.`,
    hourAgo: "prieš 1 val.",
    hoursAgo: (n) => `prieš ${n} val.`,
  },
};

const SHARED: Record<Locale, SharedCopy> = { en, lt };

export function sharedCopy(locale: Locale): SharedCopy {
  return SHARED[locale];
}
