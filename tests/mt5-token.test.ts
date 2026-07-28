import assert from "node:assert/strict";
import test from "node:test";
import {
  hashToken,
  hashesMatch,
  issueToken,
  tokenFromHeader,
} from "../src/lib/mt5/token.ts";

const PREFIX = "ga_mt5_";

test("issued token has the expected prefix", () => {
  // The prefix lets a server check at a glance that the header value came from
  // this app rather than, say, a pasted Stripe key.
  for (let i = 0; i < 10; i += 1) {
    const { token } = issueToken();
    assert.ok(
      token.startsWith(PREFIX),
      `"${token}" should start with "${PREFIX}"`,
    );
  }
});

test("issued token hash is a 64-character lowercase hex string", () => {
  // SHA-256 produces 32 bytes, which encode as 64 hex digits.
  const { hash } = issueToken();
  assert.equal(hash.length, 64);
  assert.ok(/^[0-9a-f]{64}$/.test(hash), `"${hash}" is not lowercase hex`);
});

test("two issued tokens are always distinct", () => {
  // Both the plaintext and the stored hash must be unique — a collision would
  // let one terminal authenticate as another.
  const a = issueToken();
  const b = issueToken();
  assert.notEqual(a.token, b.token);
  assert.notEqual(a.hash, b.hash);
});

test("the hash packaged with an issued token matches hashToken of that token", () => {
  // The caller stores the hash and shows the token once. If these diverge, the
  // stored hash will never match anything the terminal sends.
  const { token, hash } = issueToken();
  assert.equal(hashToken(token), hash);
});

test("hashToken is deterministic for the same input", () => {
  const { token } = issueToken();
  assert.equal(hashToken(token), hashToken(token));
});

test("hashToken produces different hashes for different inputs", () => {
  const a = issueToken();
  const b = issueToken();
  assert.notEqual(a.hash, b.hash);
});

test("tokenFromHeader accepts a valid Bearer token", () => {
  const { token } = issueToken();
  assert.equal(tokenFromHeader(`Bearer ${token}`), token);
});

test("tokenFromHeader is case-insensitive on the Bearer scheme", () => {
  // HTTP/1.1 says scheme values are case-insensitive; a terminal whose library
  // lowercases it must still be able to authenticate.
  const { token } = issueToken();
  assert.equal(tokenFromHeader(`bearer ${token}`), token);
  assert.equal(tokenFromHeader(`BEARER ${token}`), token);
});

test("tokenFromHeader rejects a token without the app prefix", () => {
  // A credential from another system — or an attacker's string — must not
  // pass the prefix check.
  assert.equal(tokenFromHeader("Bearer some_other_token"), null);
  assert.equal(tokenFromHeader("Bearer sk_live_abc123"), null);
});

test("tokenFromHeader rejects a null or empty header", () => {
  assert.equal(tokenFromHeader(null), null);
  assert.equal(tokenFromHeader(""), null);
});

test("tokenFromHeader rejects a header with no scheme", () => {
  // The token alone, with no 'Bearer' in front, is not a valid Authorization
  // header value and must not be accepted.
  const { token } = issueToken();
  assert.equal(tokenFromHeader(token), null);
});

test("tokenFromHeader rejects a non-Bearer scheme", () => {
  const { token } = issueToken();
  assert.equal(tokenFromHeader(`Basic ${token}`), null);
  assert.equal(tokenFromHeader(`Token ${token}`), null);
});

test("tokenFromHeader rejects a header that is only the scheme word", () => {
  // 'Bearer' with nothing after it has no credential value.
  assert.equal(tokenFromHeader("Bearer"), null);
});

test("hashesMatch returns true for identical hashes", () => {
  const { hash } = issueToken();
  assert.equal(hashesMatch(hash, hash), true);
});

test("hashesMatch returns false for hashes of different tokens", () => {
  const a = issueToken();
  const b = issueToken();
  assert.equal(hashesMatch(a.hash, b.hash), false);
});

test("hashesMatch returns false for empty strings", () => {
  // Two empty values matching each other would let any empty credential pass.
  assert.equal(hashesMatch("", ""), false);
});

test("hashesMatch returns false when the two sides have different lengths", () => {
  // A truncated hash is not the same hash, and must not match.
  const { hash } = issueToken();
  assert.equal(hashesMatch(hash, hash.slice(0, 32)), false);
  assert.equal(hashesMatch(hash.slice(0, 32), hash), false);
});
