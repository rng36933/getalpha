import type { Locale } from "./locales.ts";

/**
 * Every word in the app's navigation chrome — the sidebar, the phone's bottom
 * bar and its "More" sheet, and the plan badge both of them show.
 *
 * Kept apart from `landing.ts`: that dictionary is one page, this one is
 * rendered on every signed-in page in the app, and folding the two together
 * would make a one-word change to a nav label touch a file whose shape is
 * about a completely different page.
 */
export type NavCopy = {
  items: {
    dashboard: string;
    macroDesk: string;
    journal: string;
    pairs: string;
    calendar: string;
    plans: string;
    referrals: string;
    support: string;
    settings: string;
  };
  more: string;
  closeMenu: string;
  morePages: string;
  main: string;
  /** "Pro" is the product's own name for the plan and is not translated. */
  planFree: string;
  /** Shown beside the avatar when Clerk has neither a name nor an email yet. */
  accountFallback: string;
};

const en: NavCopy = {
  items: {
    dashboard: "Dashboard",
    macroDesk: "Macro Desk",
    journal: "Journal",
    pairs: "Pairs",
    calendar: "Calendar",
    plans: "Plans",
    referrals: "Referrals",
    support: "Support",
    settings: "Settings",
  },
  more: "More",
  closeMenu: "Close menu",
  morePages: "More pages",
  main: "Main",
  planFree: "Free",
  accountFallback: "Account",
};

const lt: NavCopy = {
  items: {
    dashboard: "Apžvalga",
    macroDesk: "Makro stalas",
    journal: "Žurnalas",
    pairs: "Poros",
    calendar: "Kalendorius",
    plans: "Planai",
    referrals: "Rekomendacijos",
    support: "Pagalba",
    settings: "Nustatymai",
  },
  more: "Daugiau",
  closeMenu: "Uždaryti meniu",
  morePages: "Daugiau puslapių",
  main: "Pagrindinis",
  planFree: "Nemokamas",
  accountFallback: "Paskyra",
};

const NAV: Record<Locale, NavCopy> = { en, lt };

export function navCopy(locale: Locale): NavCopy {
  return NAV[locale];
}
