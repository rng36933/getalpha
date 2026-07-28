import assert from "node:assert/strict";
import test from "node:test";
import { isSupportReader } from "../src/lib/support/admin.ts";

const ADMIN = "user_adminXYZ123";
const OTHER = "user_someoneElse456";

/**
 * Temporarily sets SUPPORT_ADMIN_USER_IDS to `raw`, runs `fn`, then restores
 * the previous value. Keeps each test hermetic without exposing the underlying
 * env manipulation.
 */
function withAdmins(raw: string, fn: () => void): void {
  const saved = process.env.SUPPORT_ADMIN_USER_IDS;
  process.env.SUPPORT_ADMIN_USER_IDS = raw;
  try {
    fn();
  } finally {
    if (saved !== undefined) {
      process.env.SUPPORT_ADMIN_USER_IDS = saved;
    } else {
      delete process.env.SUPPORT_ADMIN_USER_IDS;
    }
  }
}

test("an id on the list may read tickets", () => {
  withAdmins(ADMIN, () => {
    assert.equal(isSupportReader(ADMIN), true);
  });
});

test("an id not on the list cannot read tickets", () => {
  withAdmins(ADMIN, () => {
    assert.equal(isSupportReader(OTHER), false);
  });
});

test("several ids, however they are spaced", () => {
  withAdmins(` ${ADMIN} , ${OTHER} `, () => {
    assert.equal(isSupportReader(ADMIN), true);
    assert.equal(isSupportReader(OTHER), true);
  });
});

test("with no env var set nobody can read tickets", () => {
  // Failing closed on an unset variable means the operator cannot accidentally
  // expose tickets by forgetting to configure the list.
  const saved = process.env.SUPPORT_ADMIN_USER_IDS;
  delete process.env.SUPPORT_ADMIN_USER_IDS;

  try {
    assert.equal(isSupportReader(ADMIN), false);
  } finally {
    if (saved !== undefined) process.env.SUPPORT_ADMIN_USER_IDS = saved;
  }
});

test("an empty list grants nobody access", () => {
  withAdmins("", () => {
    assert.equal(isSupportReader(ADMIN), false);
  });
  // The shape a half-edited env var takes. Whitespace-only entries must not
  // be treated as matching an empty user id.
  withAdmins(" , , ", () => {
    assert.equal(isSupportReader(ADMIN), false);
  });
});

test("null or empty user id never matches", () => {
  withAdmins(ADMIN, () => {
    assert.equal(isSupportReader(null), false);
    assert.equal(isSupportReader(""), false);
  });
});

test("matching is exact, not a substring", () => {
  // Clerk ids share a common prefix, so a starts-with check would hand admin
  // access to every account created near the configured one.
  withAdmins(ADMIN, () => {
    assert.equal(isSupportReader(ADMIN.slice(0, 12)), false);
  });
  withAdmins(ADMIN.slice(0, 12), () => {
    assert.equal(isSupportReader(ADMIN), false);
  });
});
