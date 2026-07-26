import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Erasure has to name every table that holds a `userId`, and the only reliable
 * way to know that is to read the schema rather than to remember.
 *
 * The first version of `eraseUserData` covered six models out of ten. It was
 * not wrong when it was written — the other four were added later, each by
 * somebody who had no reason to think about deletion. That is the shape of this
 * bug: it is never introduced, it accumulates. So this test fails on the commit
 * that adds the table, not on the day somebody exercises their right to
 * erasure and finds their broker and account number still there.
 *
 * Reads the files as text. `npm test` runs the bare node runner, which resolves
 * neither the `@/` alias nor the Prisma client, and the invariant here is a
 * fact about two files rather than about anything at runtime.
 */

const schema = readFileSync("prisma/schema.prisma", "utf8");
const erase = readFileSync("src/lib/legal/erase.ts", "utf8");

/** Models that declare a `userId` column, in schema order. */
function modelsWithUserId(): string[] {
  const found: string[] = [];

  // Each block runs from `model X {` to the closing brace at column 0.
  const blocks = schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm);

  for (const [, name, body] of blocks) {
    if (/^\s*userId\s+\S/m.test(body)) found.push(name);
  }

  return found;
}

/** `tx.trade.deleteMany` and `tx.aiUsageLog.updateMany` → Trade, AiUsageLog. */
function modelsHandledByErase(): Set<string> {
  const handled = new Set<string>();

  for (const [, accessor] of erase.matchAll(
    /\btx\.(\w+)\.(?:deleteMany|updateMany|count)\b/g,
  )) {
    handled.add(accessor[0].toUpperCase() + accessor.slice(1));
  }

  return handled;
}

test("every model with a userId is handled by eraseUserData", () => {
  const handled = modelsHandledByErase();
  const missing = modelsWithUserId().filter((model) => !handled.has(model));

  assert.deepEqual(
    missing,
    [],
    `These models hold a userId and eraseUserData never touches them: ${missing.join(", ")}. ` +
      "Delete the rows, or null the user id and say in the doc comment why the rows have to stay.",
  );
});

test("the schema scan finds the tables it is supposed to find", () => {
  // A guard on the guard. If the regex silently stopped matching, the test
  // above would pass by finding nothing to check, which is the failure mode
  // that makes a coverage test worse than no test at all.
  const models = modelsWithUserId();

  assert.ok(
    models.length >= 8,
    `Only ${models.length} models with a userId were found; the schema scan is probably broken.`,
  );
  assert.ok(models.includes("Trade"));
  assert.ok(models.includes("MtConnection"));
});
