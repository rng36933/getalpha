import assert from "node:assert/strict";
import test from "node:test";
import { hasComplimentaryAccess } from "../src/lib/billing/complimentary.ts";

const FRIEND = "user_2abcDEFghiJKLmnoPQRstu";
const ME = "user_3H0eo9OLgGXxxoAGvyYsnhkgvAn";

test("an id on the list is granted access", () => {
  assert.equal(hasComplimentaryAccess(FRIEND, FRIEND), true);
});

test("several ids, however they are spaced", () => {
  const raw = ` ${ME} , ${FRIEND} `;

  assert.equal(hasComplimentaryAccess(ME, raw), true);
  assert.equal(hasComplimentaryAccess(FRIEND, raw), true);
});

test("an id not on the list is not granted access", () => {
  assert.equal(hasComplimentaryAccess("user_someoneElse", FRIEND), false);
});

test("an unset or empty list grants nobody anything", () => {
  assert.equal(hasComplimentaryAccess(FRIEND, undefined), false);
  assert.equal(hasComplimentaryAccess(FRIEND, ""), false);
  // The shape a half-edited env var takes. It must not match an empty id.
  assert.equal(hasComplimentaryAccess(FRIEND, " , , "), false);
});

test("an empty user id never matches, even against a sloppy list", () => {
  assert.equal(hasComplimentaryAccess("", ",,"), false);
  assert.equal(hasComplimentaryAccess(null, FRIEND), false);
});

test("matching is exact, not a prefix", () => {
  // A partial id must not let somebody in: Clerk ids share a prefix, and
  // "starts with" would hand access to every account created nearby.
  assert.equal(hasComplimentaryAccess(FRIEND, FRIEND.slice(0, 12)), false);
  assert.equal(hasComplimentaryAccess(FRIEND.slice(0, 12), FRIEND), false);
});
