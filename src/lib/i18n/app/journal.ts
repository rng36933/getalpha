import type { Locale } from "../locales.ts";

/**
 * Every word on the Journal page: the page itself, `NotesPrompt`,
 * `TradeNotes`, `TradeList` (filters, table, pager, the reviews-remaining
 * banner) and the chrome around `CoachReviewPanel`.
 *
 * The Coach's own written review — `headline`, `scorecard[*].note`,
 * `primaryLeak.evidence`, `strengths`, `ruleForNextTime`, `missingData` — is
 * deliberately absent. That text comes from the model and stays English
 * regardless of the reader's language; only the labels printed around it
 * (`Scorecard`, `Strengths`, rating words) are translated here.
 */
export type JournalCopy = {
  header: { title: string; subtitle: string };
  tiles: { closed: string; totalPnl: string; winRate: string; average: string };
  tradeLogTitle: string;
  loadFailed: string;
  noTradesYet: string;
  notesPrompt: {
    noneExplained: (total: number) => string;
    someExplained: (withNotes: number, total: number) => string;
    heading: string;
    bodyLead: string;
    bodyEmphasis: string;
    reasons: [string, string, string];
    footerLead: string;
    footerButton: string;
    footerTail: string;
  };
  tradeNotes: {
    setup: string;
    timeframe: string;
    marketContext: string;
    marketContextHint: string;
    howItFelt: string;
    howItFeltHint: string;
    saving: string;
    save: string;
    saved: string;
    couldNotSave: string;
    couldNotReach: string;
  };
  reviewsBanner: {
    ofEstimate: (n: number) => string;
    none: string;
    resets: string;
  };
  filters: {
    outcomeAria: string;
    all: string;
    wins: string;
    losses: string;
    open: string;
    noStop: string;
    instrumentAria: string;
    everyInstrument: string;
    setupAria: string;
    everySetup: string;
    filteredCount: (shown: number, total: number) => string;
    noMatches: string;
    clear: string;
  };
  table: {
    date: string;
    instrument: string;
    side: string;
    setup: string;
    risk: string;
    plannedRR: string;
    exit: string;
    result: string;
    notes: string;
    review: string;
    mt5Badge: string;
    mt5Title: string;
    buy: string;
    sell: string;
    noStop: string;
    exitLabels: {
      target: string;
      stop: string;
      discretionary: string;
      pastTarget: string;
      pastStop: string;
      openTrade: string;
      unknown: string;
    };
    close: string;
    addNotes: string;
    editNotes: string;
    reviewing: string;
    hide: string;
    show: string;
    mt5NotesHint: string;
    reviewLoading: string;
    seePlans: string;
    genericError: string;
    couldNotReach: string;
  };
  pager: {
    ariaLabel: string;
    range: (from: number, to: number, total: number) => string;
    pageAria: (n: number) => string;
    previous: string;
    next: string;
  };
  coachPanel: {
    verdict: { sound: string; mixed: string; broken: string };
    rating: { strong: string; adequate: string; weak: string; notAssessable: string };
    scorecard: string;
    dimensions: {
      tradeSelection: string;
      positionSizing: string;
      stopPlacement: string;
      exitManagement: string;
      planAdherence: string;
      emotionalControl: string;
    };
    primaryLeak: string;
    strengths: string;
    ruleForNextTime: string;
    limitedByMissingData: string;
  };
};

const en: JournalCopy = {
  header: {
    title: "Journal",
    subtitle: "Every closed trade, straight from your terminal. Nothing here is typed by hand.",
  },
  tiles: {
    closed: "Closed trades",
    totalPnl: "Total P&L",
    winRate: "Win rate",
    average: "Average",
  },
  tradeLogTitle: "Trade log",
  loadFailed:
    "Your trades could not be loaded just now. Reload in a moment — nothing has been lost.",
  noTradesYet:
    "No trades yet. Connect MetaTrader from the dashboard and ninety days of history arrives on the first sync.",
  notesPrompt: {
    noneExplained: (total) => `${total} trades, none of them explained`,
    someExplained: (withNotes, total) => `${withNotes} of ${total} trades carry a note`,
    heading: "Your terminal sent what you did. Only you can say why.",
    bodyLead:
      "Every number here arrived by itself, and that is most of the work — but it is also the part of a trade that says the least about the decision behind it. ",
    bodyEmphasis:
      "A review with your reasoning in front of it is a different document from one without.",
    reasons: [
      "The review can only judge what it can see. Sizing and exits it reads from the numbers; whether you followed your own plan it can only read from you.",
      "One sentence is enough. What you saw, and what you meant to do — written while you still remember, not reconstructed later.",
      "Patterns need a few dozen before they say anything. The trades you note this month are what next month's review has to work with.",
    ],
    footerLead: "Press",
    footerButton: "Notes",
    footerTail: "on any row below. Four fields, all optional, and a sync never overwrites them.",
  },
  tradeNotes: {
    setup: "Setup",
    timeframe: "Timeframe",
    marketContext: "Market context",
    marketContextHint:
      "What was true before the entry — the level, the session, the release due.",
    howItFelt: "How it felt",
    howItFeltHint:
      "Impatience, hesitation, revenge after a loss. The review reads this as your own words, not as a diagnosis.",
    saving: "Saving…",
    save: "Save notes",
    saved: "Saved.",
    couldNotSave: "The notes could not be saved.",
    couldNotReach: "Could not reach the server. Check your connection.",
  },
  reviewsBanner: {
    ofEstimate: (n) => `of ~${n} AI reviews left today`,
    none: "No AI reviews left today",
    resets: "resets",
  },
  filters: {
    outcomeAria: "Filter by outcome",
    all: "All",
    wins: "Wins",
    losses: "Losses",
    open: "Open",
    noStop: "No stop",
    instrumentAria: "Filter by instrument",
    everyInstrument: "Every instrument",
    setupAria: "Filter by setup",
    everySetup: "Every setup",
    filteredCount: (shown, total) => `${shown} of ${total}`,
    noMatches: "No trades match those filters.",
    clear: "Clear them",
  },
  table: {
    date: "Date",
    instrument: "Instrument",
    side: "Side",
    setup: "Setup",
    risk: "Risk",
    plannedRR: "Planned RR",
    exit: "Exit",
    result: "Result",
    notes: "Notes",
    review: "Review",
    mt5Badge: "MT5",
    mt5Title: "Synced from MetaTrader. The prices belong to the terminal; the notes are yours.",
    buy: "Buy",
    sell: "Sell",
    noStop: "no stop",
    exitLabels: {
      target: "Target",
      stop: "Stop",
      discretionary: "Discretionary",
      pastTarget: "Past target",
      pastStop: "Past stop",
      openTrade: "Open",
      unknown: "—",
    },
    close: "Close",
    addNotes: "Add notes",
    editNotes: "Notes",
    reviewing: "Reviewing…",
    hide: "Hide",
    show: "Show",
    mt5NotesHint:
      "MetaTrader sends the prices and can never send the reason. What you write here is the half the review cannot compute.",
    reviewLoading: "Reading the trade against your history. This takes about half a minute.",
    seePlans: "See the plans",
    genericError: "The review could not be produced. Try again.",
    couldNotReach: "Could not reach the server. Check your connection.",
  },
  pager: {
    ariaLabel: "Journal pages",
    range: (from, to, total) => `${from}–${to} of ${total}`,
    pageAria: (n) => `Page ${n}`,
    previous: "Previous",
    next: "Next",
  },
  coachPanel: {
    verdict: {
      sound: "Process sound",
      mixed: "Process mixed",
      broken: "Process broken",
    },
    rating: {
      strong: "Strong",
      adequate: "Adequate",
      weak: "Weak",
      notAssessable: "Not assessable",
    },
    scorecard: "Scorecard",
    dimensions: {
      tradeSelection: "Trade selection",
      positionSizing: "Position sizing",
      stopPlacement: "Stop placement",
      exitManagement: "Exit management",
      planAdherence: "Plan adherence",
      emotionalControl: "Emotional control",
    },
    primaryLeak: "Primary leak",
    strengths: "Strengths",
    ruleForNextTime: "Rule for next time",
    limitedByMissingData: "Limited by missing data",
  },
};

const lt: JournalCopy = {
  header: {
    title: "Žurnalas",
    subtitle:
      "Kiekvienas uždarytas sandoris, tiesiai iš tavo terminalo. Nieko čia neįvesta ranka.",
  },
  tiles: {
    closed: "Uždaryti sandoriai",
    totalPnl: "Bendras P&L",
    winRate: "Laimėjimų procentas",
    average: "Vidurkis",
  },
  tradeLogTitle: "Sandorių žurnalas",
  loadFailed:
    "Šiuo metu nepavyko įkelti tavo sandorių. Perkrauk po akimirkos — niekas nebuvo prarasta.",
  noTradesYet:
    "Kol kas nėra sandorių. Prijunk MetaTrader valdymo skydelyje, ir per pirmą sinchronizaciją atkeliaus 90 dienų istorija.",
  notesPrompt: {
    noneExplained: (total) => `${total} sandoriai, nė vienas nepaaiškintas`,
    someExplained: (withNotes, total) => `${withNotes} iš ${total} sandorių turi pastabą`,
    heading: "Terminalas atsiuntė, ką padarei. Tik tu gali pasakyti, kodėl.",
    bodyLead:
      "Kiekvienas skaičius čia atsirado pats, ir tai dauguma darbo — bet tai ir dalis, mažiausiai pasakanti apie sprendimą už jos. ",
    bodyEmphasis:
      "Analizė su tavo paaiškinimu priešais yra visiškai kitoks dokumentas nei be jo.",
    reasons: [
      "Analizė gali vertinti tik tai, ką mato. Dydį ir išėjimą ji skaito iš skaičių; ar laikeisi savo paties plano, ji gali sužinoti tik iš tavęs.",
      "Užtenka vieno sakinio. Ką matei ir ką ketinai daryti — parašyta, kol dar atsimeni, o ne atkurta vėliau.",
      "Dėsniams reikia kelių dešimčių, kad būtų ką pasakyti. Šio mėnesio pastabos yra tai, su kuo dirbs kito mėnesio analizė.",
    ],
    footerLead: "Spausk",
    footerButton: "Pastabos",
    footerTail:
      "prie bet kurios eilutės žemiau. Keturi laukai, visi neprivalomi, ir sinchronizacija jų niekada neperrašo.",
  },
  tradeNotes: {
    setup: "Setupas",
    timeframe: "Laikotarpis",
    marketContext: "Rinkos kontekstas",
    marketContextHint:
      "Kas buvo tiesa prieš įėjimą — lygis, sesija, artėjantis įvykis.",
    howItFelt: "Kaip jauteisi",
    howItFeltHint:
      "Nekantrumas, dvejonė, kerštas po nuostolio. Analizė tai skaito kaip tavo paties žodžius, ne kaip diagnozę.",
    saving: "Saugoma…",
    save: "Išsaugoti pastabas",
    saved: "Išsaugota.",
    couldNotSave: "Pastabų išsaugoti nepavyko.",
    couldNotReach: "Nepavyko pasiekti serverio. Patikrink ryšį.",
  },
  reviewsBanner: {
    ofEstimate: (n) => `iš ~${n} AI analizių liko šiandien`,
    none: "Šiandien AI analizių nebeliko",
    resets: "atsinaujina",
  },
  filters: {
    outcomeAria: "Filtruoti pagal rezultatą",
    all: "Visi",
    wins: "Laimėti",
    losses: "Pralaimėti",
    open: "Atviri",
    noStop: "Be stop loss",
    instrumentAria: "Filtruoti pagal instrumentą",
    everyInstrument: "Visi instrumentai",
    setupAria: "Filtruoti pagal setupą",
    everySetup: "Visi setupai",
    filteredCount: (shown, total) => `${shown} iš ${total}`,
    noMatches: "Nė vienas sandoris neatitinka šių filtrų.",
    clear: "Išvalyti juos",
  },
  table: {
    date: "Data",
    instrument: "Instrumentas",
    side: "Kryptis",
    setup: "Setupas",
    risk: "Rizika",
    plannedRR: "Planuotas RR",
    exit: "Išėjimas",
    result: "Rezultatas",
    notes: "Pastabos",
    review: "Analizė",
    mt5Badge: "MT5",
    mt5Title:
      "Sinchronizuota iš MetaTrader. Kainos priklauso terminalui; pastabos — tavo.",
    buy: "Pirkti",
    sell: "Parduoti",
    noStop: "nėra stop loss",
    exitLabels: {
      target: "Tikslas",
      stop: "Stop loss",
      discretionary: "Savarankiškas",
      pastTarget: "Už tikslo",
      pastStop: "Už stop loss",
      openTrade: "Atviras",
      unknown: "—",
    },
    close: "Uždaryti",
    addNotes: "Pridėti pastabas",
    editNotes: "Pastabos",
    reviewing: "Analizuojama…",
    hide: "Slėpti",
    show: "Rodyti",
    mt5NotesHint:
      "MetaTrader siunčia kainas ir niekada negali atsiųsti priežasties. Tai, ką čia parašai, yra ta analizės pusė, kurios negalima apskaičiuoti.",
    reviewLoading: "Skaitomas sandoris tavo istorijos fone. Tai užtrunka apie pusę minutės.",
    seePlans: "Žiūrėk planus",
    genericError: "Analizės parengti nepavyko. Bandyk dar kartą.",
    couldNotReach: "Nepavyko pasiekti serverio. Patikrink ryšį.",
  },
  pager: {
    ariaLabel: "Žurnalo puslapiai",
    range: (from, to, total) => `${from}–${to} iš ${total}`,
    pageAria: (n) => `Puslapis ${n}`,
    previous: "Atgal",
    next: "Toliau",
  },
  coachPanel: {
    verdict: {
      sound: "Procesas pagrįstas",
      mixed: "Procesas nevienalytis",
      broken: "Procesas ydingas",
    },
    rating: {
      strong: "Stipru",
      adequate: "Pakankama",
      weak: "Silpna",
      notAssessable: "Neįvertinama",
    },
    scorecard: "Vertinimo lentelė",
    dimensions: {
      tradeSelection: "Sandorio pasirinkimas",
      positionSizing: "Pozicijos dydis",
      stopPlacement: "Stop loss vieta",
      exitManagement: "Išėjimo valdymas",
      planAdherence: "Plano laikymasis",
      emotionalControl: "Emocijų valdymas",
    },
    primaryLeak: "Pagrindinė spraga",
    strengths: "Stiprybės",
    ruleForNextTime: "Taisyklė kitam kartui",
    limitedByMissingData: "Ribojama trūkstamų duomenų",
  },
};

const JOURNAL: Record<Locale, JournalCopy> = { en, lt };

export function journalCopy(locale: Locale): JournalCopy {
  return JOURNAL[locale];
}
