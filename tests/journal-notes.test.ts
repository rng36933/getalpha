import assert from "node:assert/strict";
import test from "node:test";
import { MAX_NOTE_LENGTH, cleanNote } from "../src/lib/journal/notes.ts";

test("an ordinary note survives intact", () => {
  const note = "Faded the London high, stopped out on the NFP spike.";
  assert.equal(cleanNote(note), note);
});

test("an empty or whitespace-only note clears the note", () => {
  assert.equal(cleanNote(""), null);
  assert.equal(cleanNote("   \n  "), null);
});

test("a note made only of invisible characters clears the note", () => {
  assert.equal(cleanNote("​​"), null);
});

test("a note longer than the limit is cut to it", () => {
  const cleaned = cleanNote("x".repeat(MAX_NOTE_LENGTH + 100));
  assert.equal(cleaned?.length, MAX_NOTE_LENGTH);
});
