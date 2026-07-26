import assert from "node:assert/strict";
import test from "node:test";
import { MAX_NOTE_LENGTH, parseNoteUpdate } from "../src/lib/trades/notes.ts";

test("reads the four editable fields", () => {
  const result = parseNoteUpdate({
    setup: "H1 order block retest",
    timeframe: "M15",
    marketContext: "DXY weakening, CPI in two hours",
    emotionalState: "Impatient",
  });

  assert.ok(result.ok);
  assert.deepEqual(result.update, {
    setup: "H1 order block retest",
    timeframe: "M15",
    marketContext: "DXY weakening, CPI in two hours",
    emotionalState: "Impatient",
  });
});

test("a field that is not sent is left alone", () => {
  // The difference that matters: absent means "do not touch", so an edit to
  // one note cannot wipe another.
  const result = parseNoteUpdate({ marketContext: "Only this" });

  assert.ok(result.ok);
  assert.deepEqual(result.update, { marketContext: "Only this" });
});

test("blank and null both clear the field", () => {
  const blank = parseNoteUpdate({ setup: "   ", emotionalState: null });

  assert.ok(blank.ok);
  assert.deepEqual(blank.update, { setup: null, emotionalState: null });
});

test("prices and sizes are ignored, not rejected", () => {
  // A synced row's numbers belong to the terminal. Sending them is not an
  // error the user can act on; they simply do not apply.
  const result = parseNoteUpdate({
    entryPrice: 2345.67,
    size: 99,
    userId: "somebody-else",
    setup: "Kept",
  });

  assert.ok(result.ok);
  assert.deepEqual(result.update, { setup: "Kept" });
});

test("an edit with nothing editable in it is refused", () => {
  const result = parseNoteUpdate({ entryPrice: 1.234 });

  assert.equal(result.ok, false);
});

test("a non-string note is refused", () => {
  const result = parseNoteUpdate({ marketContext: 42 });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.errors[0].includes("marketContext"));
});

test("an over-long note is refused rather than silently truncated", () => {
  const result = parseNoteUpdate({
    marketContext: "x".repeat(MAX_NOTE_LENGTH + 1),
  });

  assert.equal(result.ok, false);
});

test("a note exactly at the limit is accepted", () => {
  const note = "x".repeat(MAX_NOTE_LENGTH);
  const result = parseNoteUpdate({ marketContext: note });

  assert.ok(result.ok);
  assert.equal(result.update.marketContext, note);
});

test("a body that is not an object is refused", () => {
  assert.equal(parseNoteUpdate(null).ok, false);
  assert.equal(parseNoteUpdate("setup=x").ok, false);
  assert.equal(parseNoteUpdate([{ setup: "x" }]).ok, false);
});
