import assert from "node:assert/strict";
import test from "node:test";
import { resolveOrder } from "../src/lib/dashboard/card-keys.ts";

test("a saved order is used as-is when every key is present", () => {
  assert.deepEqual(
    resolveOrder(["watchlist", "chart", "brief"], ["chart", "brief", "watchlist"]),
    ["watchlist", "chart", "brief"],
  );
});

test("unknown keys are dropped", () => {
  assert.deepEqual(
    resolveOrder(["chart", "not_a_real_card", "brief"], ["chart", "brief"]),
    ["chart", "brief"],
  );
});

test("a present card missing from the saved order is appended", () => {
  assert.deepEqual(
    resolveOrder(["brief", "chart"], ["chart", "brief", "performance"]),
    ["brief", "chart", "performance"],
  );
});

test("a saved key for a card not present today is dropped, not left as a gap", () => {
  // pnl_curve was in the saved order from a day with two closed trades; today
  // there is only one, so the card is absent.
  assert.deepEqual(
    resolveOrder(["pnl_curve", "chart", "watchlist"], ["chart", "watchlist"]),
    ["chart", "watchlist"],
  );
});

test("no saved order falls back to the default presence order", () => {
  assert.deepEqual(
    resolveOrder([], ["chart", "brief", "watchlist"]),
    ["chart", "brief", "watchlist"],
  );
});
