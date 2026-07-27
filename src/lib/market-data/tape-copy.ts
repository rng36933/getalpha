import { ltCount, ltPlural } from "../i18n/plural.ts";
import type { Locale } from "../i18n/locales.ts";

/**
 * The words the day tape puts around its measurements.
 *
 * Kept beside the computation rather than in the landing dictionary because
 * this readout appears in two places with two different languages: the public
 * page in whichever the visitor chose, and the signed-in dashboard always in
 * English. One shared component, two callers, so the language has to be an
 * argument rather than a property of the page.
 *
 * Several entries are functions because the sentence carries a number, and in
 * Lithuanian a number changes the noun *and the adjective* in front of it —
 * `paskutinės 5 žvakės` but `paskutinių 12 žvakių`. Both counts occur here.
 *
 * Relative imports with extensions: `tests/tape.test.ts` loads the computation
 * through the bare node runner, which resolves neither the `@/` alias nor a
 * missing extension.
 */
export type TapeCopy = {
  vsOpen: string;
  vsOpenDetail: (open: string, now: string) => string;
  vsPriorClose: string;
  vsPriorCloseDetail: (close: string) => string;
  rangePosition: string;
  rangeDetail: (low: string, high: string) => string;
  intradayBars: (count: number) => string;
  intradayValue: (up: number, down: number) => string;
  intradayDetail: string;
  vsAverage: (count: number) => string;
  vsAverageDetail: (count: number, average: string) => string;

  /** The words the card puts around the readings, rather than inside them. */
  readout: {
    up: string;
    down: string;
    flat: string;
    /** Screen-reader names for the arrows. Lowercase, read aloud in a list. */
    arrowUp: string;
    arrowDown: string;
    arrowFlat: string;
    marketClosed: string;
    tradingNow: string;
    ofRange: string;
    /** "<Up> on the session, from an open of <price>." */
    sessionLine: (word: string, open: string) => string;
    barelyTraded: string;
    nothingMeasurable: string;
    allUp: (n: number) => string;
    allDown: (n: number) => string;
    allFlat: (n: number) => string;
    leaningUp: (counts: string, total: number) => string;
    leaningDown: (counts: string, total: number) => string;
    noLean: (counts: string, total: number) => string;
    countUp: (n: number) => string;
    countDown: (n: number) => string;
    countFlat: (n: number) => string;
    rangeTiny: string;
    rangeWide: (times: number) => string;
    rangeQuiet: (times: number) => string;
    rangeNormal: (times: number) => string;
    sessionOf: (date: string) => string;
    pricedAt: string;
    refreshNote: string;
    staleNote: string;
    footnote: string;
  };
};

const en: TapeCopy = {
  vsOpen: "Against today's open",
  vsOpenDetail: (open, now) => `Opened at ${open}, now ${now}.`,
  vsPriorClose: "Against yesterday's close",
  vsPriorCloseDetail: (close) => `Previous session closed at ${close}.`,
  rangePosition: "Position in today's range",
  rangeDetail: (low, high) => `Range ${low} to ${high}.`,
  intradayBars: (count) => `Last ${count} bars`,
  intradayValue: (up, down) => `${up} up / ${down} down`,
  intradayDetail: "Bars that closed above their own open, most recent first.",
  vsAverage: (count) => `Against its ${count}-bar average`,
  vsAverageDetail: (count, average) =>
    `Average of the last ${count} bars is ${average}.`,
  readout: {
    up: "Up",
    down: "Down",
    flat: "Flat",
    arrowUp: "up",
    arrowDown: "down",
    arrowFlat: "little changed",
    marketClosed: "market closed",
    tradingNow: "trading now",
    ofRange: "of range",
    sessionLine: (word, open) => `${word} on the session, from an open of ${open}.`,
    barelyTraded:
      "This session has barely traded — its whole range so far is a fraction of a normal day. Almost certainly a closed market. The arrows below are correct and mean very little until it opens.",
    nothingMeasurable: "Nothing measurable yet.",
    allUp: (n) => `All ${n} readings point up.`,
    allDown: (n) => `All ${n} readings point down.`,
    allFlat: (n) =>
      `All ${n} readings are flat — nothing has moved far enough to call.`,
    leaningUp: (counts, total) => `Leaning up: ${counts}, of ${total}.`,
    leaningDown: (counts, total) => `Leaning down: ${counts}, of ${total}.`,
    noLean: (counts, total) => `No lean either way: ${counts}, of ${total}.`,
    countUp: (n) => `${n} up`,
    countDown: (n) => `${n} down`,
    countFlat: (n) => `${n} flat`,
    rangeTiny: "The session's range is under a twentieth of a normal day.",
    rangeWide: (times) =>
      `A wider session than usual — ${times}× the recent average range.`,
    rangeQuiet: (times) =>
      `A quieter session than usual — ${times}× the recent average range.`,
    rangeNormal: (times) =>
      `Range is about normal for this instrument (${times}× the recent average).`,
    sessionOf: (date) => `Session of ${date}`,
    pricedAt: ", priced at ",
    refreshNote:
      ". Intraday readings refresh every few minutes, not tick by tick — the free price feed allows eight requests a minute across the whole desk.",
    staleNote:
      "The price feed did not answer just now, so this is the last series we stored. The arrows describe that moment, not this one.",
    footnote:
      "Every arrow above is a measurement of the session that has already happened — where price sits against its open, its range and its own average. None of it is a forecast, and none of it is a suggestion to buy or sell anything.",
  },
};

const lt: TapeCopy = {
  vsOpen: "Prieš šiandienos atidarymą",
  vsOpenDetail: (open, now) => `Atidarė ties ${open}, dabar ${now}.`,
  vsPriorClose: "Prieš vakarykštį uždarymą",
  vsPriorCloseDetail: (close) => `Praėjusi sesija užsidarė ties ${close}.`,
  rangePosition: "Vieta šiandienos svyravimo ruože",
  rangeDetail: (low, high) => `Ruožas nuo ${low} iki ${high}.`,
  // The adjective agrees with the numeral too, which is why this is a function
  // and not a template with a hole in it: `paskutinės 5 žvakės`, but
  // `paskutinių 12 žvakių`.
  intradayBars: (count) =>
    `${ltPlural(count, "Paskutinė", "Paskutinės", "Paskutinių")} ${ltCount(
      count,
      "žvakė",
      "žvakės",
      "žvakių",
    )}`,
  intradayValue: (up, down) => `${up} kyla / ${down} krinta`,
  intradayDetail:
    "Žvakės, užsidariusios virš savo pačių atidarymo; naujausios pirmos.",
  // Genitive whatever the count, because it is governed by "vidurkis" rather
  // than by the numeral — `penkių žvakių vidurkis`, `dvylikos žvakių vidurkis`.
  vsAverage: (count) => `Prieš ${count} žvakių vidurkį`,
  vsAverageDetail: (count, average) =>
    `Paskutinių ${count} žvakių vidurkis — ${average}.`,
  readout: {
    up: "Kyla",
    down: "Krinta",
    flat: "Stovi",
    arrowUp: "kyla",
    arrowDown: "krinta",
    arrowFlat: "beveik nepakito",
    marketClosed: "rinka uždaryta",
    tradingNow: "prekiaujama dabar",
    ofRange: "ruožo",
    sessionLine: (word, open) =>
      `${word} per sesiją, atidarius ties ${open}.`,
    barelyTraded:
      "Šioje sesijoje beveik neprekiauta — visas jos ruožas kol kas yra tik dalelė įprastos dienos. Beveik neabejotinai uždaryta rinka. Rodyklės žemiau teisingos, bet iki atidarymo reiškia labai nedaug.",
    nothingMeasurable: "Kol kas nėra ką matuoti.",
    // The numeral governs the noun: `visi 5 rodikliai`, but `visi 12 rodiklių`.
    // Never more than five here, though the rule is written out anyway — a cap
    // that changes later must not quietly produce broken grammar.
    allUp: (n) =>
      `Visi ${ltCount(n, "rodiklis", "rodikliai", "rodiklių")} rodo aukštyn.`,
    allDown: (n) =>
      `Visi ${ltCount(n, "rodiklis", "rodikliai", "rodiklių")} rodo žemyn.`,
    allFlat: (n) =>
      `Visi ${ltCount(n, "rodiklis", "rodikliai", "rodiklių")} stovi vietoje — niekas nepajudėjo pakankamai, kad būtų galima ką nors pasakyti.`,
    leaningUp: (counts, total) => `Linksta aukštyn: ${counts}, iš ${total}.`,
    leaningDown: (counts, total) => `Linksta žemyn: ${counts}, iš ${total}.`,
    noLean: (counts, total) =>
      `Nėra aiškaus polinkio: ${counts}, iš ${total}.`,
    countUp: (n) => `${n} kyla`,
    countDown: (n) => `${n} krinta`,
    countFlat: (n) => `${n} vietoje`,
    rangeTiny: "Sesijos ruožas nesiekia nė dvidešimtosios įprastos dienos.",
    rangeWide: (times) =>
      `Platesnė sesija nei įprastai — ${times}× naujausio vidutinio ruožo.`,
    rangeQuiet: (times) =>
      `Ramesnė sesija nei įprastai — ${times}× naujausio vidutinio ruožo.`,
    rangeNormal: (times) =>
      `Ruožas šiam instrumentui maždaug įprastas (${times}× naujausio vidurkio).`,
    sessionOf: (date) => `${date} sesija`,
    pricedAt: ", kaina ",
    refreshNote:
      ". Dienos eigos rodmenys atsinaujina kas kelias minutes, o ne kas kainos pokytį — nemokamas kainų šaltinis leidžia aštuonias užklausas per minutę visai sistemai.",
    staleNote:
      "Kainų šaltinis ką tik neatsakė, tad tai paskutinė mūsų išsaugota serija. Rodyklės apibūdina tą, o ne šią akimirką.",
    footnote:
      "Kiekviena rodyklė aukščiau matuoja jau įvykusią sesiją — kur kaina stovi prieš savo atidarymą, savo ruožą ir savo pačios vidurkį. Nė vienas iš šių skaičių nėra prognozė ir nė vienas nėra siūlymas pirkti ar parduoti.",
  },
};

const TAPE: Record<Locale, TapeCopy> = { en, lt };

export function tapeCopy(locale: Locale): TapeCopy {
  return TAPE[locale];
}
