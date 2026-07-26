import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_MESSAGE_LENGTH,
  cleanMessage,
  cleanPageUrl,
} from "../src/lib/support/sanitise.ts";

test("an ordinary message survives intact", () => {
  const message = "The chart is blank on XAUUSD.\nIt worked yesterday.";
  assert.equal(cleanMessage(message), message);
});

test("markup is kept, not stripped", () => {
  // Deliberate: React escapes on render, so this displays as text. Stripping
  // it would mangle bug reports that quote markup, which is most of them.
  const message = "The page shows <div class='x'> instead of the table";
  assert.equal(cleanMessage(message), message);
});

test("control characters are removed", () => {
  const message = `before${String.fromCharCode(0)}${String.fromCharCode(7)}after`;
  assert.equal(cleanMessage(message), "beforeafter");
});

test("tabs and newlines are not control characters to strip", () => {
  assert.equal(cleanMessage("a\tb\nc"), "a\tb\nc");
});

test("zero-width and bidirectional characters are removed", () => {
  // These make displayed text read differently from what is stored.
  const zeroWidth = String.fromCodePoint(0x200b);
  const rtlOverride = String.fromCodePoint(0x202e);
  const bom = String.fromCodePoint(0xfeff);

  assert.equal(cleanMessage(`a${zeroWidth}b${rtlOverride}c${bom}d`), "abcd");
});

test("carriage returns are normalised so the stored text has one line ending", () => {
  assert.equal(cleanMessage("a\r\nb\rc"), "a\nb\nc");
});

test("a screenful of blank lines is collapsed", () => {
  assert.equal(cleanMessage("a\n\n\n\n\n\n\nb"), "a\n\n\nb");
});

test("a message longer than the limit is truncated", () => {
  const long = "x".repeat(MAX_MESSAGE_LENGTH + 500);
  assert.equal(cleanMessage(long).length, MAX_MESSAGE_LENGTH);
});

test("a message made only of invisible characters becomes empty", () => {
  // The route measures length after cleaning, so this is what stops an
  // invisible message passing the minimum.
  const invisible = String.fromCodePoint(0x200b).repeat(50);
  assert.equal(cleanMessage(invisible), "");
});

test("a rooted path is kept", () => {
  assert.equal(cleanPageUrl("/dashboard/journal"), "/dashboard/journal");
  assert.equal(cleanPageUrl("/dashboard?symbol=EUR%2FUSD"), "/dashboard?symbol=EUR%2FUSD");
});

test("anything that is not one of our paths is dropped", () => {
  assert.equal(cleanPageUrl("https://evil.example/x"), null);
  // Protocol-relative: a browser resolves this to another host entirely.
  assert.equal(cleanPageUrl("//evil.example/x"), null);
  assert.equal(cleanPageUrl("javascript:alert(1)"), null);
  assert.equal(cleanPageUrl("dashboard"), null);
  assert.equal(cleanPageUrl(null), null);
  assert.equal(cleanPageUrl(42), null);
});
