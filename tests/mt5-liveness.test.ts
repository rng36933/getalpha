import assert from "node:assert/strict";
import test from "node:test";
import {
  STALE_AFTER_MS,
  SYNC_INTERVAL_MS,
  hasGoneQuiet,
} from "../src/lib/mt5/liveness.ts";

const now = new Date("2026-07-27T13:00:00.000Z");
const minutesAgo = (n: number) =>
  new Date(now.getTime() - n * 60_000).toISOString();

test("the tolerated silence stays well above the send interval", () => {
  // If these ever cross, every terminal is permanently "quiet" and the warning
  // becomes noise that people learn to ignore — which is worse than not having
  // it, because the one time it is real they will scroll past that too.
  assert.ok(
    STALE_AFTER_MS > SYNC_INTERVAL_MS * 4,
    "a missed cycle or two must not raise an alarm",
  );
});

test("a terminal sending normally is not quiet", () => {
  assert.equal(hasGoneQuiet(minutesAgo(2), now), false);
  assert.equal(hasGoneQuiet(minutesAgo(14), now), false);
});

test("a terminal silent for hours is quiet", () => {
  // The real case: silent from 10:02 while two positions were opened at 12:44
  // and 13:23, and the desk showed nothing wrong.
  assert.equal(hasGoneQuiet(minutesAgo(3 * 60 + 30), now), true);
});

test("never having sent is not the same as having gone quiet", () => {
  // A key that was generated and never used needs setup instructions, not a
  // fault warning about a connection that never existed.
  assert.equal(hasGoneQuiet(null, now), false);
});

test("an unreadable timestamp does not raise a false alarm", () => {
  assert.equal(hasGoneQuiet("not a date", now), false);
});

test("a Date is accepted as well as an ISO string", () => {
  // The server reads a Prisma DateTime; the client is handed an ISO string.
  const at = new Date(now.getTime() - 60 * 60_000);

  assert.equal(hasGoneQuiet(at, now), true);
  assert.equal(hasGoneQuiet(at.toISOString(), now), true);
});
