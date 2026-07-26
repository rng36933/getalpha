import assert from "node:assert/strict";
import test from "node:test";
import {
  headlinesFor,
  mentions,
  termsFor,
} from "../src/lib/market-data/relevance.ts";

test("gold's terms cover both legs and the pair itself", () => {
  const terms = termsFor("XAU/USD");

  assert.ok(terms.includes("gold"));
  assert.ok(terms.includes("bullion"));
  assert.ok(terms.includes("dollar"));
  assert.ok(terms.includes("fed"));
  assert.ok(terms.includes("xauusd"));
  assert.ok(terms.includes("xau/usd"));
});

test("an unknown leg falls back to its own code", () => {
  assert.ok(termsFor("XPT/USD").includes("xpt"));
});

test("matching is on whole words", () => {
  const gold = termsFor("XAU/USD");
  const crypto = termsFor("ETH/USD");

  assert.equal(mentions("Gold slips as the dollar firms", gold), true);
  assert.equal(mentions("XAUUSD prints a new record", gold), true);

  // The false positives that would make a filtered list useless.
  assert.equal(mentions("Whether the rally holds is unclear", crypto), false);
  assert.equal(mentions("Boeing lifts the Dow", termsFor("GBP/USD")), false);
  assert.equal(mentions("Golden Gate bridge closed", gold), false);
});

test("punctuation around a term still matches", () => {
  const gold = termsFor("XAU/USD");

  assert.equal(mentions("Gold, silver and copper all rise", gold), true);
  assert.equal(mentions("Risk-off bid lifts gold.", gold), true);
  assert.equal(mentions("(XAU/USD) holds support", gold), true);
});

test("picks the newest matching headlines and leaves the rest", () => {
  const headlines = [
    { title: "Gold eases from the highs", publishedAt: "2026-07-26T09:00:00Z" },
    { title: "Wheat futures tumble", publishedAt: "2026-07-26T10:00:00Z" },
    { title: "Dollar firms into the close", publishedAt: "2026-07-26T11:00:00Z" },
  ];

  const picked = headlinesFor(headlines, "XAU/USD");

  assert.deepEqual(
    picked.map((h) => h.title),
    ["Dollar firms into the close", "Gold eases from the highs"],
  );
});

test("nothing relevant returns nothing, not everything", () => {
  const headlines = [
    { title: "Wheat futures tumble", publishedAt: "2026-07-26T10:00:00Z" },
  ];

  assert.deepEqual(headlinesFor(headlines, "XAU/USD"), []);
});

test("the cap is honoured", () => {
  const headlines = Array.from({ length: 9 }, (_, i) => ({
    title: `Gold story ${i}`,
    publishedAt: `2026-07-26T0${i}:00:00Z`,
  }));

  assert.equal(headlinesFor(headlines, "XAU/USD", 3).length, 3);
});
