import assert from "node:assert/strict";
import test from "node:test";
import {
  generateReferralCode,
  normaliseReferralCode,
} from "../src/lib/referral/code.ts";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

test("a generated code is eight characters from the safe alphabet", () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateReferralCode();
    assert.equal(code.length, 8);
    assert.ok(
      [...code].every((character) => ALPHABET.includes(character)),
      `"${code}" contains a character outside the alphabet`,
    );
  }
});

test("the characters people misread are never produced", () => {
  // The failure this guards against: a code read aloud or off a screen turning
  // into a different code that is also valid, crediting a stranger.
  const codes = Array.from({ length: 500 }, generateReferralCode).join("");

  for (const forbidden of ["0", "O", "1", "I", "L"]) {
    assert.ok(
      !codes.includes(forbidden),
      `"${forbidden}" should never appear in a code`,
    );
  }
});

test("codes do not repeat over a realistic number of users", () => {
  const codes = new Set(Array.from({ length: 5000 }, generateReferralCode));
  assert.equal(codes.size, 5000);
});

test("every letter of the alphabet is reachable", () => {
  // Rejection sampling is easy to get subtly wrong in a way that silently
  // excludes the tail of the alphabet.
  const seen = new Set([...Array.from({ length: 4000 }, generateReferralCode).join("")]);
  assert.equal(seen.size, ALPHABET.length);
});

test("normalising accepts a code however it was typed", () => {
  const code = generateReferralCode();
  assert.equal(normaliseReferralCode(code.toLowerCase()), code);
  assert.equal(normaliseReferralCode(` ${code} `), code);
});

test("normalising rejects anything that is not a code", () => {
  assert.equal(normaliseReferralCode(null), null);
  assert.equal(normaliseReferralCode(undefined), null);
  assert.equal(normaliseReferralCode(""), null);
  // Right length, wrong alphabet — the ambiguous characters must not sneak in
  // through the front door either.
  assert.equal(normaliseReferralCode("ABCDEFG0"), null);
  assert.equal(normaliseReferralCode("ABCDEFGI"), null);
  // Wrong length.
  assert.equal(normaliseReferralCode("ABCDEFG"), null);
  assert.equal(normaliseReferralCode("ABCDEFGHJ"), null);
  assert.equal(normaliseReferralCode("<script>"), null);
});
