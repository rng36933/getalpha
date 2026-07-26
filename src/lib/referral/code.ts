import { randomBytes } from "node:crypto";

/**
 * Alphabet without the characters people misread aloud or mistype.
 *
 * No 0/O, no 1/I/L. Referral codes get read off a screen and typed into a
 * phone, and a code that turns into a different valid code when misread is a
 * sign-up credited to a stranger.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** 8 characters over 31 symbols is about 40 bits — far past guessable. */
const LENGTH = 8;

/**
 * A random invite code.
 *
 * Not sequential, and not derived from the user id. Either would let anyone
 * walk the whole user base, and a derived code would leak the id it came from.
 *
 * Rejection sampling rather than a plain modulo: 256 does not divide evenly by
 * 31, so `byte % 31` would make the first few letters measurably more common.
 * That is not a real attack here, but a biased generator is the kind of thing
 * nobody re-examines later.
 */
export function generateReferralCode(): string {
  const limit = 256 - (256 % ALPHABET.length);
  let code = "";

  while (code.length < LENGTH) {
    for (const byte of randomBytes(LENGTH)) {
      if (byte >= limit) continue;
      code += ALPHABET[byte % ALPHABET.length];
      if (code.length === LENGTH) break;
    }
  }

  return code;
}

/** Normalises a code from a URL or a typed field. Null when it cannot be one. */
export function normaliseReferralCode(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const trimmed = raw.trim().toUpperCase();
  if (trimmed.length !== LENGTH) return null;

  return [...trimmed].every((character) => ALPHABET.includes(character))
    ? trimmed
    : null;
}
