import assert from "node:assert/strict";
import test from "node:test";
import { landingCopy } from "../src/lib/i18n/landing.ts";

/** Every leaf string in a dictionary, keyed by its path. */
function flatten(value: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();

  if (typeof value === "string") {
    out.set(prefix, value);
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      for (const [key, text] of flatten(item, `${prefix}[${index}]`)) {
        out.set(key, text);
      }
    });
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      for (const [path, text] of flatten(child, prefix ? `${prefix}.${key}` : key)) {
        out.set(path, text);
      }
    }
  }

  return out;
}

test("nothing on the landing page is blank", () => {
  for (const [path, text] of flatten(landingCopy)) {
    assert.ok(text.trim().length > 0, `${path} is empty`);
  }
});

test("the landing page has a title and description", () => {
  assert.ok(landingCopy.hero.cta.length > 0);
  assert.ok(landingCopy.meta.title.length > 0);
  assert.ok(landingCopy.meta.description.length > 0);
});
