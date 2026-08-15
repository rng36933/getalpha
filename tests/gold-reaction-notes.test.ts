import assert from "node:assert/strict";
import test from "node:test";
import { goldReactionNote } from "../src/lib/market-data/gold-reaction-notes.ts";

test("non-farm payrolls gets its own note, not the generic fallback", () => {
  const note = goldReactionNote("Non-Farm Payrolls");
  assert.match(note, /largest single-event move/);
});

test("NFP abbreviation is recognised the same as the full name", () => {
  assert.equal(goldReactionNote("NFP"), goldReactionNote("Non-Farm Payrolls"));
});

test("a Fed speech is not mistaken for a rate decision", () => {
  const note = goldReactionNote("Fed Chair Powell Speaks");
  assert.match(note, /no fixed script/);
  assert.doesNotMatch(note, /press conference starts/);
});

test("a rate decision gets the two-move note", () => {
  const note = goldReactionNote("FOMC Statement");
  assert.match(note, /press conference starts/);
});

test("CPI and PPI get different notes from each other", () => {
  assert.notEqual(goldReactionNote("CPI m/m"), goldReactionNote("PPI m/m"));
});

test("matching is case-insensitive", () => {
  assert.equal(goldReactionNote("cpi m/m"), goldReactionNote("CPI M/M"));
});

test("an unrecognised title falls back to the generic note", () => {
  const note = goldReactionNote("Some Made-Up Release Nobody Has Heard Of");
  assert.match(note, /often reacts to USD data like this/);
});

test("PMI and ISM both hit the lower-volatility note", () => {
  const pmi = goldReactionNote("ISM Manufacturing PMI");
  assert.match(pmi, /lower-volatility/);
});
