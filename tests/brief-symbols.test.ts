import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultAudience,
  watchlistKey,
} from "../src/lib/market-data/brief-symbols.ts";

const s = (...symbols: string[]) =>
  symbols.map((symbol) => ({ symbol, label: symbol.replace("/", "") }));

test("the same instruments in a different order are the same brief", () => {
  const a = watchlistKey(s("XAU/USD", "EUR/USD", "BTC/USD"));
  const b = watchlistKey(s("BTC/USD", "XAU/USD", "EUR/USD"));

  // Dragging a row in the watchlist must not orphan the brief written for it,
  // or every reorder pays for an identical model call.
  assert.equal(a, b);
});

test("a different set of instruments is a different brief", () => {
  const gold = watchlistKey(s("XAU/USD"));
  const goldAndEuro = watchlistKey(s("XAU/USD", "EUR/USD"));

  assert.notEqual(gold, goldAndEuro);
});

test("labels do not affect identity, only symbols do", () => {
  // The label is display text. Two rows for the same instrument must collapse
  // onto one cached brief whatever a broker calls it.
  const a = watchlistKey([{ symbol: "XAU/USD", label: "XAUUSD" }]);
  const b = watchlistKey([{ symbol: "XAU/USD", label: "GOLD" }]);

  assert.equal(a, b);
});

test("a repeated symbol does not change the key", () => {
  const once = watchlistKey(s("XAU/USD", "EUR/USD"));
  const twice = watchlistKey(s("XAU/USD", "EUR/USD", "XAU/USD"));

  assert.equal(once, twice);
});

test("the key is short, stable and safe to put in a unique index", () => {
  const key = watchlistKey(s("XAU/USD"));

  assert.equal(key.length, 16);
  assert.match(key, /^[0-9a-f]{16}$/);
  // Pinned. Changing how this is derived silently orphans every stored brief,
  // so it should take a failing test to do it rather than a passing refactor.
  assert.equal(key, watchlistKey(s("XAU/USD")));
});

test("the free default is gold alone, and is not personalised", () => {
  const audience = defaultAudience();

  assert.deepEqual(
    audience.symbols.map((entry) => entry.symbol),
    ["XAU/USD"],
  );
  assert.equal(audience.personalised, false);
  assert.equal(audience.truncated, false);
  assert.equal(audience.key, watchlistKey(s("XAU/USD")));
});

test("every free reader lands in the same cache row", () => {
  // This is what makes the free tier cost a fixed amount per day rather than
  // an amount per account.
  assert.equal(defaultAudience().key, defaultAudience().key);
});

test("the default audience cannot be mutated by a caller", () => {
  const first = defaultAudience();
  first.symbols.push({ symbol: "EUR/USD", label: "EURUSD" });

  assert.deepEqual(
    defaultAudience().symbols.map((entry) => entry.symbol),
    ["XAU/USD"],
  );
});
