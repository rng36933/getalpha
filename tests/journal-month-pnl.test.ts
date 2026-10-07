import assert from "node:assert/strict";
import test from "node:test";
import {
  bucketByDay,
  dayKey,
  monthGrid,
  utcParts,
} from "../src/lib/journal/month-pnl.ts";

test("results on the same day are summed and counted", () => {
  const days = bucketByDay(
    [
      { at: "2026-10-05T08:00:00Z", pnl: 120.5 },
      { at: "2026-10-05T15:30:00Z", pnl: -20.5 },
      { at: "2026-10-06T09:00:00Z", pnl: -40 },
    ],
    utcParts,
  );

  assert.deepEqual(days.get("2026-10-05"), { pnl: 100, trades: 2 });
  assert.deepEqual(days.get("2026-10-06"), { pnl: -40, trades: 1 });
  assert.equal(days.get("2026-10-07"), undefined);
});

test("the same day number in another month is a different day", () => {
  const days = bucketByDay(
    [
      { at: "2026-09-05T08:00:00Z", pnl: 10 },
      { at: "2026-10-05T08:00:00Z", pnl: 20 },
    ],
    utcParts,
  );

  assert.equal(days.get("2026-09-05")?.pnl, 10);
  assert.equal(days.get("2026-10-05")?.pnl, 20);
});

test("an unreadable timestamp is skipped, not counted as today", () => {
  const days = bucketByDay([{ at: "not a date", pnl: 5 }], utcParts);
  assert.equal(days.size, 0);
});

test("day keys are zero-padded and the month is one-based in the key", () => {
  assert.equal(dayKey(2026, 0, 3), "2026-01-03");
  assert.equal(dayKey(2026, 11, 31), "2026-12-31");
});

test("a month grid starts on Monday and pads with nulls", () => {
  // 1 October 2026 is a Thursday: three blanks before it.
  const weeks = monthGrid(2026, 9);

  assert.deepEqual(weeks[0], [null, null, null, 1, 2, 3, 4]);
  assert.ok(weeks.every((week) => week.length === 7));
  assert.equal(weeks.flat().filter((cell) => cell !== null).length, 31);
  assert.equal(weeks.at(-1)?.includes(31), true);
});

test("a month that starts on Monday has no leading padding", () => {
  // 1 June 2026 is a Monday.
  assert.equal(monthGrid(2026, 5)[0][0], 1);
});

test("February in a leap year has twenty-nine days", () => {
  assert.equal(monthGrid(2028, 1).flat().filter((cell) => cell !== null).length, 29);
});
