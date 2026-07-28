import assert from "node:assert/strict";
import test from "node:test";
import { generateReferralCode } from "../src/lib/referral/code.ts";
import {
  REFERRAL_CODE_PATTERN,
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
} from "../src/lib/referral/cookie.ts";

test("every code produced by generateReferralCode matches the middleware pattern", () => {
  // The middleware uses REFERRAL_CODE_PATTERN to gate which `?ref=` values are
  // written to the cookie. If the generator and the pattern disagree on the
  // alphabet, no invite link ever sets the cookie and the referral flow is
  // silently broken for every new user.
  for (let i = 0; i < 200; i += 1) {
    const code = generateReferralCode();
    assert.ok(
      REFERRAL_CODE_PATTERN.test(code),
      `generated code "${code}" does not match REFERRAL_CODE_PATTERN`,
    );
  }
});

test("the pattern rejects the ambiguous characters the generator never produces", () => {
  // 0/O and 1/I/L turn into a different valid code when read off a screen.
  // Both the generator and the pattern must exclude them — otherwise a code
  // with 'O' could arrive via a URL and not be written to the cookie, while a
  // code the generator produces is accepted. The two lists must be the same.
  for (const bad of [
    "0BCDEFG2", // digit zero
    "OBCDEFG2", // letter O
    "1BCDEFG2", // digit one
    "IBCDEFG2", // letter I
    "LBCDEFG2", // letter L
  ]) {
    assert.equal(
      REFERRAL_CODE_PATTERN.test(bad),
      false,
      `"${bad}" should not match REFERRAL_CODE_PATTERN`,
    );
  }
});

test("the pattern rejects codes of the wrong length", () => {
  // A code one character short or long can be a typo or a truncated link, but
  // it is not a valid invite code. Storing it would attribute sign-ups to
  // nobody or, worse, to whoever happens to own the prefix.
  assert.equal(REFERRAL_CODE_PATTERN.test("ABCD234"), false); // 7 chars
  assert.equal(REFERRAL_CODE_PATTERN.test("ABCD23456"), false); // 9 chars
  assert.equal(REFERRAL_CODE_PATTERN.test(""), false);
});

test("the pattern requires every character to be from the safe alphabet", () => {
  // Lowercase, punctuation and whitespace are all outside the alphabet and must
  // not match. This also ensures the pattern cannot be passed a code with
  // embedded control characters or delimiters.
  assert.equal(REFERRAL_CODE_PATTERN.test("abcd2345"), false); // lowercase
  assert.equal(REFERRAL_CODE_PATTERN.test("ABCD-345"), false); // hyphen
  assert.equal(REFERRAL_CODE_PATTERN.test("ABCD 345"), false); // space
  assert.equal(REFERRAL_CODE_PATTERN.test("ABCD2<45"), false); // angle bracket
});

test("the pattern is anchored so a longer string cannot pass", () => {
  // Without anchors, 'XABCD2345Y' would match the 8-character substring in the
  // middle. The middleware would then accept a code embedded inside arbitrary
  // text.
  const code = generateReferralCode();
  assert.equal(REFERRAL_CODE_PATTERN.test(`${code}X`), false);
  assert.equal(REFERRAL_CODE_PATTERN.test(`X${code}`), false);
});

test("the cookie name is the expected literal string", () => {
  // The middleware sets this cookie and the server action reads it back by name.
  // A rename of the constant would silently break every invite link until the
  // next deploy, because the cookie the middleware writes would no longer be
  // found by the sign-up handler.
  assert.equal(REFERRAL_COOKIE, "ga_ref");
});

test("the cookie max age covers at least two weeks", () => {
  // A visitor who bookmarks an invite link and comes back after a week needs it
  // to still be there. The comment on the constant says "thirty days"; this
  // test ensures a future edit does not shorten it below the minimum that the
  // programme's copy implies.
  const twoWeeksInSeconds = 14 * 24 * 60 * 60;
  assert.ok(
    REFERRAL_COOKIE_MAX_AGE >= twoWeeksInSeconds,
    `REFERRAL_COOKIE_MAX_AGE is ${REFERRAL_COOKIE_MAX_AGE}s, shorter than two weeks`,
  );
});
