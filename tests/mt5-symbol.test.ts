import assert from "node:assert/strict";
import test from "node:test";
import { normaliseSymbol } from "../src/lib/mt5/symbol.ts";

test("the suffix this account actually sends is removed", () => {
  // PU Prime: what arrived in the first real sync.
  assert.equal(normaliseSymbol("XAUUSD.s"), "XAUUSD");
  assert.equal(normaliseSymbol("XAUUSD.S"), "XAUUSD");
  assert.equal(normaliseSymbol("NAS100.S"), "NAS100");
  assert.equal(normaliseSymbol("EURGBP.S"), "EURGBP");
  assert.equal(normaliseSymbol("DJ30.S"), "DJ30");
  assert.equal(normaliseSymbol("AUDJPY.S"), "AUDJPY");
});

test("a hand-typed symbol and a synced one become the same instrument", () => {
  // The whole point: otherwise the per-pair page shows two XAUUSDs, each with a
  // win rate computed from half the trades.
  assert.equal(normaliseSymbol("XAUUSD"), normaliseSymbol("XAUUSD.s"));
  assert.equal(normaliseSymbol("xauusd"), normaliseSymbol("XAUUSD.S"));
});

test("the common broker markers are covered", () => {
  assert.equal(normaliseSymbol("EURUSD.pro"), "EURUSD");
  assert.equal(normaliseSymbol("EURUSD.ecn"), "EURUSD");
  assert.equal(normaliseSymbol("EURUSD.raw"), "EURUSD");
  assert.equal(normaliseSymbol("EURUSD_m"), "EURUSD");
  assert.equal(normaliseSymbol("EURUSD-ECN"), "EURUSD");
  assert.equal(normaliseSymbol("GBPUSD#"), "GBPUSD");
  assert.equal(normaliseSymbol("GBPUSD!"), "GBPUSD");
});

test("a symbol with no suffix is only upper-cased", () => {
  assert.equal(normaliseSymbol("ETHUSD"), "ETHUSD");
  assert.equal(normaliseSymbol("btcusd"), "BTCUSD");
  assert.equal(normaliseSymbol("  XAUUSD  "), "XAUUSD");
});

test("nothing recognisable is left alone rather than emptied", () => {
  // Stripping here would leave a name nobody can read, which is worse than a
  // name with a suffix on it.
  assert.equal(normaliseSymbol(".PRO"), ".PRO");
  assert.equal(normaliseSymbol("US.s"), "US.S");
  assert.equal(normaliseSymbol(""), "");
});

test("a suffix in the middle is not a suffix", () => {
  assert.equal(normaliseSymbol("XAU.sUSD"), "XAU.SUSD");
});

test("normalising twice changes nothing", () => {
  // It runs on every sync over the same rows, so it has to be idempotent.
  for (const symbol of ["XAUUSD.s", "EURUSD_m", "GBPUSD#", "ETHUSD"]) {
    const once = normaliseSymbol(symbol);
    assert.equal(normaliseSymbol(once), once);
  }
});
