import assert from "node:assert/strict";
import test from "node:test";
import { currenciesFromSymbols } from "../src/lib/market-data/currencies.ts";

test("both legs of a pair count", () => {
  assert.deepEqual(currenciesFromSymbols(["EUR/USD"]), ["USD", "EUR"]);
});

test("metals and crypto contribute their quote currency", () => {
  // Gold has no calendar of its own, but a US release moves XAU/USD, and
  // somebody holding it through an NFP print needs that release on screen.
  assert.deepEqual(currenciesFromSymbols(["XAU/USD"]), ["USD"]);
  assert.deepEqual(currenciesFromSymbols(["BTC/USD"]), ["USD"]);
});

test("duplicates collapse and the order is stable", () => {
  // Ordered by the canonical list, not by watchlist order, so the label reads
  // the same on every visit.
  assert.deepEqual(
    currenciesFromSymbols(["GBP/JPY", "EUR/USD", "USD/JPY"]),
    ["USD", "EUR", "GBP", "JPY"],
  );
  assert.deepEqual(
    currenciesFromSymbols(["EUR/USD", "GBP/JPY", "USD/JPY"]),
    ["USD", "EUR", "GBP", "JPY"],
  );
});

test("separators other than a slash still parse", () => {
  assert.deepEqual(currenciesFromSymbols(["EUR-USD"]), ["USD", "EUR"]);
  assert.deepEqual(currenciesFromSymbols(["eur/usd"]), ["USD", "EUR"]);
});

test("a synced trade's asset has no separator at all, and still parses", () => {
  // MT5 sends "EURUSD", not "EUR/USD" — the six-letter symbol is base and
  // quote run together, which is what the per-pair page's asset field is.
  assert.deepEqual(currenciesFromSymbols(["EURUSD"]), ["USD", "EUR"]);
  assert.deepEqual(currenciesFromSymbols(["GBPJPY"]), ["GBP", "JPY"]);
  assert.deepEqual(currenciesFromSymbols(["XAUUSD"]), ["USD"]);
  assert.deepEqual(currenciesFromSymbols(["BTCUSD"]), ["USD"]);
});

test("an empty watchlist yields nothing", () => {
  assert.deepEqual(currenciesFromSymbols([]), []);
  assert.deepEqual(currenciesFromSymbols(["XAU/XAG"]), []);
});
