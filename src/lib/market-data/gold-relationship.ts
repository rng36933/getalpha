/**
 * How a macro series typically relates to gold, said in one fixed sentence.
 *
 * Textbook relationships, not a computed correlation. A rolling correlation
 * against XAUUSD would drift day to day and can flip sign on a noisy window
 * — the kind of number that reads as a prediction even when it is not meant
 * as one, on a page whose whole premise is that this platform never scores a
 * trade for the reader. These sentences do not change with today's print,
 * cannot be "wrong" tomorrow the way a correlation coefficient can, and are
 * the same explanation an economics textbook would give.
 *
 * Deliberately not exhaustive commentary — one mechanism per series, stated
 * plainly, and never phrased as what gold will do next. The dashboard
 * already has a standing rule against a signal feed of any kind; this is the
 * same boundary applied to the macro cards.
 */
export const GOLD_RELATIONSHIP: Record<string, string> = {
  DGS2:
    "Higher short-term yields raise the opportunity cost of holding gold, which pays no interest — typically a headwind.",
  DGS10:
    "Real yields matter most for gold. Rising 10-year yields typically pressure gold; falling yields typically support it.",
  T10Y2Y:
    "A steeper curve usually reflects rising growth or inflation expectations, which can support gold either way — the level matters less here than CPI or the Fed funds rate.",
  DTWEXBGS:
    "Gold is priced in dollars. A stronger dollar makes gold costlier for buyers in other currencies and typically pressures it; a weaker dollar typically supports it.",
  CPIAUCSL:
    "Gold is traditionally bought as an inflation hedge — a hotter CPI print often supports demand for it.",
  CPILFESL:
    "The Fed's preferred read on underlying inflation. A hotter core print often supports gold the same way headline CPI does.",
  PCEPI:
    "The Fed's own target inflation gauge. A hotter print often supports gold as an inflation hedge, and can shift rate-cut expectations too.",
  PCEPILFE:
    "The single figure the Fed watches most closely for policy decisions — a hotter core PCE print often supports gold on both the inflation-hedge and rate-expectation channels.",
  DFF:
    "Higher policy rates raise the opportunity cost of holding gold and typically support the dollar — both a headwind. Rate cuts typically support gold.",
  ECBDFR:
    "Affects the euro rather than gold directly, but a weaker EUR/USD from ECB policy tends to move gold priced in dollars the same way a stronger dollar does.",
  IUDSOIA:
    "Affects the pound rather than gold directly, but a weaker GBP/USD from BoE policy tends to move gold priced in dollars the same way a stronger dollar does.",
};
