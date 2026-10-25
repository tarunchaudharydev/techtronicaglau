import { isIP } from "node:net";

export const internshipCategories = [
  "software-engineering", "hardware", "ai-ml", "embedded-systems", "vlsi",
  "rtl-design", "verification", "cybersecurity", "cloud", "data-science", "other",
];
export const internshipDegrees = ["any", "diploma", "bachelor", "master", "phd"];
export const internshipArrangements = ["remote", "hybrid", "onsite", "unknown"];
export const internshipSorts = ["deadline", "newest", "verified"];

const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const cursorDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;

function valueFrom(params, key) {
  if (params && typeof params.get === "function") return params.get(key) ?? "";
  const value = params?.[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseInternshipFilters(params) {
  const query = valueFrom(params, "q").replace(/\s+/g, " ").trim().slice(0, 80);
  const categoryValue = valueFrom(params, "category");
  const arrangementValue = valueFrom(params, "arrangement");
  const degreeValue = valueFrom(params, "degree");
  const sortValue = valueFrom(params, "sort");
  const deadlineValue = valueFrom(params, "deadline");
  const companyValue = valueFrom(params, "company");
  const yearValue = Number(valueFrom(params, "year"));
  const cityValue = valueFrom(params, "city")
    .replace(/[^\p{L}\p{N} .'-]/gu, "")
    .replace(/\s+/g, " ").trim().slice(0, 100);

  return {
    query,
    category: internshipCategories.includes(categoryValue) ? categoryValue : "",
    companyId: uuidPattern.test(companyValue) ? companyValue : "",
    city: cityValue,
    citySearch: cityValue.toLocaleLowerCase(),
    countryCode: /^[A-Za-z]{2}$/.test(valueFrom(params, "country")) ? valueFrom(params, "country").toUpperCase() : "",
    arrangement: internshipArrangements.includes(arrangementValue) && arrangementValue !== "unknown" ? arrangementValue : "",
    degree: internshipDegrees.includes(degreeValue) ? degreeValue : "",
    year: Number.isInteger(yearValue) && yearValue >= 1 && yearValue <= 8 ? yearValue : null,
    deadlineWindow: ["7", "30", "90", "none"].includes(deadlineValue) ? deadlineValue : "",
    sort: internshipSorts.includes(sortValue) ? sortValue : "deadline",
    cursor: valueFrom(params, "cursor").slice(0, 500),
  };
}

export function encodeInternshipCursor(sort, key, id) {
  if (!internshipSorts.includes(sort) || !uuidPattern.test(id)) return "";
  if (key !== null && (typeof key !== "string" || !cursorDatePattern.test(key) || !Number.isFinite(Date.parse(key)))) return "";
  return Buffer.from(JSON.stringify({ sort, key, id }), "utf8").toString("base64url");
}

export function decodeInternshipCursor(raw, expectedSort) {
  if (!raw || raw.length > 500 || !internshipSorts.includes(expectedSort)) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (value?.sort !== expectedSort || !uuidPattern.test(value?.id)) return null;
    if (value.key !== null && (typeof value.key !== "string" || !cursorDatePattern.test(value.key) || !Number.isFinite(Date.parse(value.key)))) return null;
    return { sort: value.sort, key: value.key, id: value.id };
  } catch {
    return null;
  }
}

export function isSafeHttpsUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return false;
    if (isIP(hostname)) return false;
    return hostname.includes(".") && !hostname.startsWith(".") && !hostname.endsWith(".");
  } catch {
    return false;
  }
}

export function classifyInternshipExpiry(listing, now = new Date()) {
  const deadline = listing?.deadline ? Date.parse(listing.deadline) : Number.NaN;
  if (Number.isFinite(deadline) && deadline <= now.valueOf()) return "closed";
  if (listing?.listingStatus !== "open" || listing?.verificationStatus !== "verified") return "unchanged";
  const dueAt = listing?.verificationDueAt ? Date.parse(listing.verificationDueAt) : Number.NaN;
  if (Number.isFinite(dueAt) && dueAt <= now.valueOf()) return "stale";
  return "unchanged";
}

export function isAuthorizedCronRequest(authorization, secret) {
  return typeof secret === "string" && secret.length >= 16 && authorization === `Bearer ${secret}`;
}

/** Run independent source adapters without letting one failed company block the rest. */
export async function runInternshipAdapters(adapters, { maxAttempts = 2 } = {}) {
  const attemptsLimit = Math.max(1, Math.min(3, Math.trunc(maxAttempts) || 1));
  const outcomes = await Promise.all((adapters ?? []).map(async (adapter) => {
    let lastError = "Source request failed";
    for (let attempt = 1; attempt <= attemptsLimit; attempt += 1) {
      try {
        const result = await adapter.run();
        return { source: adapter.name, status: "completed", attempt, result };
      } catch (error) {
        lastError = error instanceof Error ? error.message.slice(0, 500) : lastError;
        if (error?.retryable === false) break;
      }
    }
    return { source: adapter.name, status: "failed", error: lastError };
  }));
  return {
    outcomes,
    status: outcomes.some((outcome) => outcome.status === "failed")
      ? outcomes.some((outcome) => outcome.status === "completed") ? "partial" : "failed"
      : "completed",
  };
}
