import type { Locale } from "../locales.ts";
import { ltPlural } from "../plural.ts";

/**
 * Every word on the Pairs page and `PairAnalysis`.
 *
 * Series/instrument names themselves (`pair.asset`, e.g. "XAUUSD") are never
 * translated — they are the same proper nouns a Lithuanian trader already
 * reads in their broker's own platform.
 */
export type PairsCopy = {
  title: string;
  subtitleEmpty: string;
  subtitleWithData: string;
  cardTitle: string;
  loadFailed: string;
  emptyLine1: string;
  emptyLine2: string;
  connectMetaTrader: string;
  yourRecord: (asset: string) => string;
  calendarTitle: string;
  calendarTitleFor: (currencies: string) => string;
  noOwnCalendar: (asset: string) => string;
  stats: {
    trades: string;
    closedNote: (n: number) => string;
    winRate: string;
    needsScored: (n: number) => string;
    scoredNote: (n: number) => string;
    totalPnl: string;
    expectancy: string;
    perTrade: string;
    bestDay: string;
    worstDay: string;
    noDayUp: string;
    noDayDown: string;
    dayNote: (date: string, trades: number) => string;
    worstDayNote: (date: string, trades: number, worstSingle: string) => string;
    averageWinLoss: string;
    medianRisk: string;
  };
  riskNote: {
    times: (factor: number) => string;
    inLine: string;
  };
  summary: {
    stillOpen: (n: number) => string;
    withoutStop: (n: number) => string;
    withoutNotes: (n: number) => string;
  };
  buckets: {
    bySession: string;
    byWeekday: string;
    byPrior: string;
    trades: string;
    winRate: string;
    totalPnl: string;
    priorNote: string;
  };
};

const en: PairsCopy = {
  title: "Pairs",
  subtitleEmpty: "What your own record says about each instrument you trade.",
  subtitleWithData: "Counted from your own trades. Nothing here predicts anything.",
  cardTitle: "Per-pair record",
  loadFailed:
    "Your journal could not be read just now. Reload in a moment — nothing has been lost.",
  emptyLine1:
    "Nothing to break down yet. This page is built entirely from your journal — it has no opinion of its own about any pair.",
  emptyLine2:
    "Connect MetaTrader and ninety days of history arrives on the first sync, broken down per instrument.",
  connectMetaTrader: "Connect MetaTrader",
  yourRecord: (asset) => `${asset} — your record`,
  calendarTitle: "Today's calendar",
  calendarTitleFor: (currencies) => `Today's calendar for ${currencies}`,
  noOwnCalendar: (asset) =>
    `${asset} has no economic calendar of its own, and its quote currency is not one the feed publishes releases for.`,
  stats: {
    trades: "Trades",
    closedNote: (n) => `${n} closed`,
    winRate: "Win rate",
    needsScored: (n) => `needs ${n} scored trades`,
    scoredNote: (n) => `${n} scored`,
    totalPnl: "Total P&L",
    expectancy: "Expectancy",
    perTrade: "per trade",
    bestDay: "Best day",
    worstDay: "Worst day",
    noDayUp: "no day finished up",
    noDayDown: "no day finished down",
    dayNote: (date, trades) => `${date} · ${trades} trade${trades === 1 ? "" : "s"}`,
    worstDayNote: (date, trades, worstSingle) =>
      `${date} · ${trades} trade${trades === 1 ? "" : "s"} · worst single ${worstSingle}`,
    averageWinLoss: "Average win / loss",
    medianRisk: "Median risk",
  },
  riskNote: {
    times: (factor) => `${factor}× your usual stake`,
    inLine: "in line with the rest of your book",
  },
  summary: {
    stillOpen: (n) => `${n} still open, so not counted in any result above.`,
    withoutStop: (n) =>
      `${n} taken without a stop. They count towards every figure above, but nothing here can say whether the size was sensible — there was no risk defined to compare it against.`,
    withoutNotes: (n) =>
      `${n} carry no written note. The numbers can say when it went wrong, never why.`,
  },
  buckets: {
    bySession: "By session",
    byWeekday: "By weekday",
    byPrior: "By what came before",
    trades: "Trades",
    winRate: "Win rate",
    totalPnl: "Total P&L",
    priorNote:
      '"Before" means the previous trade anywhere in your journal, not only on this instrument — a loss on one pair is what you carry into the next one.',
  },
};

const lt: PairsCopy = {
  title: "Poros",
  subtitleEmpty: "Ką tavo paties įrašai sako apie kiekvieną instrumentą, kuriuo prekiauji.",
  subtitleWithData: "Suskaičiuota iš tavo pačio sandorių. Niekas čia nieko neprognozuoja.",
  cardTitle: "Įrašai pagal instrumentą",
  loadFailed:
    "Šiuo metu nepavyko perskaityti tavo žurnalo. Perkrauk po akimirkos — niekas nebuvo prarasta.",
  emptyLine1:
    "Kol kas nėra ko skaidyti. Šis puslapis sudarytas vien iš tavo žurnalo — jis neturi savos nuomonės apie jokią porą.",
  emptyLine2:
    "Prijunk MetaTrader, ir per pirmą sinchronizaciją atkeliaus 90 dienų istorija, suskirstyta pagal instrumentą.",
  connectMetaTrader: "Prijunk MetaTrader",
  yourRecord: (asset) => `${asset} — tavo įrašai`,
  calendarTitle: "Šiandienos kalendorius",
  calendarTitleFor: (currencies) => `Šiandienos kalendorius: ${currencies}`,
  noOwnCalendar: (asset) =>
    `${asset} neturi savo ekonominio kalendoriaus, o jo kotiruojama valiuta nėra tarp tų, kurioms šaltinis skelbia įvykius.`,
  stats: {
    trades: "Sandoriai",
    closedNote: (n) => `${n} uždaryta`,
    winRate: "Laimėjimų procentas",
    needsScored: (n) => `reikia ${n} įvertintų sandorių`,
    scoredNote: (n) => `${n} įvertinta`,
    totalPnl: "Bendras P&L",
    expectancy: "Lūkestis",
    perTrade: "vienam sandoriui",
    bestDay: "Geriausia diena",
    worstDay: "Blogiausia diena",
    noDayUp: "nė viena diena nebaigta pliuse",
    noDayDown: "nė viena diena nebaigta minuse",
    dayNote: (date, trades) =>
      `${date} · ${trades} ${ltPlural(trades, "sandoris", "sandoriai", "sandorių")}`,
    worstDayNote: (date, trades, worstSingle) =>
      `${date} · ${trades} ${ltPlural(trades, "sandoris", "sandoriai", "sandorių")} · didžiausias vienkartinis ${worstSingle}`,
    averageWinLoss: "Vidutinis laimėjimas / nuostolis",
    medianRisk: "Įprasta rizika",
  },
  riskNote: {
    times: (factor) => `${factor}× didesnė nei įprasta tavo statyta suma`,
    inLine: "atitinka likusią tavo knygą",
  },
  summary: {
    stillOpen: (n) => `${n} dar atviri, tad neįskaičiuoti į jokį rezultatą aukščiau.`,
    withoutStop: (n) =>
      `${n} atlikti be stop loss. Jie skaičiuojami į kiekvieną rodiklį aukščiau, bet nieko čia negalima pasakyti, ar dydis buvo pagrįstas — nebuvo apibrėžtos rizikos, su kuria lyginti.`,
    withoutNotes: (n) =>
      `${n} neturi jokios pastabos. Skaičiai gali pasakyti, kada nepasisekė, bet niekada — kodėl.`,
  },
  buckets: {
    bySession: "Pagal sesiją",
    byWeekday: "Pagal savaitės dieną",
    byPrior: "Pagal tai, kas buvo prieš tai",
    trades: "Sandoriai",
    winRate: "Laimėjimų procentas",
    totalPnl: "Bendras P&L",
    priorNote:
      "„Prieš tai“ reiškia ankstesnį sandorį bet kur tavo žurnale, ne tik šiame instrumente — nuostolis vienoje poroje yra tai, ką neši į kitą.",
  },
};

const PAIRS: Record<Locale, PairsCopy> = { en, lt };

export function pairsCopy(locale: Locale): PairsCopy {
  return PAIRS[locale];
}
