import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const template = await readFile(new URL("../../.env.test.example", import.meta.url), "utf8");
const values = Object.fromEntries(
  template.split(/\r?\n/).filter((line) => line && !line.startsWith("#")).map((line) => {
    const separator = line.indexOf("=");
    return [line.slice(0, separator), line.slice(separator + 1)];
  }),
);

test("test environment template points to non-production placeholders", () => {
  assert.match(values.NEXT_PUBLIC_SUPABASE_URL, /^https:\/\/your-non-production-project\.supabase\.co$/);
  assert.match(values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, /^replace-with-/);
  assert.match(values.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, /^pk_test_replace-with-/);
  assert.match(values.CLERK_SECRET_KEY, /^sk_test_replace-with-/);
  assert.equal(values.NEXT_PUBLIC_SITE_URL, "http://localhost:3000");
});
