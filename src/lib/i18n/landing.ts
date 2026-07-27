import type { Locale } from "./locales.ts";

/**
 * Every word on the public landing page, in both languages.
 *
 * Written as one typed shape rather than a loose record, so a missing sentence
 * is a build error rather than an English line surfacing in the middle of a
 * Lithuanian page. That failure mode is the entire risk of translating by hand,
 * and the compiler is better at catching it than anyone rereading the page.
 *
 * Only the *public* surface lives here. The signed-in app stays English by
 * decision, and Clerk's own sign-in screens stay English by necessity —
 * `@clerk/localizations` 4.13.8 ships 49 locales and Lithuanian is not among
 * them.
 *
 * No `@/` imports and a `.ts` extension on the relative one, so `npm test` can
 * load this and check the two dictionaries against each other.
 */
export type LandingCopy = {
  meta: { title: string; description: string };
  nav: { how: string; signIn: string; getStarted: string };
  hero: {
    badge: string;
    headingMuted: string;
    headingBright: string;
    body: string;
    bodyEmphasis: string;
    cta: string;
    ctaNoteLine1: string;
    ctaNoteLine2: string;
    securityEmphasis: string;
    securityRest: string;
    waitlistHint: string;
    waitlistLink: string;
  };
  live: { eyebrow: string; heading: string; body: string };
  features: {
    eyebrow: string;
    heading: string;
    body: string;
    /**
     * The four capability cards, each with the little readout under it.
     *
     * The readouts are a mix of labels and sample values, and only the prose
     * ones are here. Instrument names, times and figures — "US CPI 13:30",
     * "XAUUSD, DXY", "€340.00" — are the same in both languages and belong in
     * the component, not in a dictionary that would only invite somebody to
     * "translate" a ticker symbol.
     */
    cards: {
      journal: { title: string; body: string };
      brief: { title: string; body: string };
      review: { title: string; body: string };
      calendar: { title: string; body: string };
    };
    readouts: {
      risk: string;
      plannedRR: string;
      result: string;
      exit: string;
      exitTarget: string;
      riskTone: string;
      riskToneValue: string;
      driver: string;
      volatility: string;
      primaryLeak: string;
      primaryLeakValue: string;
      seenIn: string;
      seenInValue: string;
      cost: string;
      fedSpeak: string;
      filteredBy: string;
      watchlist: string;
    };
  };
  steps: {
    eyebrow: string;
    heading: string;
    items: { title: string; body: string; note: string }[];
    footnote: string;
  };
  tradeTest: {
    eyebrow: string;
    heading: string;
    body: string;
    /**
     * The interactive panel.
     *
     * Sentences that carry a figure use `{risk}` and `{bite}` placeholders
     * rather than being split into fragments the component glues together.
     * Fragments only work in the language they were written for: Lithuanian
     * puts the percentage in a different case and a different position, and a
     * page assembled from "start" + number + "end" would read as machine
     * output. A whole sentence with a hole in it survives translation.
     *
     * Keeping them as plain strings also means the dictionary stays checkable
     * by the same test that checks everything else.
     */
    riskLabel: string;
    riskHint: string;
    stopLabel: string;
    stopHint: string;
    newsLabel: string;
    newsHint: string;
    yes: string;
    no: string;
    evaluate: string;
    empty: string;
    footnote: string;
    severity: { critical: string; warning: string; sound: string };
    headline: {
      critical: string;
      twoLeaks: string;
      oneLeak: string;
      sound: string;
    };
    finding: {
      noStop: string;
      riskHigh: string;
      riskHeavy: string;
      news: string;
      sound: string;
    };
    cta: { critical: string; warning: string; sound: string };
  };
  pricing: {
    eyebrow: string;
    heading: string;
    body: string;
    free: {
      label: string;
      note: string;
      items: string[];
      cta: string;
    };
    pro: {
      label: string;
      per: string;
      note: string;
      badge: string;
      items: string[];
      cta: string;
      footnote: string;
    };
  };
  /**
   * The playable review card beside the hero.
   *
   * `verdictHead` and `verdictTail` are stored separately rather than one
   * sentence the component splits on the words "The result". That split is
   * `indexOf` against an English phrase: translate the sentence and it returns
   * -1, the emphasis lands on the whole string, and the typing animation reads
   * from the wrong offsets. Two fields cannot fail that way.
   */
  verdict: {
    idleChip: string;
    liveChip: string;
    alarm: string;
    take: string;
    takeHint: string;
    verdictHead: string;
    verdictTail: string;
    ruleLabel: string;
    rule: string;
    again: string;
    footnote: string;
    ratings: {
      strong: string;
      adequate: string;
      weak: string;
      noData: string;
    };
    dimensions: {
      selection: string;
      sizing: string;
      stop: string;
      exit: string;
      adherence: string;
      emotion: string;
    };
  };
  waitlist: { eyebrow: string; heading: string; body: string };
  faq: {
    eyebrow: string;
    heading: string;
    items: { q: string; a: string }[];
  };
  disclaimer: {
    label: string;
    bodyStart: string;
    bodyEmphasis: string;
    bodyEnd: string;
    link: string;
  };
  /** Names the *other* language, in that language. Never translated. */
  switchTo: string;
};

const en: LandingCopy = {
  meta: {
    title: "getALPHA — the trading journal that judges the decision",
    description:
      "Your MetaTrader trades, journalled automatically, with every number computed from your own record. Free journal, charts and calendar; AI process review on Pro.",
  },
  nav: { how: "How it works", signIn: "Sign in", getStarted: "Get started" },
  hero: {
    badge: "journal · session brief · process review",
    headingMuted: "Most traders measure the outcome.",
    headingBright: "Almost none measure the decision.",
    body: "getALPHA reads the trade you actually took — the size, the stop, the exit, the note you wrote at the time — and tells you whether the process was sound.",
    bodyEmphasis: "Winning on a broken process is the expensive kind of luck.",
    cta: "Start your free journal",
    ctaNoteLine1: "The journal, charts and calendar cost nothing.",
    ctaNoteLine2: "No card, no trial clock.",
    securityEmphasis: "No broker password ever leaves your machine.",
    securityRest:
      "The MetaTrader add-on only sends — it is shipped as readable source so you can check that yourself — and nothing here can place a trade or move money. Your record is never sold or shared.",
    waitlistHint: "Rather be told when the AI modules change?",
    waitlistLink: "Leave an address instead",
  },
  live: {
    eyebrow: "live, right now",
    heading: "Gold’s session, as the desk reads it.",
    body: "Not a screenshot and not an example. This is the live readout, the same one on the dashboard — every arrow a measurement of a session that has already happened.",
  },
  features: {
    eyebrow: "What you get",
    heading: "Four modules. Every number computed from your own record.",
    body: "There is no signal feed here, and there never will be. What there is: an honest record, the context around the session you are about to trade, and a reviewer that has read every trade you have logged.",
    cards: {
      journal: {
        title: "A journal that computes",
        body: "Your P&L, the risk you took as a share of the account, and the reward you planned against it — all read straight from the terminal. You never type a number in, so you can never flatter one.",
      },
      brief: {
        title: "The session, before it starts",
        body: "One short brief: the tone of the session, the single driver that matters, and where volatility is likely — each claim naming the calendar entry or headline it came from.",
      },
      review: {
        title: "A review of your process",
        body: "Six dimensions, judged against your own history rather than a generic ideal. “Twice your median risk” is a finding. “Risk should be 1%” is a platitude.",
      },
      calendar: {
        title: "The releases that move your pairs",
        body: "Today’s calendar in your own timezone, filtered to the currencies you actually hold — both legs of every pair, because a release moves the pair whichever leg it lands on.",
      },
    },
    readouts: {
      risk: "Risk",
      plannedRR: "Planned RR",
      result: "Result",
      exit: "Exit",
      exitTarget: "Target",
      riskTone: "Risk tone",
      riskToneValue: "Cautious",
      driver: "Driver",
      volatility: "Volatility",
      primaryLeak: "Primary leak",
      primaryLeakValue: "Sizing after a loss",
      seenIn: "Seen in",
      seenInValue: "7 of 22 trades",
      cost: "Cost",
      fedSpeak: "Fed speak",
      filteredBy: "Filtered by",
      watchlist: "Your watchlist",
    },
  },
  steps: {
    eyebrow: "How it fits your week",
    heading: "Three steps, and only the first one takes any time.",
    items: [
      {
        title: "Connect",
        body: "Drop the add-on into MetaTrader and paste one key. About a minute, once. Ninety days of history arrives on the first sync.",
        note: "Desktop MetaTrader 5",
      },
      {
        title: "Trade",
        body: "Nothing changes. Take the trades you were going to take, on the platform you already use. Every closed position lands in the journal by itself.",
        note: "No new habit to keep",
      },
      {
        title: "Review",
        body: "Read the session brief before the open, and ask for a written review of any trade — sizing, stop placement, exit, and whether you followed your own plan.",
        note: "The part that costs money to run",
      },
    ],
    footnote: "closed positions sync themselves · nothing typed by hand",
  },
  tradeTest: {
    eyebrow: "Try it on your own",
    heading: "See how getALPHA judges the last trade you took.",
    body: "Three questions, none of them about whether it won. That is the whole point — the result is the one input that says nothing about how the decision was made.",
    riskLabel: "Risk taken on your last trade",
    riskHint: "As a share of your account, if the stop had been hit.",
    stopLabel: "Was the stop recorded before you entered?",
    stopHint:
      "Before, not after. A stop decided once the trade is moving is a reaction.",
    newsLabel: "Did you enter within 15 minutes of a high-impact release?",
    newsHint:
      "Non-farm payrolls, CPI, a rate decision — anything on the calendar in red.",
    yes: "Yes",
    no: "No",
    evaluate: "Evaluate my decision",
    empty:
      "Answer the three on the left and press the button. Nothing is sent anywhere — this runs in your browser, and no account is needed to read the answer.",
    footnote:
      "Three questions and a rule of thumb — not the review. The real one reads the trades your terminal already sent, compares the size against your own median rather than a number from a book, and has your notes in front of it.",
    severity: {
      critical: "Process broken",
      warning: "Leaks worth closing",
      sound: "Sound on these three",
    },
    headline: {
      critical:
        "Critical sizing leak. High risk of ruin, and stop placement missing.",
      twoLeaks:
        "Two leaks in one trade. Either alone is survivable; together they compound.",
      oneLeak: "One leak, and it is the kind that repeats.",
      sound:
        "Nothing broken in these three. Whether it was a good trade is a question about the other twenty.",
    },
    finding: {
      noStop:
        "No stop recorded before entry. There was no defined risk, so the size cannot be justified and the loss had no floor — whatever happened next was the market's decision, not yours.",
      riskHigh:
        "{risk}% of equity on one trade. At this size a run of five losses — an ordinary week — takes about a {bite}% bite out of the account before anything unusual has happened.",
      riskHeavy:
        "{risk}% is on the heavy side of normal. Survivable once; a habit worth watching if it is where you always sit.",
      news: "Entered inside fifteen minutes of a high-impact release. Spreads widen and stops get filled past where they were placed, so the risk taken was larger than the risk planned.",
      sound:
        "Risk inside a defensible band, a stop recorded before entry, and no release sitting on top of the entry. On these three, the decision holds regardless of what the trade made.",
    },
    cta: {
      critical: "See this run against every trade you have taken",
      warning: "Find out how often you do this",
      sound: "Check that against your whole record",
    },
  },
  pricing: {
    eyebrow: "Plans",
    heading: "The journal is free. The judgement is not.",
    body: "Reading a model costs money every time, so the two AI modules are what Pro pays for. Everything else stays free for as long as you use it.",
    free: {
      label: "Free",
      note: "For as long as you use it.",
      items: [
        "Trade journal with computed P&L and risk",
        "Cumulative R curve and outcome distribution",
        "Live charts for your watchlist",
        "Economic calendar in your own timezone",
        "MetaTrader sync — 90 days of history",
      ],
      cta: "Start free",
    },
    pro: {
      label: "Pro",
      per: "/ month",
      note: "Or €99.99 a year.",
      badge: "most popular",
      items: [
        "AI Session Brief before every session",
        "AI Coach process review on any trade",
        "Six dimensions judged against your own history",
        "Everything in Free",
      ],
      cta: "Get started",
      footnote: "Cancel whenever. The journal stays free either way.",
    },
  },
  verdict: {
    idleChip: "demo terminal",
    liveChip: "process review",
    alarm: "process broken",
    take: "Take the trade",
    takeHint: "press it · it wins · read what happens next",
    verdictHead:
      "Profitable, and taken at four times your median risk with no stop recorded. ",
    verdictTail:
      "The result is not evidence the decision was right.",
    ruleLabel: "rule for next time",
    rule: "Record the stop before entry, and size so risk stays at or below 1.2% of equity.",
    again: "run it again",
    footnote: "example review · not a real account",
    ratings: {
      strong: "Strong",
      adequate: "Adequate",
      weak: "Weak",
      noData: "No data",
    },
    dimensions: {
      selection: "Trade selection",
      sizing: "Position sizing",
      stop: "Stop placement",
      exit: "Exit management",
      adherence: "Plan adherence",
      emotion: "Emotional control",
    },
  },
  waitlist: {
    eyebrow: "Not ready to sign up",
    heading: "Then don’t. Leave an address instead.",
    body: "One note when the AI modules change in a way worth knowing about. Not a newsletter, and not a queue — the desk is open, and you can walk in whenever you like.",
  },
  faq: {
    eyebrow: "Questions",
    heading: "Before you connect anything.",
    items: [
      {
        q: "Is getALPHA a trading platform?",
        a: "No. It never places an order and never touches your money. You keep trading with your own broker on your own platform; this reads what you did afterwards and tells you how you did it.",
      },
      {
        q: "Do you see my broker password?",
        a: "No, and there is nowhere for one to be stored. The MetaTrader add-on sends your closed trades out to us — we never connect to your terminal or your broker. It ships as readable source so you can check that claim rather than take it.",
      },
      {
        q: "How does the AI review a trade?",
        a: "Every number is calculated in code first — your risk, your result, how the exit compared to the plan — and the model is handed the finished figures to judge the process behind them. It comments on decisions you already made. It never predicts a price or tells you what to trade next.",
      },
      {
        q: "Which brokers are supported?",
        a: "Any broker you trade through desktop MetaTrader 5. The add-on reads the account your terminal is already logged into, so the broker never has to know we exist. MetaTrader has to be running for a sync to happen.",
      },
      {
        q: "What is actually free?",
        a: "The journal, the MetaTrader sync, the charts, the economic calendar, the per-instrument breakdown and the watchlist. Paying adds the two AI modules and nothing else, because those are the only parts that cost money every time they run.",
      },
      {
        q: "What happens if I delete my account?",
        a: "Your trades, notes, watchlist and terminal connection are deleted from the database. The record that you accepted the terms is kept, because that is the evidence that you did.",
      },
    ],
  },
  disclaimer: {
    label: "What this is not",
    bodyStart: "getALPHA is an educational and informational tool.",
    bodyEmphasis:
      "It is not an investment adviser or a broker, it does not provide financial advice or trading signals,",
    bodyEnd:
      "and every financial decision you make using it is yours alone. Trading leveraged instruments carries a high risk of loss, and past performance is not a reliable indicator of future results.",
    link: "Read the full risk disclaimer",
  },
  switchTo: "Lietuvių",
};

/**
 * The Lithuanian page.
 *
 * Translated for sense rather than word by word. Two rules held throughout:
 *
 * - **Trading vocabulary stays English** where that is what a Lithuanian trader
 *   actually says — *stop loss*, *pip*, *Pro*. "Nuostolio ribojimo pavedimas"
 *   is correct and nobody uses it, and copy that reads like a translation reads
 *   like a foreign product.
 * - **No claim is made stronger than the English.** The security sentence and
 *   the disclaimer are checkable statements and a regulated subject; softening
 *   or inflating either in translation would be the worst possible place to
 *   take liberties.
 */
const lt: LandingCopy = {
  meta: {
    title: "getALPHA — prekybos žurnalas, vertinantis sprendimą",
    description:
      "Tavo MetaTrader sandoriai į žurnalą patenka automatiškai, o kiekvienas skaičius apskaičiuojamas iš tavo paties įrašų. Žurnalas, grafikai ir kalendorius nemokami; AI proceso analizė — Pro plane.",
  },
  nav: { how: "Kaip veikia", signIn: "Prisijungti", getStarted: "Pradėti" },
  hero: {
    badge: "žurnalas · sesijos apžvalga · proceso analizė",
    headingMuted: "Dauguma prekiautojų matuoja rezultatą.",
    headingBright: "Beveik niekas nematuoja sprendimo.",
    body: "getALPHA perskaito sandorį, kurį realiai atlikai — pozicijos dydį, stop loss, išėjimą, tuo metu užrašytą pastabą — ir pasako, ar procesas buvo pagrįstas.",
    bodyEmphasis: "Pelnas su ydingu procesu — brangiausiai kainuojanti sėkmė.",
    cta: "Pradėk nemokamą žurnalą",
    ctaNoteLine1: "Žurnalas, grafikai ir kalendorius nieko nekainuoja.",
    ctaNoteLine2: "Jokios kortelės, jokio bandomojo laikotarpio.",
    securityEmphasis: "Brokerio slaptažodis niekada nepalieka tavo kompiuterio.",
    securityRest:
      "MetaTrader priedas tik siunčia — jis pateikiamas kaip skaitomas pirminis kodas, kad galėtum tuo įsitikinti pats — ir niekas čia negali atidaryti sandorio ar pervesti pinigų. Tavo įrašai niekada neparduodami ir neperduodami.",
    waitlistHint: "Nori tiesiog gauti žinią, kai pasikeis AI moduliai?",
    waitlistLink: "Palik el. pašto adresą",
  },
  live: {
    eyebrow: "gyvai, dabar",
    heading: "Aukso sesija taip, kaip ją skaito getALPHA.",
    body: "Ne ekrano nuotrauka ir ne pavyzdys. Tai gyvas rodmuo, tas pats, kurį matai valdymo skydelyje — kiekviena rodyklė matuoja tai, kas jau įvyko.",
  },
  features: {
    eyebrow: "Ką gauni",
    heading: "Keturi moduliai. Kiekvienas skaičius — iš tavo paties įrašų.",
    body: "Čia nėra signalų srauto ir niekada nebus. Yra štai kas: sąžiningas įrašas, kontekstas apie sesiją, į kurią ruošiesi, ir vertintojas, perskaitęs kiekvieną tavo užfiksuotą sandorį.",
    cards: {
      journal: {
        title: "Žurnalas, kuris pats skaičiuoja",
        body: "Tavo pelnas, prisiimta rizika kaip sąskaitos dalis ir planuotas atlygis prieš ją — viskas nuskaityta tiesiai iš terminalo. Nė vieno skaičiaus nevedi ranka, tad nė vieno negali sau pagražinti.",
      },
      brief: {
        title: "Sesija dar prieš jai prasidedant",
        body: "Viena trumpa apžvalga: sesijos nuotaika, vienintelis svarbus veiksnys ir kur tikėtinas svyravimas — kiekvienas teiginys nurodo kalendoriaus įrašą arba antraštę, iš kurios kilo.",
      },
      review: {
        title: "Tavo proceso analizė",
        body: "Šešios sritys, vertinamos pagal tavo paties istoriją, o ne pagal bendrą idealą. „Dvigubai daugiau nei tavo įprasta rizika“ yra išvada. „Rizika turi būti 1 %“ yra tuščia frazė.",
      },
      calendar: {
        title: "Įvykiai, judinantys tavo poras",
        body: "Šiandienos kalendorius tavo laiko juosta, atrinktas pagal valiutas, kurias realiai laikai — abi kiekvienos poros pusės, nes įvykis pajudina porą, į kurią pusę bepataikytų.",
      },
    },
    readouts: {
      risk: "Rizika",
      plannedRR: "Planuotas RR",
      result: "Rezultatas",
      exit: "Išėjimas",
      exitTarget: "Tikslas",
      riskTone: "Rinkos nuotaika",
      // Feminine, agreeing with "nuotaika" above it. The English "Cautious" is
      // genderless and a label picked without looking at the word it sits under
      // is how a translated page ends up subtly wrong everywhere at once.
      riskToneValue: "Atsargi",
      driver: "Veiksnys",
      volatility: "Svyravimas",
      primaryLeak: "Pagrindinė spraga",
      primaryLeakValue: "Pozicijos dydis po nuostolio",
      seenIn: "Pasitaikė",
      seenInValue: "7 iš 22 sandorių",
      cost: "Kaina",
      fedSpeak: "Fed pasisakymas",
      filteredBy: "Atrinkta pagal",
      watchlist: "Tavo sąrašą",
    },
  },
  steps: {
    eyebrow: "Kaip tai telpa į tavo savaitę",
    heading: "Trys žingsniai, ir tik pirmasis atima laiko.",
    items: [
      {
        title: "Prijunk",
        body: "Įdėk priedą į MetaTrader ir įklijuok vieną raktą. Maždaug minutė, vieną kartą. Per pirmą sinchronizaciją atkeliauja 90 dienų istorija.",
        note: "MetaTrader 5 kompiuteryje",
      },
      {
        title: "Prekiauk",
        body: "Niekas nesikeičia. Atlik tuos sandorius, kuriuos ir taip būtum atlikęs, toje pačioje platformoje. Kiekviena uždaryta pozicija pati atsiranda žurnale.",
        note: "Jokio naujo įpročio",
      },
      {
        title: "Peržiūrėk",
        body: "Perskaityk sesijos apžvalgą prieš rinkos atidarymą ir paprašyk bet kurio sandorio rašytinės analizės — pozicijos dydžio, stop loss vietos, išėjimo ir to, ar laikeisi savo paties plano.",
        note: "Dalis, kuri kainuoja pinigus",
      },
    ],
    footnote:
      "uždarytos pozicijos sinchronizuojasi pačios · nieko nereikia vesti ranka",
  },
  tradeTest: {
    eyebrow: "Išbandyk su savo sandoriu",
    heading: "Pažiūrėk, kaip getALPHA įvertina paskutinį tavo sandorį.",
    body: "Trys klausimai, ir nė vienas iš jų neklausia, ar sandoris buvo pelningas. Tokia ir esmė: rezultatas yra vienintelis rodiklis, kuris nieko nepasako apie tai, kaip buvo priimtas sprendimas.",
    riskLabel: "Rizika, prisiimta paskutiniame sandoryje",
    riskHint: "Sąskaitos dalis, kurią būtum praradęs, jei būtų suveikęs stop loss.",
    stopLabel: "Ar stop loss buvo nustatytas dar prieš įeinant?",
    stopHint:
      "Prieš, o ne po. Stop loss, nuspręstas sandoriui jau judant, yra reakcija.",
    newsLabel: "Ar įėjai likus mažiau nei 15 minučių iki svarbaus įvykio?",
    newsHint:
      "Nedarbo duomenys, infliacija, palūkanų sprendimas — visa, kas kalendoriuje pažymėta raudonai.",
    yes: "Taip",
    no: "Ne",
    evaluate: "Įvertinti mano sprendimą",
    empty:
      "Atsakyk į tris klausimus kairėje ir spausk mygtuką. Niekas niekur nesiunčiama — visa tai vyksta tavo naršyklėje, o atsakymui perskaityti paskyros nereikia.",
    footnote:
      "Trys klausimai ir apytikslė taisyklė — tai dar ne analizė. Tikroji skaito sandorius, kuriuos terminalas jau atsiuntė, lygina pozicijos dydį su tavo paties įprastu, o ne su skaičiumi iš knygos, ir turi prieš akis tavo pastabas.",
    severity: {
      critical: "Procesas ydingas",
      warning: "Spragos, kurias verta užverti",
      sound: "Šiose trijose viskas tvarkoje",
    },
    headline: {
      critical:
        "Kritinė pozicijos dydžio spraga. Didelė žlugimo rizika ir nenustatytas stop loss.",
      twoLeaks:
        "Dvi spragos viename sandoryje. Kiekviena atskirai dar pakeliama; kartu jos stiprina viena kitą.",
      oneLeak: "Viena spraga, ir būtent tokia, kuri kartojasi.",
      sound:
        "Šiose trijose niekas nesulaužyta. Ar sandoris buvo geras — klausimas apie kitas dvidešimt.",
    },
    finding: {
      noStop:
        "Prieš įeinant stop loss nebuvo nustatytas. Rizika buvo neapibrėžta, tad pozicijos dydžio pagrįsti neįmanoma, o nuostolis neturėjo dugno — kas nutiko toliau, buvo rinkos, o ne tavo sprendimas.",
      riskHigh:
        "{risk} % sąskaitos viename sandoryje. Tokiu dydžiu penkių nuostolių serija — visiškai įprasta savaitė — atkanda apie {bite} % sąskaitos dar prieš įvykstant kam nors neįprasto.",
      riskHeavy:
        "{risk} % yra viršutinėje normos riboje. Vieną kartą pakeliama; bet jei visada sėdi būtent čia, tai įprotis, kurį verta stebėti.",
      news: "Įėjai likus mažiau nei penkiolikai minučių iki svarbaus įvykio. Skirtumas tarp pirkimo ir pardavimo kainos išsiplečia, o stop loss įvykdomas toliau, nei buvo padėtas — tad prisiimta rizika buvo didesnė už planuotą.",
      sound:
        "Rizika pagrįstose ribose, stop loss nustatytas prieš įeinant, ir jokio įvykio tiesiai virš įėjimo. Šiose trijose sprendimas laikosi, nesvarbu, kiek sandoris uždirbo.",
    },
    cta: {
      critical: "Pažiūrėk, kaip tai atrodo visų tavo sandorių fone",
      warning: "Sužinok, kaip dažnai taip darai",
      sound: "Patikrink tai su visu savo įrašų rinkiniu",
    },
  },
  pricing: {
    eyebrow: "Planai",
    heading: "Žurnalas nemokamas. Vertinimas — ne.",
    body: "Kiekvienas kreipimasis į modelį kainuoja pinigus, todėl Pro planas ir yra už tuos du AI modulius. Visa kita lieka nemokama tiek, kiek naudosies.",
    free: {
      label: "Nemokamas",
      note: "Tiek, kiek naudosies.",
      items: [
        "Prekybos žurnalas su apskaičiuotu pelnu ir rizika",
        "Kaupiamoji pelno kreivė ir rezultatų pasiskirstymas",
        "Gyvi tavo stebimų instrumentų grafikai",
        "Ekonominis kalendorius tavo laiko juosta",
        "MetaTrader sinchronizacija — 90 dienų istorija",
      ],
      cta: "Pradėti nemokamai",
    },
    pro: {
      label: "Pro",
      per: "/ mėn.",
      note: "Arba €99.99 per metus.",
      badge: "populiariausias",
      items: [
        "AI sesijos apžvalga kiekvienai prekybos sesijai",
        "AI trenerio proceso analizė bet kuriam sandoriui",
        "Šešios sritys, vertinamos pagal tavo paties istoriją",
        "Viskas, kas yra nemokamame plane",
      ],
      cta: "Pradėti",
      footnote: "Atsisakyk kada nori. Žurnalas lieka nemokamas bet kuriuo atveju.",
    },
  },
  verdict: {
    idleChip: "demonstracinis terminalas",
    liveChip: "proceso analizė",
    alarm: "procesas ydingas",
    take: "Atlikti sandorį",
    takeHint: "spausk · jis laimi · skaityk, kas bus toliau",
    verdictHead:
      "Pelningas, bet atliktas su keturis kartus didesne nei tavo įprasta rizika ir be nustatyto stop loss. ",
    verdictTail: "Rezultatas nėra įrodymas, kad sprendimas buvo teisingas.",
    ruleLabel: "taisyklė kitam kartui",
    rule: "Nustatyk stop loss prieš įeidamas, o pozicijos dydį parink taip, kad rizika neviršytų 1,2 % sąskaitos.",
    again: "paleisti dar kartą",
    footnote: "pavyzdinė analizė · ne tikra sąskaita",
    ratings: {
      strong: "Stipru",
      adequate: "Pakankama",
      weak: "Silpna",
      noData: "Nėra duomenų",
    },
    dimensions: {
      selection: "Sandorio pasirinkimas",
      sizing: "Pozicijos dydis",
      stop: "Stop loss vieta",
      exit: "Išėjimo valdymas",
      adherence: "Plano laikymasis",
      emotion: "Emocijų valdymas",
    },
  },
  waitlist: {
    eyebrow: "Nepasiruošęs registruotis",
    heading: "Tai ir nesiregistruok. Palik adresą.",
    body: "Viena žinutė, kai AI moduliai pasikeis taip, kad verta žinoti. Ne naujienlaiškis ir ne eilė — durys atviros, gali užeiti kada panorėjęs.",
  },
  faq: {
    eyebrow: "Klausimai",
    heading: "Prieš ką nors prijungdamas.",
    items: [
      {
        q: "Ar getALPHA yra prekybos platforma?",
        a: "Ne. Ji niekada neatidaro sandorio ir neliečia tavo pinigų. Toliau prekiauji su savo brokeriu savo įprasta platforma; ši sistema perskaito, ką padarei, ir pasako, kaip tai padarei.",
      },
      {
        q: "Ar matote mano brokerio slaptažodį?",
        a: "Ne, ir nėra kur jo laikyti. MetaTrader priedas siunčia tavo uždarytus sandorius mums — mes niekada nesijungiame prie tavo terminalo ar brokerio. Priedas pateikiamas kaip skaitomas pirminis kodas, kad šį teiginį galėtum patikrinti, o ne priimti tikėjimu.",
      },
      {
        q: "Kaip AI vertina sandorį?",
        a: "Kiekvienas skaičius pirmiausia apskaičiuojamas kode — tavo rizika, rezultatas, kaip išėjimas atrodė palyginti su planu — ir modeliui paduodami jau baigti skaičiai, kad jis vertintų procesą už jų. Jis komentuoja sprendimus, kuriuos jau priėmei. Jis niekada neprognozuoja kainos ir nesako, ką pirkti toliau.",
      },
      {
        q: "Kurie brokeriai palaikomi?",
        a: "Bet kuris brokeris, su kuriuo prekiauji per MetaTrader 5 kompiuteryje. Priedas skaito tą sąskaitą, prie kurios terminalas jau prisijungęs, tad brokeriui apskritai nereikia žinoti, kad egzistuojame. Kad sinchronizacija įvyktų, MetaTrader turi būti paleistas.",
      },
      {
        q: "Kas iš tikrųjų nemokama?",
        a: "Žurnalas, MetaTrader sinchronizacija, grafikai, ekonominis kalendorius, statistika pagal instrumentą ir stebimų instrumentų sąrašas. Sumokėjus prisideda du AI moduliai ir nieko daugiau, nes tik jie kainuoja pinigus kiekvieną kartą, kai paleidžiami.",
      },
      {
        q: "Kas nutinka, jei ištrinu paskyrą?",
        a: "Tavo sandoriai, pastabos, stebimų instrumentų sąrašas ir terminalo prijungimas ištrinami iš duomenų bazės. Įrašas, kad sutikai su sąlygomis, išsaugomas, nes būtent jis yra to įrodymas.",
      },
    ],
  },
  disclaimer: {
    label: "Kas tai nėra",
    bodyStart: "getALPHA yra šviečiamoji ir informacinė priemonė.",
    bodyEmphasis:
      "Ji nėra investicijų patarėjas ar brokeris ir neteikia finansinių patarimų ar prekybos signalų,",
    bodyEnd:
      "o kiekvienas finansinis sprendimas, kurį priimi ja naudodamasis, yra tik tavo. Prekyba finansinėmis priemonėmis su svertu kelia didelę nuostolių riziką, o praeities rezultatai nėra patikimas būsimų rezultatų rodiklis.",
    link: "Skaityti visą rizikos įspėjimą",
  },
  switchTo: "English",
};

const DICTIONARIES: Record<Locale, LandingCopy> = { en, lt };

export function landingCopy(locale: Locale): LandingCopy {
  return DICTIONARIES[locale];
}
