/**
 * Every word on the public landing page.
 *
 * Single language now — the Lithuanian page was removed (2026-07-28) in
 * favour of one English site, so this is a plain constant rather than a
 * per-locale dictionary. Kept as a typed shape anyway: a missing field is
 * still a build error, and every component that reads this stays unchanged
 * if a second language ever comes back.
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
    };
    dimensions: {
      sizing: string;
      stop: string;
      exit: string;
      adherence: string;
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
};

export const landingCopy: LandingCopy = {
  meta: {
    // The brand line stays first — a keyword suffix appended, not a
    // replacement, so search terms sit behind the voice a reader sees.
    title: "getALPHA — the trading journal that judges the decision — free for MetaTrader, cTrader & TradingView",
    description:
      "Your MetaTrader, cTrader or TradingView trades, journalled automatically, with every number computed from your own record. Free journal, charts and calendar; AI process review on Pro.",
  },
  nav: { how: "How it works", signIn: "Sign in", getStarted: "Get started" },
  hero: {
    badge: "journal · session brief · process review",
    headingMuted: "Most traders measure the outcome.",
    headingBright: "Almost none measure the decision.",
    body: "getALPHA reads the trade you took — size, stop, exit — and judges whether the process was sound.",
    bodyEmphasis: "Winning on a broken process is expensive luck.",
    cta: "Start your free journal",
    ctaNoteLine1: "The journal, charts and calendar cost nothing.",
    ctaNoteLine2: "No card, no trial clock.",
    securityEmphasis: "No broker password ever leaves your machine.",
    securityRest:
      "The add-on only sends — shipped as readable source, so you can check that yourself — and nothing here can place a trade or move money. Your record is never sold or shared.",
    waitlistHint: "Rather be told when the AI modules change?",
    waitlistLink: "Leave an address instead",
  },
  live: {
    eyebrow: "live, right now",
    heading: "Gold’s session, as the desk reads it.",
    body: "The same live readout as the dashboard — every arrow a measurement of a session that already happened.",
  },
  features: {
    eyebrow: "What you get",
    heading: "Four modules. Every number computed from your own record.",
    body: "No signal feed, ever. An honest record, the context around your next session, and a reviewer that has read every trade you logged.",
    cards: {
      journal: {
        title: "A journal that computes",
        body: "P&L, risk taken, reward planned — read straight from the terminal. You never type a number in, so you can never flatter one.",
      },
      brief: {
        title: "The session, before it starts",
        body: "Session tone, the one driver that matters, where volatility is likely — each claim sourced to a calendar entry.",
      },
      review: {
        title: "A review of your process",
        body: "Four dimensions, judged against your own history. “Twice your median risk” is a finding. “Risk should be 1%” is a platitude.",
      },
      calendar: {
        title: "The releases that move your pairs",
        body: "Today’s calendar, your timezone, filtered to the pairs you hold — both legs of every one.",
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
        body: "Drop the add-on into your platform, paste one key. Ninety days of history arrives on the first sync.",
        note: "MT5, MT4 or cTrader — TradingView syncs forward from connection",
      },
      {
        title: "Trade",
        body: "Nothing changes. Trade as usual — every closed position lands in the journal by itself.",
        note: "No new habit to keep",
      },
      {
        title: "Review",
        body: "Read the brief before the open. Ask for a written review of any trade — sizing, stop, exit, plan.",
        note: "The part that costs money to run",
      },
    ],
    footnote: "closed positions sync themselves · nothing typed by hand",
  },
  tradeTest: {
    eyebrow: "Try it on your own",
    heading: "See how getALPHA judges the last trade you took.",
    body: "Three questions. None about whether it won — that's the point.",
    riskLabel: "Risk taken on your last trade",
    riskHint: "As a share of your account, if the stop had been hit.",
    stopLabel: "Was the stop recorded before you entered?",
    stopHint: "Before, not after — a stop decided mid-trade is a reaction.",
    newsLabel: "Did you enter within 15 minutes of a high-impact release?",
    newsHint:
      "Non-farm payrolls, CPI, a rate decision — anything on the calendar in red.",
    yes: "Yes",
    no: "No",
    evaluate: "Evaluate my decision",
    empty: "Answer the three, then press evaluate. Nothing leaves your browser.",
    footnote:
      "A rule of thumb, not the real review — that one compares size against your own median and reads your notes.",
    severity: {
      critical: "Process broken",
      warning: "Leaks worth closing",
      sound: "Sound on these three",
    },
    headline: {
      critical: "Critical sizing leak — high risk of ruin, no stop.",
      twoLeaks: "Two leaks. Alone, survivable — together, they compound.",
      oneLeak: "One leak, and it is the kind that repeats.",
      sound: "Nothing broken here. The other twenty are a separate question.",
    },
    finding: {
      noStop:
        "No stop before entry. Risk was undefined — the loss had no floor.",
      riskHigh:
        "{risk}% on one trade. Five losses — an ordinary week — costs about {bite}% of the account.",
      riskHeavy:
        "{risk}% is heavy. Survivable once; worth watching if it's where you always sit.",
      news: "Entered inside 15 minutes of a release. Spreads widen, stops slip — risk taken exceeded risk planned.",
      sound:
        "Risk defensible, stop recorded, no release on top of the entry. The decision holds either way.",
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
    body: "The two AI modules cost money to run — that's what Pro pays for. Everything else stays free.",
    free: {
      label: "Free",
      note: "For as long as you use it.",
      items: [
        "Trade journal with computed P&L and risk",
        "Cumulative P&L curve and outcome distribution",
        "Live charts for your watchlist",
        "Economic calendar in your own timezone",
        "MetaTrader, cTrader or TradingView sync",
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
        "Four dimensions judged against your own history",
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
    },
    dimensions: {
      sizing: "Position sizing",
      stop: "Stop placement",
      exit: "Exit management",
      adherence: "Plan adherence",
    },
  },
  waitlist: {
    eyebrow: "Not ready to sign up",
    heading: "Then don’t. Leave an address instead.",
    body: "One note when the AI modules change. Not a newsletter, not a queue — come in whenever you like.",
  },
  faq: {
    eyebrow: "Questions",
    heading: "Before you connect anything.",
    items: [
      {
        q: "Is getALPHA a trading platform?",
        a: "No. It never places an order or touches your money — it reads what you did and tells you how.",
      },
      {
        q: "Do you see my broker password?",
        a: "No — nowhere to store one. The add-on only sends closed trades, shipped as readable source so you can check that yourself.",
      },
      {
        q: "How does the AI review a trade?",
        a: "Every number is computed in code first; the model judges the finished figures. It never predicts a price.",
      },
      {
        q: "Which brokers are supported?",
        a: "Any broker via desktop MetaTrader 5, MetaTrader 4 or cTrader — the add-on reads your terminal, which has to be running to sync. TradingView works differently: your strategy's own alerts log the trade, no broker connection needed.",
      },
      {
        q: "What is actually free?",
        a: "Journal, sync, charts, calendar, per-instrument breakdown, watchlist. Paying only adds the two AI modules.",
      },
      {
        q: "What happens if I delete my account?",
        a: "Your trades, notes, watchlist and connection are deleted. Only the record that you accepted the terms stays.",
      },
    ],
  },
  disclaimer: {
    label: "What this is not",
    bodyStart: "getALPHA is an educational tool.",
    bodyEmphasis:
      "Not an investment adviser or a broker. No financial advice, no trading signals,",
    bodyEnd:
      "and every decision you make is yours alone. Leveraged trading carries a high risk of loss, and past performance does not predict future results.",
    link: "Read the full risk disclaimer",
  },
};
