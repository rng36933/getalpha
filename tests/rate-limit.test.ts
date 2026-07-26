import assert from "node:assert/strict";
import test from "node:test";
import { check } from "../src/lib/rate-limit/window.ts";

/** Unique per test, so one test's counters cannot leak into another's. */
let counter = 0;
const key = () => `test-${counter++}`;

test("requests up to the limit are allowed", () => {
  const k = key();
  const now = 1_000_000;

  for (let i = 0; i < 5; i += 1) {
    const result = check(k, 5, 60_000, now);
    assert.equal(result.allowed, true, `request ${i + 1} should be allowed`);
    assert.equal(result.remaining, 4 - i);
  }
});

test("the request past the limit is refused", () => {
  const k = key();
  const now = 1_000_000;

  for (let i = 0; i < 5; i += 1) check(k, 5, 60_000, now);

  const result = check(k, 5, 60_000, now);
  assert.equal(result.allowed, false);
  assert.equal(result.remaining, 0);
  assert.equal(result.retryAfterSeconds, 60);
});

test("the window slides rather than resetting on a boundary", () => {
  // A fixed window lets someone spend the whole allowance at the end of one
  // window and again at the start of the next — twice the limit back to back.
  const k = key();
  const start = 2_000_000;

  for (let i = 0; i < 3; i += 1) check(k, 3, 60_000, start + i * 1_000);

  // Just before the oldest falls out: still refused.
  assert.equal(check(k, 3, 60_000, start + 59_000).allowed, false);

  // The oldest has now aged out, so exactly one slot frees up.
  assert.equal(check(k, 3, 60_000, start + 60_001).allowed, true);
  assert.equal(check(k, 3, 60_000, start + 60_002).allowed, false);
});

test("retryAfterSeconds counts down as the window advances", () => {
  const k = key();
  const start = 3_000_000;

  for (let i = 0; i < 2; i += 1) check(k, 2, 60_000, start);

  assert.equal(check(k, 2, 60_000, start).retryAfterSeconds, 60);
  assert.equal(check(k, 2, 60_000, start + 30_000).retryAfterSeconds, 30);
  // Never zero: a client told to wait zero seconds retries immediately.
  assert.ok(check(k, 2, 60_000, start + 59_900).retryAfterSeconds >= 1);
});

test("separate keys do not share an allowance", () => {
  const a = key();
  const b = key();
  const now = 4_000_000;

  for (let i = 0; i < 3; i += 1) check(a, 3, 60_000, now);

  assert.equal(check(a, 3, 60_000, now).allowed, false);
  assert.equal(check(b, 3, 60_000, now).allowed, true);
});

test("a refused request does not extend the block", () => {
  // Counting rejected attempts against the window would turn a retry loop into
  // a permanent lockout.
  const k = key();
  const start = 5_000_000;

  check(k, 1, 60_000, start);

  for (let i = 0; i < 10; i += 1) check(k, 1, 60_000, start + 1_000);

  assert.equal(check(k, 1, 60_000, start + 60_001).allowed, true);
});
