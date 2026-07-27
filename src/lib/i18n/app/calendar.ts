import type { Locale } from "../locales.ts";
import { ltPlural } from "../plural.ts";

/**
 * Every word on the Calendar page: `CalendarPage` itself, `EconomicCalendar`
 * (the table), and `CalendarView` (the watchlist-filter toggle).
 *
 * `event.title` and `event.currency` are feed data, not UI copy, and are
 * never translated — same rule as the AI-generated text elsewhere.
 */
export type CalendarCopy = {
  title: string;
  subtitle: string;
  calendarSourceLabel: string;
  calendarCardTitle: string;
  highImpactCardTitle: string;
  noEventsToday: string;
  nothingHighImpactForCurrencies: string;
  nothingHighImpact: string;
  columns: {
    when: string;
    ccy: string;
    event: string;
    impact: string;
    actual: string;
    forecast: string;
    previous: string;
  };
  impact: {
    high: string;
    medium: string;
    low: string;
  };
  view: {
    myWatchlist: string;
    allCurrencies: string;
    nothingForFollowed: string;
    showAll: (n: number) => string;
    hiddenNote: (n: number) => string;
  };
};

const en: CalendarCopy = {
  title: "Calendar",
  subtitle: "Today's releases, in your timezone, for the currencies you trade.",
  calendarSourceLabel: "Economic calendar",
  calendarCardTitle: "Economic calendar",
  highImpactCardTitle: "High impact today",
  noEventsToday: "No releases scheduled today.",
  nothingHighImpactForCurrencies: "Nothing high-impact for your currencies today.",
  nothingHighImpact: "Nothing high-impact scheduled today.",
  columns: {
    when: "When",
    ccy: "Ccy",
    event: "Event",
    impact: "Impact",
    actual: "Act",
    forecast: "Fcst",
    previous: "Prev",
  },
  impact: {
    high: "High",
    medium: "Medium",
    low: "Low",
  },
  view: {
    myWatchlist: "My watchlist",
    allCurrencies: "All currencies",
    nothingForFollowed: "Nothing today for the currencies you follow.",
    showAll: (n) => `Show all ${n}`,
    hiddenNote: (n) =>
      `${n} release${n === 1 ? "" : "s"} hidden for currencies you do not follow.`,
  },
};

const lt: CalendarCopy = {
  title: "Kalendorius",
  subtitle:
    "Šiandienos paskelbimai tavo laiko juostoje, valiutoms, kuriomis prekiauji.",
  calendarSourceLabel: "Ekonominis kalendorius",
  calendarCardTitle: "Ekonominis kalendorius",
  highImpactCardTitle: "Šiandien svarbūs įvykiai",
  noEventsToday: "Šiandien paskelbimų nenumatyta.",
  nothingHighImpactForCurrencies:
    "Šiandien nėra svarbių įvykių tavo sekamoms valiutoms.",
  nothingHighImpact: "Šiandien nenumatyta jokių svarbių įvykių.",
  columns: {
    when: "Kada",
    ccy: "Valiuta",
    event: "Įvykis",
    impact: "Svarba",
    actual: "Faktas",
    forecast: "Progn.",
    previous: "Ankst.",
  },
  impact: {
    high: "Aukšta",
    medium: "Vidutinė",
    low: "Žema",
  },
  view: {
    myWatchlist: "Mano stebimieji",
    allCurrencies: "Visos valiutos",
    nothingForFollowed: "Šiandien nėra nieko valiutoms, kurias seki.",
    showAll: (n) => `Rodyti visus ${n}`,
    hiddenNote: (n) =>
      `${n} ${ltPlural(n, "paskelbimas paslėptas", "paskelbimai paslėpti", "paskelbimų paslėpta")} valiutoms, kurių neseki.`,
  },
};

const CALENDAR: Record<Locale, CalendarCopy> = { en, lt };

export function calendarCopy(locale: Locale): CalendarCopy {
  return CALENDAR[locale];
}
