import assert from "node:assert/strict";
import test from "node:test";
import {
  bucketByDay,
  dayKey,
  monthGrid,
  periodTotals,
  utcParts,
} from "../src/lib/journal/month-pnl.ts";

// Keys are built from the date's own calendar day, so `now` is constructed from
// local parts and the buckets from UTC parts of mid-day timestamps: no test
// depends on the machine's timezone.
const days = bucketByDay(
  [
    { at: "2026-09-30T12:00:00Z", pnl: 500 }, // previous month, but in this week
    { at: "2026-10-01T12:00:00Z", pnl: 100 },
    { at: "2026-10-06T12:00:00Z", pnl: -30 },
    { at: "2026-10-08T12:00:00Z", pnl: 70 },
    { at: "2026-10-08T14:00:00Z", pnl: -20 },
    { at: "2026-10-12T12:00:00Z", pnl: 9 }, // the next Monday: next week
  ],
  utcParts,
);

test("today is the one calendar day", () => {
  assert.deepEqual(periodTotals(days, new Date(2026, 9, 8)).today, { pnl: 50, trades: 2 });
});

test("the week runs Monday to Sunday and can reach into the previous month", () => {
  // Thursday 8 Oct 2026: the week is Mon 5 Oct to Sun 11 Oct.
  assert.deepEqual(periodTotals(days, new Date(2026, 9, 8)).week, { pnl: 20, trades: 3 });
  // Wednesday 30 Sep: the week is Mon 28 Sep to Sun 4 Oct, taking in 1 Oct.
  assert.deepEqual(periodTotals(days, new Date(2026, 8, 30)).week, { pnl: 600, trades: 2 });
});

test("the month covers only that calendar month", () => {
  assert.deepEqual(periodTotals(days, new Date(2026, 9, 8)).month, { pnl: 129, trades: 5 });
});

test("a period with no trades is zero, not missing", () => {
  assert.deepEqual(periodTotals(new Map(), new Date(2026, 9, 8)).week, { pnl: 0, trades: 0 });
});

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
