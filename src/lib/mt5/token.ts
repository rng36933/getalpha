import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Connection tokens.
 *
 * Shared by MT5 and MT4 — same shape, same hashing, just a different prefix
 * per platform so a token is self-describing in logs and support requests
 * without a database lookup.
 *
 * The plaintext is shown once, at creation, and never stored. What the database
 * holds is a SHA-256 hash, so a leaked table hands nobody a working key.
 *
 * No salt and no slow hash, deliberately, and the reason is worth stating: this
 * is a 256-bit random value, not a password. There is no dictionary to attack
 * and nothing to guess, so the work factor that protects a human-chosen secret
 * would buy nothing here and would cost a hash on every request the terminal
 * makes.
 */

const PREFIXES = { MT5: "ga_mt5_", MT4: "ga_mt4_" } as const;

export type IssuedToken = { token: string; hash: string };

export function issueToken(platform: keyof typeof PREFIXES = "MT5"): IssuedToken {
  const token = PREFIXES[platform] + randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Pulls the token out of an Authorization header.
 *
 * Returns null rather than throwing on anything malformed, so a caller cannot
 * tell a badly formed header from a wrong token.
 */
export function tokenFromHeader(header: string | null): string | null {
  if (!header) return null;

  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;

  const knownPrefix = Object.values(PREFIXES).some((prefix) => value.startsWith(prefix));
  return knownPrefix ? value : null;
}

/**
 * Constant-time comparison of two hex hashes.
 *
 * The lookup is by hash and the database does that comparison itself, so this
 * exists for callers that have both values in hand — comparing with `===`
 * leaks, through timing, how many leading characters were right.
 */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");

  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}
