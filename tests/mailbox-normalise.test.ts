import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMailbox } from "../src/lib/referral/email-check.ts";

test("the three spellings of one Gmail inbox collapse to one", () => {
  const canonical = normalizeMailbox("almintas@gmail.com");

  assert.equal(normalizeMailbox("almintas+one@gmail.com"), canonical);
  assert.equal(normalizeMailbox("almintas+two@gmail.com"), canonical);
  assert.equal(normalizeMailbox("a.l.m.i.n.t.a.s@gmail.com"), canonical);
  assert.equal(normalizeMailbox("ALMINTAS@GMAIL.COM"), canonical);
  assert.equal(normalizeMailbox("  almintas@gmail.com  "), canonical);
});

test("googlemail is gmail", () => {
  assert.equal(
    normalizeMailbox("almintas@googlemail.com"),
    normalizeMailbox("almintas@gmail.com"),
  );
});

test("plus tags are stripped everywhere, dots only where they are ignored", () => {
  // Sub-addressing is universal among the major providers.
  assert.equal(normalizeMailbox("me+alpha@outlook.com"), "me@outlook.com");
  assert.equal(normalizeMailbox("me+alpha@proton.me"), "me@proton.me");

  // Dots are significant outside Gmail, so these are two different people and
  // must not be merged.
  assert.notEqual(
    normalizeMailbox("j.smith@outlook.com"),
    normalizeMailbox("jsmith@outlook.com"),
  );
});

test("two genuinely different people are left alone", () => {
  assert.notEqual(
    normalizeMailbox("ona@gmail.com"),
    normalizeMailbox("jonas@gmail.com"),
  );
  assert.notEqual(
    normalizeMailbox("same@gmail.com"),
    normalizeMailbox("same@outlook.com"),
  );
});

test("nonsense yields no mailbox rather than a misleading one", () => {
  assert.equal(normalizeMailbox("not-an-address"), null);
  assert.equal(normalizeMailbox("@gmail.com"), null);
  assert.equal(normalizeMailbox("someone@"), null);
  // A tag-only local part reaches nothing once the tag is stripped.
  assert.equal(normalizeMailbox("+tag@gmail.com"), null);
  // A bare hostname is not a mailbox.
  assert.equal(normalizeMailbox("someone@localhost"), null);
  assert.equal(normalizeMailbox(null), null);
  assert.equal(normalizeMailbox(42), null);
});
