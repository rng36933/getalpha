import type { Locale } from "../locales.ts";

/**
 * Every word on the Macro Desk page: `MacroDeskPage` itself, and
 * `ReadingList`/`CotList`/`CotDial` from `MacroReadings.tsx`.
 *
 * `reading.label`, `row.label`, and any date/percentage the feed publishes are
 * data, not UI copy, and are never translated — same rule as elsewhere.
 */
export type MacroDeskCopy = {
  title: string;
  subtitle: string;
  macroSourceLabel: string;
  positioningSourceLabel: string;
  yieldsCardTitle: string;
  inflationCardTitle: string;
  policyRatesCardTitle: string;
  positioningCardTitle: string;
  noReadings: string;
  rangeAriaLabel: (percent: number, low: string | null, high: string | null) => string;
  rangeLabel: (percent: number) => string;
  noPositioning: string;
  dialAriaLabel: (label: string, longShare: number, skew: number, direction: string) => string;
  netLabel: (direction: string) => string;
  long: string;
  short: string;
  positioningFootnote: (asOf: string) => string;
};

const en: MacroDeskCopy = {
  title: "Macro Desk",
  subtitle:
    "Rates, the dollar, inflation and positioning — the context a session sits in.",
  macroSourceLabel: "Macro series",
  positioningSourceLabel: "Positioning",
  yieldsCardTitle: "Yields and the dollar",
  inflationCardTitle: "Inflation",
  policyRatesCardTitle: "Policy rates",
  positioningCardTitle: "Positioning",
  noReadings: "No readings — see above.",
  rangeAriaLabel: (percent, low, high) =>
    `${percent}% of its 12-month range, between ${low} and ${high}`,
  rangeLabel: (percent) => `${percent}% of 12m range`,
  noPositioning:
    "Nothing here matches your watchlist. The CFTC publishes this report for gold, silver, the euro, the pound, the yen and bitcoin — add one of those and its positioning appears.",
  dialAriaLabel: (label, longShare, skew, direction) =>
    `${label}: ${longShare} percent of speculative positions are long, ${skew} percent net ${direction}.`,
  netLabel: (direction) => `net ${direction}`,
  long: "long",
  short: "short",
  positioningFootnote: (asOf) =>
    `Non-commercial positions from the CFTC, held on ${asOf} and published the following Friday. The lag is the report itself, not this page.`,
};

const lt: MacroDeskCopy = {
  title: "Makro skydelis",
  subtitle:
    "Palūkanos, doleris, infliacija ir pozicionavimas — kontekstas, kuriame vyksta sesija.",
  macroSourceLabel: "Makro serijos",
  positioningSourceLabel: "Pozicionavimas",
  yieldsCardTitle: "Pajamingumas ir doleris",
  inflationCardTitle: "Infliacija",
  policyRatesCardTitle: "Bazinės palūkanos",
  positioningCardTitle: "Pozicionavimas",
  noReadings: "Rodmenų nėra — žr. aukščiau.",
  rangeAriaLabel: (percent, low, high) =>
    `${percent}% jo 12 mėnesių intervalo, tarp ${low} ir ${high}`,
  rangeLabel: (percent) => `${percent}% 12 mėn. intervalo`,
  noPositioning:
    "Nieko čia neatitinka tavo stebimųjų sąrašo. CFTC skelbia šią ataskaitą auksui, sidabrui, eurui, svarui, jenai ir bitkoinui — pridėk vieną iš jų, ir pasirodys jo pozicionavimas.",
  dialAriaLabel: (label, longShare, skew, direction) =>
    `${label}: ${longShare} % spekuliacinių pozicijų yra ilgosios, ${skew} % grynojo ${direction === "long" ? "ilgumo" : "trumpumo"}.`,
  netLabel: (direction) =>
    `grynasis ${direction === "long" ? "ilgumas" : "trumpumas"}`,
  long: "ilgosios",
  short: "trumposios",
  positioningFootnote: (asOf) =>
    `Nekomercinės pozicijos iš CFTC, fiksuotos ${asOf} ir paskelbtos kitą penktadienį. Vėlavimas yra pačios ataskaitos, ne šio puslapio, ypatybė.`,
};

const MACRO_DESK: Record<Locale, MacroDeskCopy> = { en, lt };

export function macroDeskCopy(locale: Locale): MacroDeskCopy {
  return MACRO_DESK[locale];
}
