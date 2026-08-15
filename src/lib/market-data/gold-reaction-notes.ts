/**
 * A factual, per-event-type note on how XAUUSD has historically behaved
 * around a given kind of USD release.
 *
 * Built for the pre-release news-alert email, which used to print the same
 * one-size-fits-all sentence for every event — NFP and a PMI release read
 * identically, which told a reader nothing they couldn't already guess.
 * Same rule as the rest of the product: describes conditions, never
 * instructs. "NFP often carries the month's largest single-event move" is a
 * fact about how the release has behaved; it is not a reason to trade it.
 *
 * Matched by keyword against the calendar feed's own title text (ForexFactory
 * naming), ordered most-specific first so e.g. "Fed Chair Powell Speaks"
 * hits the speech note rather than being mistaken for a rate decision.
 */

type Rule = { test: RegExp; note: string };

const RULES: Rule[] = [
  {
    test: /non.?farm payrolls|\bnfp\b/i,
    note:
      "Non-farm payrolls is historically the most volatile scheduled USD release for gold — the first minute or two after the print often carries the largest single-event move of the month, and an initial spike can partially reverse once the number is digested.",
  },
  {
    test: /speaks|speech|testimony|press conference|q&a/i,
    note:
      "A speech has no fixed script or length, so the reaction window is less predictable than a scheduled data print — it can start and stop repeatedly as the speaker takes questions, rather than landing in one sharp move.",
  },
  {
    test: /fomc|federal funds rate|interest rate decision|rate statement/i,
    note:
      "Rate decisions often produce two separate moves for gold — one on the decision itself, and a second, sometimes larger one when the press conference starts roughly half an hour later.",
  },
  {
    test: /\bcpi\b|consumer price index|core pce|pce price index/i,
    note:
      "Gold pays no yield, so inflation prints like this tend to move it through the market's revised read on future Fed rate policy — not just whether the headline number beat or missed forecast.",
  },
  {
    test: /\bppi\b|producer price index/i,
    note:
      "PPI trades as an early read on inflation sentiment ahead of CPI, but has historically caused a smaller gold reaction than CPI itself.",
  },
  {
    test: /gdp/i,
    note:
      "GDP is a lagging, largely-already-priced-in number — gold's reaction is usually smaller than a same-week inflation or jobs print, unless the release carries a large revision to a prior quarter.",
  },
  {
    test: /retail sales/i,
    note:
      "Retail sales feeds the same growth read as GDP — moves are typically moderate for gold unless the number lands far from forecast.",
  },
  {
    test: /unemployment claims|jobless claims/i,
    note:
      "Weekly claims is lower-impact for gold than non-farm payrolls even when the calendar flags it red — reactions tend to be smaller and shorter-lived.",
  },
  {
    test: /\bpmi\b|\bism\b/i,
    note:
      "PMI and ISM releases are usually lower-volatility for gold than NFP or CPI, though a reading far from forecast can still move price sharply.",
  },
];

const FALLBACK_NOTE =
  "XAUUSD often reacts to USD data like this. Spreads can widen and price can gap through nearby levels in the minutes around the release.";

/** Looked up by the calendar feed's event title; falls back to a generic note for anything unmatched. */
export function goldReactionNote(eventTitle: string): string {
  const rule = RULES.find(({ test }) => test.test(eventTitle));
  return rule ? rule.note : FALLBACK_NOTE;
}
