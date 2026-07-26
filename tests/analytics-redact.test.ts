import assert from "node:assert/strict";
import test from "node:test";
import { safeLabel } from "../src/lib/analytics/redact.ts";

test("a normal symbol passes through, normalised", () => {
  assert.equal(safeLabel("XAUUSD"), "XAUUSD");
  assert.equal(safeLabel(" eurusd "), "EURUSD");
  assert.equal(safeLabel("EUR/USD"), "EUR/USD");
  assert.equal(safeLabel("BTC-PERP"), "BTC-PERP");
});

test("a timeframe passes through", () => {
  assert.equal(safeLabel("H1"), "H1");
  assert.equal(safeLabel("m15"), "M15");
});

test("free text collapses to other", () => {
  // The failure this guards against: the instrument field used as a notepad.
  assert.equal(safeLabel("gold long, told Jonas about it"), "other");
  assert.equal(safeLabel("felt anxious after the CPI print"), "other");
  assert.equal(safeLabel("almintasv@gmail.com"), "other");
});

test("anything over twelve characters collapses, even if symbol-shaped", () => {
  assert.equal(safeLabel("A".repeat(12)), "A".repeat(12));
  assert.equal(safeLabel("A".repeat(13)), "other");
});

test("missing values are unknown, not other", () => {
  // "unknown" means nothing was recorded; "other" means something was and it
  // was withheld. Collapsing the two would hide how often users leave the
  // field blank.
  assert.equal(safeLabel(null), "unknown");
  assert.equal(safeLabel(undefined), "unknown");
  assert.equal(safeLabel("   "), "unknown");
});

test("a number typed into the field is not treated as prose", () => {
  // Digits pass the shape test, so a price would survive. It is not sent by
  // any caller, but the boundary does not stop it — asserted so the next
  // person adding a property knows the shape check is not a price filter.
  assert.equal(safeLabel("2456.30"), "2456.30");
});
