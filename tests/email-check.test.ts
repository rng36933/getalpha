import assert from "node:assert/strict";
import test from "node:test";
import { checkEmail } from "../src/lib/referral/email-check.ts";

test("an ordinary address is accepted and lowercased", () => {
  assert.deepEqual(checkEmail("Almintas@Example.com"), {
    ok: true,
    email: "almintas@example.com",
  });
  assert.deepEqual(checkEmail("  a.b+tag@sub.example.co.uk  "), {
    ok: true,
    email: "a.b+tag@sub.example.co.uk",
  });
});

test("addresses that would simply not deliver are rejected", () => {
  for (const bad of [
    "",
    "no-at-sign",
    "@example.com",
    "user@",
    "user@localhost",
    "user @example.com",
    "a@b",
  ]) {
    assert.equal(checkEmail(bad).ok, false, `"${bad}" should be rejected`);
  }
});

test("non-strings are rejected rather than coerced", () => {
  for (const bad of [null, undefined, 42, {}, []]) {
    assert.deepEqual(checkEmail(bad), { ok: false, reason: "INVALID" });
  }
});

test("throwaway inboxes are named as such, not just refused", () => {
  // The distinction matters to the caller: one message says "check your
  // typing", the other says "use an address you read".
  assert.deepEqual(checkEmail("someone@mailinator.com"), {
    ok: false,
    reason: "DISPOSABLE",
  });
  assert.deepEqual(checkEmail("SOMEONE@YOPMAIL.COM"), {
    ok: false,
    reason: "DISPOSABLE",
  });
});

test("a subdomain of a blocked domain is not itself blocked", () => {
  // Documenting the limit rather than pretending it is not there: the list
  // matches exact domains, and it is not the control the referral bonus rests
  // on — that needs a verified account.
  assert.equal(checkEmail("someone@mail.mailinator.com").ok, true);
});

test("an address at the length limit is handled", () => {
  const local = "a".repeat(250);
  assert.equal(checkEmail(`${local}@example.com`).ok, false);
});
