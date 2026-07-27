import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LOCALE,
  isLocale,
  localeFromPath,
  pathForLocale,
  suggestLocale,
} from "../src/lib/i18n/locales.ts";

test("English is served unprefixed", () => {
  // Every link already in the wild points at an unprefixed path.
  assert.equal(DEFAULT_LOCALE, "en");
  assert.equal(pathForLocale("/", "en"), "/");
  assert.equal(pathForLocale("/terms", "en"), "/terms");
});

test("Lithuanian lives under /lt", () => {
  assert.equal(pathForLocale("/", "lt"), "/lt");
  assert.equal(pathForLocale("/terms", "lt"), "/lt/terms");
});

test("switching language is reversible from either side", () => {
  // The switcher builds its href from the current path, so a round trip that
  // does not land back where it started would strand somebody.
  assert.equal(pathForLocale(pathForLocale("/terms", "lt"), "en"), "/terms");
  assert.equal(pathForLocale(pathForLocale("/", "lt"), "en"), "/");
  assert.equal(pathForLocale("/lt/terms", "lt"), "/lt/terms");
});

test("the prefix is matched as a whole segment", () => {
  assert.equal(localeFromPath("/lt"), "lt");
  assert.equal(localeFromPath("/lt/terms"), "lt");

  // A prefix match would claim these, and both are plausible future routes.
  assert.equal(localeFromPath("/lteral"), null);
  assert.equal(localeFromPath("/ltd"), null);
  assert.equal(localeFromPath("/"), null);
});

test("a stored choice beats the country every time", () => {
  // A Lithuanian who switched to English, or an English speaker living in
  // Lithuania. Without this they would be overridden on every page load.
  assert.equal(suggestLocale({ cookie: "en", country: "LT" }), "en");
  assert.equal(suggestLocale({ cookie: "lt", country: "US" }), "lt");
});

test("a Lithuanian visitor with no stored choice is offered Lithuanian", () => {
  assert.equal(suggestLocale({ country: "LT" }), "lt");
  assert.equal(suggestLocale({ country: "lt" }), "lt");
});

test("an unknown country is left alone rather than guessed at", () => {
  // The header is absent when running locally and can be absent at the edge.
  // Guessing on absence is how everybody ends up on the wrong page.
  assert.equal(suggestLocale({}), "en");
  assert.equal(suggestLocale({ country: null }), "en");
  assert.equal(suggestLocale({ country: "" }), "en");
});

test("a nonsense cookie is ignored, not trusted", () => {
  assert.equal(suggestLocale({ cookie: "de", country: "LT" }), "lt");
  assert.equal(suggestLocale({ cookie: "", country: "US" }), "en");
});

test("isLocale rejects anything not offered", () => {
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("lt"), true);
  assert.equal(isLocale("ru"), false);
  assert.equal(isLocale(undefined), false);
  assert.equal(isLocale(null), false);
});
