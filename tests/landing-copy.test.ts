import assert from "node:assert/strict";
import test from "node:test";
import { landingCopy } from "../src/lib/i18n/landing.ts";
import { LOCALES } from "../src/lib/i18n/locales.ts";

const en = landingCopy("en");
const lt = landingCopy("lt");

/** Every leaf string in a dictionary, keyed by its path. */
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

const flatEn = flatten(en);
const flatLt = flatten(lt);

test("the two dictionaries have exactly the same shape", () => {
  // The type already forbids a missing key. It does not forbid a short array,
  // and a Lithuanian FAQ with five answers where the English has six would
  // render without complaint — one question simply gone, which nobody would
  // notice until a reader asked about it.
  assert.deepEqual([...flatLt.keys()].sort(), [...flatEn.keys()].sort());
});

test("no Lithuanian string was left as its English original", () => {
  const untranslated: string[] = [];

  for (const [path, text] of flatEn) {
    // Names and prices are the same in both and must not be flagged.
    if (path === "switchTo" || path.includes("pro.label")) continue;
    if (flatLt.get(path) === text) untranslated.push(path);
  }

  assert.deepEqual(
    untranslated,
    [],
    `left in English: ${untranslated.join(", ")}`,
  );
});

test("nothing is blank in either language", () => {
  for (const [path, text] of [...flatEn, ...flatLt]) {
    assert.ok(text.trim().length > 0, `${path} is empty`);
  }
});

test("the switcher names the other language, not the current one", () => {
  // It is a button reading "Lietuvių" on the English page. Getting this
  // backwards is easy and leaves the control looking like a label.
  assert.equal(en.switchTo, "Lietuvių");
  assert.equal(lt.switchTo, "English");
});

test("a dictionary exists for every offered locale", () => {
  for (const locale of LOCALES) {
    assert.ok(landingCopy(locale).hero.cta.length > 0);
  }
});

test("the Lithuanian page keeps the trading vocabulary readers use", () => {
  // Deliberate: "nuostolio ribojimo pavedimas" is correct Lithuanian and no
  // trader says it. Copy that reads like a translation reads like a foreign
  // product, which is the opposite of the point of translating it.
  assert.match(lt.hero.body, /stop loss/);
});
