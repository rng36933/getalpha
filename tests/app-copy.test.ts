import assert from "node:assert/strict";
import test from "node:test";
import { calendarCopy } from "../src/lib/i18n/app/calendar.ts";
import { dashboardCopy } from "../src/lib/i18n/app/dashboard.ts";
import { journalCopy } from "../src/lib/i18n/app/journal.ts";
import { macroDeskCopy } from "../src/lib/i18n/app/macroDesk.ts";
import { pairsCopy } from "../src/lib/i18n/app/pairs.ts";
import { pricingCopy } from "../src/lib/i18n/app/pricing.ts";
import { referralCopy } from "../src/lib/i18n/app/referral.ts";
import { settingsCopy } from "../src/lib/i18n/app/settings.ts";
import { sharedCopy } from "../src/lib/i18n/app/shared.ts";
import { supportCopy } from "../src/lib/i18n/app/support.ts";
import { navCopy } from "../src/lib/i18n/nav.ts";

/**
 * Every dictionary that backs the signed-in dashboard, mirroring
 * `tests/landing-copy.test.ts`'s checks for the public landing page.
 *
 * Function-valued fields (the majority here — most app copy is a template
 * taking a count or a date) are not flattened, same as the landing test:
 * `flatten` only walks strings, arrays and plain objects. That is a real gap
 * for this tree specifically, since so much of it is functions — those need a
 * manual read-through rather than an automated equality check.
 */
const DICTIONARIES: Record<string, { en: unknown; lt: unknown }> = {
  nav: { en: navCopy("en"), lt: navCopy("lt") },
  shared: { en: sharedCopy("en"), lt: sharedCopy("lt") },
  dashboard: { en: dashboardCopy("en"), lt: dashboardCopy("lt") },
  journal: { en: journalCopy("en"), lt: journalCopy("lt") },
  pairs: { en: pairsCopy("en"), lt: pairsCopy("lt") },
  calendar: { en: calendarCopy("en"), lt: calendarCopy("lt") },
  macroDesk: { en: macroDeskCopy("en"), lt: macroDeskCopy("lt") },
  pricing: { en: pricingCopy("en"), lt: pricingCopy("lt") },
  referral: { en: referralCopy("en"), lt: referralCopy("lt") },
  support: { en: supportCopy("en"), lt: supportCopy("lt") },
  settings: { en: settingsCopy("en"), lt: settingsCopy("lt") },
};

/** Every leaf string in a dictionary, keyed by its path. Skips functions. */
function flatten(value: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();

  if (typeof value === "string") {
    out.set(prefix, value);
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      for (const [key, text] of flatten(item, `${prefix}[${index}]`)) {
        out.set(key, text);
      }
    });
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      for (const [path, text] of flatten(child, prefix ? `${prefix}.${key}` : key)) {
        out.set(path, text);
      }
    }
  }

  return out;
}

// Fields where the Lithuanian value is deliberately identical to English:
// product/plan names, symbols, and single words that read the same either way.
const SAME_ON_PURPOSE = new Set([
  "pro.name",
  "mt5CardTitle",
  "table.mt5Badge",
  "table.exitLabels.unknown",
]);

for (const [name, { en, lt }] of Object.entries(DICTIONARIES)) {
  const flatEn = flatten(en);
  const flatLt = flatten(lt);

  test(`${name}: the two dictionaries have exactly the same shape`, () => {
    assert.deepEqual([...flatLt.keys()].sort(), [...flatEn.keys()].sort());
  });

  test(`${name}: no Lithuanian string was left as its English original`, () => {
    const untranslated: string[] = [];

    for (const [path, text] of flatEn) {
      if (SAME_ON_PURPOSE.has(path)) continue;
      if (flatLt.get(path) === text) untranslated.push(path);
    }

    assert.deepEqual(
      untranslated,
      [],
      `${name}: left in English: ${untranslated.join(", ")}`,
    );
  });

  test(`${name}: nothing is blank in either language`, () => {
    for (const [path, text] of [...flatEn, ...flatLt]) {
      assert.ok(text.trim().length > 0, `${name}.${path} is empty`);
    }
  });
}
