import assert from "node:assert/strict";
import test from "node:test";
import { isBirthdayToday } from "../../lib/utils/isBirthdayToday.mjs";

test("uses the India date when comparing birthdays", () => {
  // 18:30 UTC is midnight in Kolkata on the next calendar day.
  assert.equal(isBirthdayToday("2000-10-23", new Date("2026-10-22T18:30:00.000Z")), true);
  assert.equal(isBirthdayToday("2000-10-24", new Date("2026-10-22T18:30:00.000Z")), false);
});

test("changes birthday at the Kolkata midnight boundary", () => {
  assert.equal(isBirthdayToday("2000-10-23", new Date("2026-10-23T18:29:59.999Z")), true);
  assert.equal(isBirthdayToday("2000-10-23", new Date("2026-10-23T18:30:00.000Z")), false);
});

test("rejects missing and invalid birth dates", () => {
  assert.equal(isBirthdayToday(undefined, new Date("2026-10-22T18:30:00.000Z")), false);
  assert.equal(isBirthdayToday("2000-02-30", new Date("2026-10-22T18:30:00.000Z")), false);
  assert.equal(isBirthdayToday("not-a-date", new Date("2026-10-22T18:30:00.000Z")), false);
});
