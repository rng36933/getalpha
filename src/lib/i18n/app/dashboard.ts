import type { Locale } from "../locales.ts";

/**
 * Every word on the Dashboard page and the components only it uses:
 * `DeskCards`, `FirstRun`, `PairNews`, `ChartCard`, `Mt5Prompt`,
 * `SessionBriefPanel`, `WatchlistManager`, `PnlCurve`, `PnlDistribution`.
 *
 * `DataQualityNotice` is not here — it also appears on Calendar and Macro
 * Desk, so it lives in `shared.ts` instead.
 *
 * AI-written text is deliberately absent from this file. The Session Brief's
 * `riskTone.reason`, `keyMarketDriver` and `watchlistVolatilityWarning` come
 * from the model and stay English regardless of the reader's language — only
 * the labels printed around them (session buttons, "Key market driver") are
 * translated here.
 */
export type DashboardCopy = {
  header: { title: string; subtitle: string };
  cardTitles: {
    aiSessionBrief: string;
    watchlist: string;
    openPositions: string;
    riskExposure: string;
    recentTrades: string;
    cumulativePnl: string;
    whereResultsLand: string;
    performance: string;
  };
  sourceLabels: {
    priceHistory: (label: string) => string;
    dailyBars: (label: string) => string;
    newsFeeds: string;
  };
  sessionCard: {
    title: (label: string) => string;
    priceUnavailable: (label: string) => string;
    notEnoughBars: (label: string) => string;
  };
  newsCard: {
    title: (label: string) => string;
    empty: (label: string) => string;
    feedUnavailable: string;
    justNow: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    oneDayAgo: string;
    daysAgo: (n: number) => string;
  };
  firstRun: {
    heading: string;
    body: string;
    facts: [string, string, string];
    cta: string;
    orSync: string;
    settingsLink: string;
    andItFillsItself: string;
    dismiss: string;
  };
  deskCards: {
    openPositions: {
      empty: string;
      logOne: string;
      noStop: string;
      riskPercent: (percent: string) => string;
    };
    riskExposure: {
      empty: string;
      shareAria: (percent: number) => string;
    };
    recentTrades: {
      empty: string;
      connectMetaTrader: string;
      andTheyArrive: string;
    };
    performance: {
      empty: string;
      openTheJournal: string;
      closed: string;
      winRate: string;
      totalPnl: string;
      profitFactor: string;
      aboveEvenSplit: string;
      belowEvenSplit: string;
      noLosingTradeYet: string;
      wonPerLost: (factor: string) => string;
      onlyWonPerLost: (factor: string) => string;
      expectancy: string;
      perTrade: string;
      withoutStop: (n: number) => string;
    };
  };
  chart: {
    instrumentLabel: string;
    loading: string;
    noBars: (timeframe: string, label: string) => string;
    updated: (time: string) => string;
    refreshesEveryMinute: string;
  };
  mt5Prompt: {
    stopped: {
      heading: string;
      body: string;
      link: string;
    };
    waiting: {
      heading: string;
      body: string;
      link: string;
    };
    idle: {
      eyebrow: string;
      heading: string;
      bodyLead: string;
      bodyEmphasis: string;
      bodyTail: string;
      reasons: [string, string, string];
      cta: string;
      footnote: string;
    };
  };
  sessionBrief: {
    sessions: { london: string; newYork: string; asia: string };
    tone: { riskOn: string; riskOff: string; neutral: string };
    idle: string;
    coveragePersonalised: (
      scope: string,
      instruments: string,
    ) => string;
    coverageTop: string;
    coverageYours: string;
    truncatedNote: (max: number) => string;
    sharedNote: string;
    coverageFree: (instruments: string) => string;
    freeLink: string;
    loading: string;
    generating: (seconds: number) => string;
    genericError: string;
    seePlans: string;
    couldNotReach: string;
    keyMarketDriver: string;
    volatilityWarning: string;
    degradedNote: string;
    servedFromCache: string;
    writtenJustNow: string;
  };
  watchlist: {
    remove: string;
    removeAria: (label: string) => string;
    empty: string;
    addPlaceholder: string;
    fullPlaceholder: (max: number) => string;
    searchAria: string;
    couldNotAdd: string;
    couldNotRemove: string;
    couldNotReach: string;
  };
  pnlCurve: {
    overTrades: (n: number) => string;
    deepestFall: string;
    ariaLabel: (n: number, final: string, drawdown: string) => string;
    running: (amount: string) => string;
    hoverHint: string;
  };
  pnlDistribution: {
    closedTrades: string;
    worstSingleLoss: string;
    typicalLoss: string;
    barTitle: (count: number, percent: number) => string;
    outlierNote: (factor: string) => string;
    normalNote: (step: string) => string;
  };
};

const en: DashboardCopy = {
  header: {
    title: "Dashboard",
    subtitle: "What is open, what it risks, and how the closed trades have gone.",
  },
  cardTitles: {
    aiSessionBrief: "AI Session Brief",
    watchlist: "Watchlist",
    openPositions: "Open positions",
    riskExposure: "Risk exposure",
    recentTrades: "Recent trades",
    cumulativePnl: "Cumulative P&L, trade by trade",
    whereResultsLand: "Where the results land",
    performance: "Performance",
  },
  sourceLabels: {
    priceHistory: (label) => `${label} price history`,
    dailyBars: (label) => `${label} daily bars`,
    newsFeeds: "News feeds",
  },
  sessionCard: {
    title: (label) => `${label} — this session`,
    priceUnavailable: (label) =>
      `The price feed has nothing stored for ${label} yet, so there is nothing true to draw. It fills in on the next successful fetch.`,
    notEnoughBars: (label) =>
      `Not enough completed bars for ${label} to measure a session against. An arrow drawn from one candle would be a guess wearing a measurement's clothes.`,
  },
  newsCard: {
    title: (label) => `News naming ${label}`,
    empty: (label) =>
      `Nothing in the last three days naming ${label} or its currencies. The feeds are read live; a quiet list is a quiet market, not a broken panel.`,
    feedUnavailable:
      "The news feeds could not be reached just now. Nothing is stored to fall back on.",
    justNow: "just now",
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    oneDayAgo: "1d ago",
    daysAgo: (n) => `${n}d ago`,
  },
  firstRun: {
    heading: "These cards stay empty until you record a trade.",
    body: "Every number here is measured from your own trading — never a forecast, a signal, or somebody else's backtest. Then you get:",
    facts: [
      "Your win rate per pair — yours on gold against yours on GBPUSD.",
      "Where your losses cluster: the session, the weekday, the trade after a loss.",
      "What you actually risk, against your own median rather than a rule of thumb.",
    ],
    cta: "Record your first trade",
    orSync: "Or sync MetaTrader in",
    settingsLink: "Settings",
    andItFillsItself: "and it fills itself.",
    dismiss: "Dismiss",
  },
  deskCards: {
    openPositions: {
      empty: "Nothing open. A trade counts as open until you record its exit —",
      logOne: "log one",
      noStop: "no stop",
      riskPercent: (percent) => `${percent}% risk`,
    },
    riskExposure: {
      empty:
        "No defined risk open. Exposure needs a stop on the trade — without one there is no number to show.",
      shareAria: (percent) => `${percent}% of open risk`,
    },
    recentTrades: {
      empty: "No closed trades yet.",
      connectMetaTrader: "Connect MetaTrader",
      andTheyArrive: "and they arrive by themselves.",
    },
    performance: {
      empty: "Statistics start once a trade is closed.",
      openTheJournal: "Open the journal",
      closed: "Closed",
      winRate: "Win rate",
      totalPnl: "Total P&L",
      profitFactor: "Profit factor",
      aboveEvenSplit: "above an even split",
      belowEvenSplit: "below an even split",
      noLosingTradeYet: "no losing trade yet",
      wonPerLost: (factor) => `${factor}R won per 1R lost`,
      onlyWonPerLost: (factor) => `only ${factor}R won per 1R lost`,
      expectancy: "Expectancy",
      perTrade: "per trade",
      withoutStop: (n) =>
        `${n} trade${n === 1 ? "" : "s"} logged without a stop`,
    },
  },
  chart: {
    instrumentLabel: "Instrument",
    loading: "loading",
    noBars: (timeframe, label) =>
      `No ${timeframe} bars available for ${label} right now.`,
    updated: (time) => `updated ${time} · refreshes every minute`,
    refreshesEveryMinute: "refreshes every minute",
  },
  mt5Prompt: {
    stopped: {
      heading: "Your terminal has stopped sending",
      body: "Nothing has arrived for a while, so any position opened since then is missing from this desk and the cards below are incomplete. Usually MetaTrader is simply closed — it has to be running. If it is open, press Ctrl+T and look at the Experts tab: no line beginning getALPHA: in the last two minutes means the program is not running, and the usual reason is that another Expert Advisor was attached to the same chart. MetaTrader allows one per chart and replaces the old one without saying so.",
      link: "See when it last sent",
    },
    waiting: {
      heading: "Your key is waiting for the terminal",
      body: "Nothing has arrived yet. Two things stop it, both fixable in a minute: MetaTrader has to be running, and it blocks every outbound request until https://www.getalpha.org is added under Tools → Options → Expert Advisors. The program reports which one it is in MetaTrader's Experts tab.",
      link: "Check the steps",
    },
    idle: {
      eyebrow: "Stop typing your trades in",
      heading: "Connect MetaTrader and the journal fills itself.",
      bodyLead:
        "A small program runs inside your terminal and sends this desk what you traded. It only ever sends — it cannot place an order or change one, and ",
      bodyEmphasis: "there is no password involved anywhere",
      bodyTail: ": your terminal connects to us, never the other way round.",
      reasons: [
        "Every closed trade lands in the journal by itself — including the ones you would never have bothered to type in, which are usually the ones worth reading later.",
        "The stop, the size and the units per lot come from the terminal, so the risk and the result are exact rather than approximate.",
        "The per-pair breakdown needs a body of trades before it can say anything. Ninety days of history arrives on the first sync; typing it by hand does not happen.",
      ],
      cta: "Connect MetaTrader",
      footnote:
        "Five steps, desktop terminal only — one of them is compiling the file, which is the one everybody misses. The phone app cannot run programs.",
    },
  },
  sessionBrief: {
    sessions: { london: "London", newYork: "New York", asia: "Asia" },
    tone: { riskOn: "Risk on", riskOff: "Risk off", neutral: "Neutral" },
    idle: "Pick a session. Readers watching the same instruments share one brief, so asking twice costs nothing.",
    coveragePersonalised: (scope, instruments) => `Covers ${scope} — ${instruments}.`,
    coverageTop: "the top of your watchlist",
    coverageYours: "your watchlist",
    truncatedNote: (max) =>
      `One brief reports on at most ${max} instruments; reorder the watchlist to change which. `,
    sharedNote:
      "Readers watching the same instruments share one brief per session, which is what keeps it affordable.",
    coverageFree: (instruments) =>
      `Covers ${instruments} — the same brief every free account reads.`,
    freeLink: "Pro writes it from your own watchlist",
    loading: "Collecting the calendar, levels and headlines, then writing.",
    generating: (seconds) =>
      `Somebody else asked first and it is being written now. Try again in about ${seconds} seconds.`,
    genericError: "The brief could not be produced.",
    seePlans: "See the plans",
    couldNotReach: "Could not reach the server. Check your connection.",
    keyMarketDriver: "Key market driver",
    volatilityWarning: "Volatility warning",
    degradedNote:
      "Some market data was stale or missing when this was written. Gaps are named rather than filled in.",
    servedFromCache: "Served from today's brief for these instruments.",
    writtenJustNow: "Written just now.",
  },
  watchlist: {
    remove: "Remove",
    removeAria: (label) => `Remove ${label}`,
    empty: "Nothing on the list. Search below to add an instrument.",
    addPlaceholder: "Add an instrument…",
    fullPlaceholder: (max) => `The list holds ${max} instruments`,
    searchAria: "Search instruments",
    couldNotAdd: "Could not add that instrument.",
    couldNotRemove: "Could not remove that instrument.",
    couldNotReach: "Could not reach the server.",
  },
  pnlCurve: {
    overTrades: (n) => `over ${n} trades`,
    deepestFall: "deepest fall from a peak",
    ariaLabel: (n, final, drawdown) =>
      `Cumulative profit and loss over ${n} trades, ending at ${final}, with a deepest fall from a peak of ${drawdown}.`,
    running: (amount) => `running ${amount}`,
    hoverHint: "Hover or tap a point for the trade behind it.",
  },
  pnlDistribution: {
    closedTrades: "closed trades",
    worstSingleLoss: "worst single loss",
    typicalLoss: "typical loss",
    barTitle: (count, percent) =>
      `${count} trade${count === 1 ? "" : "s"} · ${percent}%`,
    outlierNote: (factor) =>
      `Your worst loss is ${factor}× your typical one. A single loss that far outside the usual is a stop that was moved, widened, or never really there.`,
    normalNote: (step) =>
      `Each column is ${step} wide, sized from your own typical result rather than a fixed amount.`,
  },
};

const lt: DashboardCopy = {
  header: {
    title: "Apžvalga",
    subtitle:
      "Kas atidaryta, kokia rizika ir kaip sekasi uždarytiems sandoriams.",
  },
  cardTitles: {
    aiSessionBrief: "AI sesijos apžvalga",
    watchlist: "Stebimi instrumentai",
    openPositions: "Atviros pozicijos",
    riskExposure: "Atvira rizika",
    recentTrades: "Naujausi sandoriai",
    cumulativePnl: "Kaupiamasis P&L, sandoris po sandorio",
    whereResultsLand: "Kur pasiskirsto rezultatai",
    performance: "Rezultatai",
  },
  sourceLabels: {
    priceHistory: (label) => `${label} kainų istorija`,
    dailyBars: (label) => `${label} dienos žvakės`,
    newsFeeds: "Naujienų šaltiniai",
  },
  sessionCard: {
    title: (label) => `${label} — ši sesija`,
    priceUnavailable: (label) =>
      `Kainų šaltinis dar neturi jokių išsaugotų duomenų apie ${label}, tad piešti nėra ko tikro. Užsipildys po kito sėkmingo atnaujinimo.`,
    notEnoughBars: (label) =>
      `Nepakanka užbaigtų žvakių, kad būtų galima matuoti ${label} sesiją. Rodyklė, nubrėžta iš vienos žvakės, būtų spėjimas, apsimetantis matavimu.`,
  },
  newsCard: {
    title: (label) => `Naujienos, minimos su ${label}`,
    empty: (label) =>
      `Per pastarąsias tris dienas nieko, kas minėtų ${label} ar jo valiutas. Šaltiniai skaitomi gyvai; tylus sąrašas reiškia ramią rinką, o ne sugedusį skydelį.`,
    feedUnavailable:
      "Naujienų šaltinių dabar pasiekti nepavyko. Atsarginių duomenų nėra išsaugota.",
    justNow: "ką tik",
    minutesAgo: (n) => `prieš ${n} min.`,
    hoursAgo: (n) => `prieš ${n} val.`,
    oneDayAgo: "prieš 1 d.",
    daysAgo: (n) => `prieš ${n} d.`,
  },
  firstRun: {
    heading: "Šios kortelės liks tuščios, kol užregistruosi sandorį.",
    body: "Kiekvienas skaičius čia matuojamas iš tavo paties prekybos — niekada ne prognozė, signalas ar svetimas atgalinis testas. Tada gauni:",
    facts: [
      "Savo laimėjimų procentą pagal porą — auksą palyginus su GBPUSD.",
      "Kur telkiasi tavo nuostoliai: sesija, savaitės diena, sandoris po nuostolio.",
      "Ką realiai rizikuoji, lyginant su savo pačio įprastu dydžiu, o ne bendra taisykle.",
    ],
    cta: "Užregistruok pirmą sandorį",
    orSync: "Arba susinchronizuok MetaTrader",
    settingsLink: "Nustatymuose",
    andItFillsItself: "ir jis užsipildys pats.",
    dismiss: "Uždaryti",
  },
  deskCards: {
    openPositions: {
      empty: "Nieko atidaryto. Sandoris laikomas atidarytu, kol neįrašai jo išėjimo —",
      logOne: "įrašyk vieną",
      noStop: "nėra stop loss",
      riskPercent: (percent) => `${percent} % rizika`,
    },
    riskExposure: {
      empty:
        "Nėra apibrėžtos atviros rizikos. Rizikai reikia stop loss sandoryje — be jo nėra ką parodyti.",
      shareAria: (percent) => `${percent} % atviros rizikos`,
    },
    recentTrades: {
      empty: "Kol kas nėra uždarytų sandorių.",
      connectMetaTrader: "Prijunk MetaTrader",
      andTheyArrive: "ir jie atsiranda patys.",
    },
    performance: {
      empty: "Statistika prasideda, kai užsidaro pirmas sandoris.",
      openTheJournal: "Atidaryk žurnalą",
      closed: "Uždaryta",
      winRate: "Laimėjimų procentas",
      totalPnl: "Bendras P&L",
      profitFactor: "Pelno koeficientas",
      aboveEvenSplit: "virš pusės",
      belowEvenSplit: "žemiau pusės",
      noLosingTradeYet: "kol kas nėra nuostolingo sandorio",
      wonPerLost: (factor) => `${factor}R laimėta už kiekvieną 1R prarastą`,
      onlyWonPerLost: (factor) => `tik ${factor}R laimėta už kiekvieną 1R prarastą`,
      expectancy: "Lūkestis",
      perTrade: "vienam sandoriui",
      withoutStop: (n) =>
        `${n} ${n === 1 ? "sandoris" : "sandoriai"} užregistruoti be stop loss`,
    },
  },
  chart: {
    instrumentLabel: "Instrumentas",
    loading: "kraunama",
    noBars: (timeframe, label) =>
      `Šiuo metu nėra ${timeframe} žvakių, skirtų ${label}.`,
    updated: (time) => `atnaujinta ${time} · atsinaujina kas minutę`,
    refreshesEveryMinute: "atsinaujina kas minutę",
  },
  mt5Prompt: {
    stopped: {
      heading: "Tavo terminalas nustojo siųsti",
      body: "Jau kurį laiką nieko negauta, tad kiekviena nuo tada atidaryta pozicija šiam stalui nematoma, o kortelės žemiau — neišsamios. Dažniausiai MetaTrader tiesiog uždarytas — jis turi būti paleistas. Jei jis atidarytas, spausk Ctrl+T ir pažiūrėk į Experts skirtuką: jei per paskutines dvi minutes nėra eilutės, prasidedančios getALPHA:, programa neveikia, o įprasta priežastis — prie to paties grafiko buvo prijungtas kitas Expert Advisor. MetaTrader viename grafike leidžia tik vieną ir pakeičia seną be jokio įspėjimo.",
      link: "Pažiūrėk, kada paskutinį kartą siuntė",
    },
    waiting: {
      heading: "Tavo raktas laukia terminalo",
      body: "Kol kas nieko negauta. Yra du dalykai, kurie tai stabdo, abu ištaisomi per minutę: MetaTrader turi būti paleistas, ir jis blokuoja kiekvieną išeinančią užklausą, kol Tools → Options → Expert Advisors nepridedi https://www.getalpha.org. Programa praneša, kuris tai atvejis, MetaTrader Experts skirtuke.",
      link: "Peržiūrėk žingsnius",
    },
    idle: {
      eyebrow: "Nustok vesti sandorius ranka",
      heading: "Prijunk MetaTrader, ir žurnalas užsipildys pats.",
      bodyLead:
        "Nedidelė programa veikia tavo terminale ir siunčia šiam stalui, ką prekiavai. Ji tik siunčia — negali atidaryti sandorio ar jo pakeisti, ir ",
      bodyEmphasis: "jokio slaptažodžio čia niekur nereikia",
      bodyTail: ": tavo terminalas jungiasi prie mūsų, niekada ne atvirkščiai.",
      reasons: [
        "Kiekvienas uždarytas sandoris pats atsiranda žurnale — įskaitant tuos, kurių niekada nebūtum vedęs ranka, o būtent jie dažniausiai verti skaityti vėliau.",
        "Stop loss, dydis ir vieneto dydis ateina iš terminalo, tad rizika ir rezultatas yra tikslūs, o ne apytiksliai.",
        "Statistikai pagal porą reikia sandorių istorijos, kad būtų ką pasakyti. 90 dienų istorija atkeliauja per pirmą sinchronizaciją; ranka to niekas neveda.",
      ],
      cta: "Prijunk MetaTrader",
      footnote:
        "Penki žingsniai, tik kompiuterio terminalui — vienas iš jų yra failo kompiliavimas, ir būtent jį dažniausiai praleidžia. Telefono programėlė programų paleisti negali.",
    },
  },
  sessionBrief: {
    sessions: { london: "Londonas", newYork: "Niujorkas", asia: "Azija" },
    tone: { riskOn: "Rizika priimama", riskOff: "Rizikos vengiama", neutral: "Neutralu" },
    idle: "Pasirink sesiją. Tuos pačius instrumentus stebintys skaitytojai dalijasi viena apžvalga, tad klausti antrą kartą nieko nekainuoja.",
    coveragePersonalised: (scope, instruments) => `Apima ${scope} — ${instruments}.`,
    coverageTop: "tavo sąrašo viršų",
    coverageYours: "tavo stebimų instrumentų sąrašą",
    truncatedNote: (max) =>
      `Viena apžvalga apima ne daugiau kaip ${max} instrumentų; pakeisk eiliškumą sąraše, jei nori kitų. `,
    sharedNote:
      "Tuos pačius instrumentus stebintys skaitytojai dalijasi viena apžvalga per sesiją — tai ir palaiko kainą prieinamą.",
    coverageFree: (instruments) =>
      `Apima ${instruments} — tą pačią apžvalgą skaito kiekviena nemokama paskyra.`,
    freeLink: "Pro planas ją rašo pagal tavo paties stebimų instrumentų sąrašą",
    loading: "Renkamas kalendorius, lygiai ir antraštės, tada rašoma.",
    generating: (seconds) =>
      `Kažkas kitas paklausė pirmas, ir tai dabar rašoma. Bandyk dar kartą po maždaug ${seconds} sekundžių.`,
    genericError: "Apžvalgos parengti nepavyko.",
    seePlans: "Žiūrėk planus",
    couldNotReach: "Nepavyko pasiekti serverio. Patikrink ryšį.",
    keyMarketDriver: "Pagrindinis rinkos veiksnys",
    volatilityWarning: "Svyravimo įspėjimas",
    degradedNote:
      "Kai kurie rinkos duomenys, rašant šią apžvalgą, buvo pasenę arba trūko. Spragos įvardijamos, o ne užpildomos.",
    servedFromCache: "Pateikta iš šiandienos apžvalgos šiems instrumentams.",
    writtenJustNow: "Parašyta ką tik.",
  },
  watchlist: {
    remove: "Šalinti",
    removeAria: (label) => `Šalinti ${label}`,
    empty: "Sąrašas tuščias. Ieškok žemiau, kad pridėtum instrumentą.",
    addPlaceholder: "Pridėk instrumentą…",
    fullPlaceholder: (max) => `Sąraše telpa ${max} instrumentų`,
    searchAria: "Ieškoti instrumentų",
    couldNotAdd: "Nepavyko pridėti šio instrumento.",
    couldNotRemove: "Nepavyko pašalinti šio instrumento.",
    couldNotReach: "Nepavyko pasiekti serverio.",
  },
  pnlCurve: {
    overTrades: (n) => `per ${n} sandorių`,
    deepestFall: "didžiausias kritimas nuo piko",
    ariaLabel: (n, final, drawdown) =>
      `Kaupiamasis pelnas ir nuostolis per ${n} sandorių, baigiantis ties ${final}, su didžiausiu ${drawdown} kritimu nuo piko.`,
    running: (amount) => `iš viso ${amount}`,
    hoverHint: "Užvesk pelę arba paliesk tašką, kad matytum sandorį už jo.",
  },
  pnlDistribution: {
    closedTrades: "uždaryti sandoriai",
    worstSingleLoss: "didžiausias vienkartinis nuostolis",
    typicalLoss: "įprastas nuostolis",
    barTitle: (count, percent) =>
      `${count} ${count === 1 ? "sandoris" : "sandoriai"} · ${percent} %`,
    outlierNote: (factor) =>
      `Tavo didžiausias nuostolis yra ${factor}× didesnis už įprastą. Toks nuostolis, gerokai viršijantis įprastą, reiškia, kad stop loss buvo perkeltas, praplėstas arba jo iš viso nebuvo.`,
    normalNote: (step) =>
      `Kiekvienas stulpelis yra ${step} pločio, apskaičiuotas pagal tavo paties įprastą rezultatą, o ne fiksuotą sumą.`,
  },
};

const DASHBOARD: Record<Locale, DashboardCopy> = { en, lt };

export function dashboardCopy(locale: Locale): DashboardCopy {
  return DASHBOARD[locale];
}
