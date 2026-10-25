import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyInternshipExpiry,
  decodeInternshipCursor,
  encodeInternshipCursor,
  isAuthorizedCronRequest,
  isSafeHttpsUrl,
  parseInternshipFilters,
  runInternshipAdapters,
} from "../../lib/internships/core.mjs";

const id = "5c7a85e4-318e-4f52-8b2b-0f364e8d7e37";

test("internship filters validate values and normalize safe URL state", () => {
  const params = new URLSearchParams("q=AI%20%20intern&category=ai-ml&year=3&country=in&city=New%20Delhi&degree=bachelor&arrangement=remote&sort=newest");
  const filters = parseInternshipFilters(params);
  assert.equal(filters.query, "AI intern");
  assert.equal(filters.category, "ai-ml");
  assert.equal(filters.year, 3);
  assert.equal(filters.countryCode, "IN");
  assert.equal(filters.citySearch, "new delhi");
  assert.equal(filters.sort, "newest");
  const invalid = parseInternshipFilters(new URLSearchParams("category=totally-invalid&year=999&company=bad&sort=wat"));
  assert.equal(invalid.category, "");
  assert.equal(invalid.year, null);
  assert.equal(invalid.companyId, "");
  assert.equal(invalid.sort, "deadline");
});

test("internship cursors are stable, sort-bound, and reject malformed values", () => {
  const token = encodeInternshipCursor("deadline", "2026-12-01T12:00:00.000Z", id);
  assert.deepEqual(decodeInternshipCursor(token, "deadline"), {
    sort: "deadline", key: "2026-12-01T12:00:00.000Z", id,
  });
  assert.equal(decodeInternshipCursor(token, "newest"), null);
  assert.equal(decodeInternshipCursor("not-a-cursor", "deadline"), null);
  const malformed = Buffer.from(JSON.stringify({ sort: "deadline", key: "2026-01-01,deadline.eq.2026-01-01", id }), "utf8").toString("base64url");
  assert.equal(decodeInternshipCursor(malformed, "deadline"), null);
});

test("only safe public HTTPS links are accepted", () => {
  assert.equal(isSafeHttpsUrl("https://careers.example.com/jobs/123"), true);
  assert.equal(isSafeHttpsUrl("javascript:alert(1)"), false);
  assert.equal(isSafeHttpsUrl("http://example.com"), false);
  assert.equal(isSafeHttpsUrl("https://localhost/apply"), false);
  assert.equal(isSafeHttpsUrl("https://user:password@example.com"), false);
});

test("expiry closes explicit expired deadlines and stales only overdue verification", () => {
  const now = new Date("2026-10-24T12:00:00.000Z");
  assert.equal(classifyInternshipExpiry({ listingStatus: "open", verificationStatus: "verified", deadline: "2026-10-23T00:00:00Z", verificationDueAt: null }, now), "closed");
  assert.equal(classifyInternshipExpiry({ listingStatus: "open", verificationStatus: "verified", deadline: null, verificationDueAt: "2026-10-23T00:00:00Z" }, now), "stale");
  assert.equal(classifyInternshipExpiry({ listingStatus: "open", verificationStatus: "verified", deadline: null, verificationDueAt: null }, now), "unchanged");
});

test("scheduled endpoint authentication rejects missing and short secrets", () => {
  assert.equal(isAuthorizedCronRequest("Bearer 0123456789abcdef", "0123456789abcdef"), true);
  assert.equal(isAuthorizedCronRequest(null, "0123456789abcdef"), false);
  assert.equal(isAuthorizedCronRequest("Bearer short", "short"), false);
});

test("adapter runs are isolated and retries are bounded", async () => {
  let attempts = 0;
  const result = await runInternshipAdapters([
    { name: "good", run: async () => "ok" },
    { name: "flaky", run: async () => { attempts += 1; if (attempts < 2) throw new Error("temporary"); return "recovered"; } },
    { name: "broken", run: async () => { throw new Error("unavailable"); } },
  ], { maxAttempts: 2 });
  assert.equal(result.status, "partial");
  assert.equal(attempts, 2);
  assert.deepEqual(result.outcomes.map((entry) => entry.status), ["completed", "completed", "failed"]);
});
