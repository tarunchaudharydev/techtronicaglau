import "server-only";
import { createHash } from "node:crypto";
import { isSafeHttpsUrl } from "./core.mjs";

type CompanySource = {
  slug: "google" | "nvidia" | "microsoft" | "amazon" | "netflix";
  name: string;
  aliases: string[];
  officialHosts: string[];
};

export type InternshipImportCandidate = {
  companySlug: CompanySource["slug"];
  companyName: string;
  title: string;
  countryCode: string | null;
  city: string | null;
  locationLabel: string | null;
  workArrangement: "remote" | "hybrid" | "onsite" | "unknown";
  applicationUrl: string;
  officialSourceUrl: string;
  sourceName: "serpapi-google-jobs";
  sourceIdentifier: string;
  sourceUrl: string;
  sourceUpdatedAt: string | null;
  normalizedHash: string;
  provenance: {
    provider: "serpapi-google-jobs";
    providerLabel: "Google Jobs via SerpApi";
    fetchedAt: string;
    providerJobId: string | null;
  };
};

export type InternshipImportBatch = {
  providerResultCount: number;
  rejectedCount: number;
  listings: InternshipImportCandidate[];
};

export type InternshipSourceAdapter = {
  name: string;
  companySlug: CompanySource["slug"];
  run: () => Promise<InternshipImportBatch>;
};

const providerName = "serpapi-google-jobs" as const;
const fetchTimeoutMs = 12_000;
const maxListingsPerCompany = 5;
const internshipDescription =
  "Imported from Google Jobs for review. Check the official company posting for full requirements, eligibility, dates, and application details before publishing.";

const companies: CompanySource[] = [
  {
    slug: "google",
    name: "Google",
    aliases: ["google", "google llc", "google india private limited", "google cloud"],
    officialHosts: ["google.com", "www.google.com", "careers.google.com"],
  },
  {
    slug: "nvidia",
    name: "NVIDIA",
    aliases: ["nvidia", "nvidia corporation", "nvidia india"],
    officialHosts: ["nvidia.wd5.myworkdayjobs.com"],
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    aliases: ["microsoft", "microsoft corporation", "microsoft india"],
    officialHosts: ["apply.careers.microsoft.com", "careers.microsoft.com"],
  },
  {
    slug: "amazon",
    name: "Amazon",
    aliases: ["amazon", "amazon web services", "aws", "amazon.com services llc"],
    officialHosts: ["amazon.jobs", "www.amazon.jobs"],
  },
  {
    slug: "netflix",
    name: "Netflix",
    aliases: ["netflix", "netflix inc", "netflix entertainment services india llp"],
    officialHosts: ["jobs.netflix.com", "explore.jobs.netflix.net"],
  },
];

type ApplyOption = { title?: unknown; link?: unknown };
type ProviderJob = {
  title?: unknown;
  company_name?: unknown;
  location?: unknown;
  via?: unknown;
  job_id?: unknown;
  apply_options?: unknown;
  detected_extensions?: unknown;
};

function normalizeCompany(value: string) {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesCompany(value: unknown, company: CompanySource) {
  if (typeof value !== "string") return false;
  return company.aliases.includes(normalizeCompany(value));
}

function isJobDetailUrl(url: URL, company: CompanySource) {
  const path = url.pathname.toLocaleLowerCase("en-US");
  const hasIdQuery = ["jobid", "job_id", "pid", "reqid", "requisitionid", "jid"].some((key) =>
    Boolean(url.searchParams.get(key)?.trim()),
  );

  switch (company.slug) {
    case "google":
      return url.hostname === "careers.google.com"
        ? /^\/jobs\/results\/[^/]+\/?$/.test(path)
        : /^\/about\/careers\/applications\/jobs\/results\/[^/]+\/?$/.test(path);
    case "nvidia":
      return /^\/[^/]+\/job\/[^/]+\/[^/]+\/?$/.test(path);
    case "microsoft":
      return hasIdQuery || /^\/(?:careers\/)?job\/[^/]+\/?$/.test(path);
    case "amazon":
      return /^\/(?:[a-z]{2}\/)?jobs\/[^/]+(?:\/[^/]+)?\/?$/.test(path);
    case "netflix":
      return /^\/jobs\/[^/]+\/?$/.test(path);
  }
}

function isOfficialCompanyJobUrl(rawUrl: unknown, company: CompanySource): rawUrl is string {
  if (typeof rawUrl !== "string" || !isSafeHttpsUrl(rawUrl)) return false;
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLocaleLowerCase("en-US");
    const isOfficialHost = company.officialHosts.includes(hostname);
    const hasRedirectParameter = ["redirect", "redirect_url", "return_url", "next", "target", "continue"].some((key) =>
      Boolean(url.searchParams.get(key)?.trim()),
    );
    return isOfficialHost && !hasRedirectParameter && isJobDetailUrl(url, company);
  } catch {
    return false;
  }
}

function officialApplicationUrl(value: unknown, company: CompanySource) {
  if (!Array.isArray(value)) return null;
  for (const option of value as ApplyOption[]) {
    if (isOfficialCompanyJobUrl(option?.link, company)) return option.link;
  }
  return null;
}

function asText(value: unknown, maxLength = 180) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function postedAtFromProvider(value: unknown, now: Date) {
  const label = asText(value, 80).toLocaleLowerCase("en-US");
  if (!label) return null;
  if (/just posted|today|now/.test(label)) return now.toISOString();
  if (label.includes("yesterday")) return new Date(now.valueOf() - 24 * 60 * 60_000).toISOString();

  const match = label.match(/(\d+)\+?\s+(day|week|month|year)s?\s+ago/);
  if (!match) return null;
  const amount = Number(match[1]);
  const daysPerUnit = { day: 1, week: 7, month: 30, year: 365 } as const;
  const days = amount * daysPerUnit[match[2] as keyof typeof daysPerUnit];
  if (!Number.isFinite(days) || days > 3650) return null;
  return new Date(now.valueOf() - days * 24 * 60 * 60_000).toISOString();
}

function countryCodeFromLocation(location: string) {
  const value = location.toLocaleLowerCase("en-US");
  const countries: Array<[string, string]> = [
    ["india", "IN"], ["united states", "US"], ["usa", "US"], ["canada", "CA"],
    ["united kingdom", "GB"], ["uk", "GB"], ["ireland", "IE"], ["germany", "DE"],
    ["france", "FR"], ["singapore", "SG"], ["australia", "AU"], ["japan", "JP"],
  ];
  return countries.find(([label]) => value.includes(label))?.[1] ?? null;
}

function cityFromLocation(location: string) {
  if (!location || /remote|anywhere|worldwide/i.test(location)) return null;
  const first = location.split(",")[0]?.trim();
  if (!first || first.length > 100 || /\b(India|United States|USA|Canada|UK|United Kingdom)\b/i.test(first)) return null;
  return first;
}

function arrangementFromJob(job: ProviderJob, location: string): InternshipImportCandidate["workArrangement"] {
  const detected = job.detected_extensions && typeof job.detected_extensions === "object"
    ? job.detected_extensions as Record<string, unknown>
    : {};
  if (detected.work_from_home === true || /remote|anywhere/i.test(location)) return "remote";
  if (/hybrid/i.test(location)) return "hybrid";
  return location ? "onsite" : "unknown";
}

function candidateFromJob(job: ProviderJob, company: CompanySource, fetchedAt: Date): InternshipImportCandidate | null {
  const title = asText(job.title);
  const location = asText(job.location, 160);
  if (!matchesCompany(job.company_name, company) || !/\bintern(?:ship)?\b/i.test(title)) return null;

  const applicationUrl = officialApplicationUrl(job.apply_options, company);
  if (!applicationUrl) return null;

  const rawJobId = asText(job.job_id, 240);
  const sourceIdentifier = createHash("sha256")
    .update(`${providerName}:${company.slug}:${rawJobId || applicationUrl}`)
    .digest("hex");
  const postedAt = postedAtFromProvider(
    (job.detected_extensions as Record<string, unknown> | undefined)?.posted_at,
    fetchedAt,
  );
  const canonicalHashInput = [company.slug, title.toLocaleLowerCase("en-US"), location.toLocaleLowerCase("en-US"), applicationUrl].join("\n");

  return {
    companySlug: company.slug,
    companyName: company.name,
    title,
    countryCode: countryCodeFromLocation(location),
    city: cityFromLocation(location),
    locationLabel: location || null,
    workArrangement: arrangementFromJob(job, location),
    applicationUrl,
    officialSourceUrl: applicationUrl,
    sourceName: providerName,
    sourceIdentifier,
    sourceUrl: applicationUrl,
    sourceUpdatedAt: postedAt,
    normalizedHash: createHash("sha256").update(canonicalHashInput).digest("hex"),
    provenance: {
      provider: providerName,
      providerLabel: "Google Jobs via SerpApi",
      fetchedAt: fetchedAt.toISOString(),
      providerJobId: rawJobId || null,
    },
  };
}

async function fetchCompanyListings(company: CompanySource, apiKey: string): Promise<InternshipImportBatch> {
  const endpoint = new URL("https://serpapi.com/search.json");
  endpoint.searchParams.set("engine", "google_jobs");
  endpoint.searchParams.set("q", `${company.name} internship`);
  endpoint.searchParams.set("location", "India");
  endpoint.searchParams.set("gl", "in");
  endpoint.searchParams.set("hl", "en");
  endpoint.searchParams.set("api_key", apiKey);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });
  } catch {
    throw new Error("Google Jobs provider request failed or timed out");
  }
  if (!response.ok) throw new Error(`Google Jobs provider returned HTTP ${response.status}`);

  let payload: { jobs_results?: unknown; error?: unknown };
  try {
    payload = await response.json() as typeof payload;
  } catch {
    throw new Error("Google Jobs provider returned invalid JSON");
  }
  if (typeof payload.error === "string") throw new Error("Google Jobs provider rejected the search request");
  const providerJobs = Array.isArray(payload.jobs_results) ? payload.jobs_results as ProviderJob[] : [];
  const fetchedAt = new Date();
  const normalized = providerJobs
    .map((job) => candidateFromJob(job, company, fetchedAt))
    .filter((listing): listing is InternshipImportCandidate => listing !== null)
    .slice(0, maxListingsPerCompany);

  return {
    providerResultCount: providerJobs.length,
    rejectedCount: Math.max(0, providerJobs.length - normalized.length),
    listings: normalized,
  };
}

const apiKey = process.env.SERPAPI_API_KEY?.trim();

/**
 * Google Jobs is the discovery provider. Every saved record must have a
 * job-specific apply URL on the employer's allowlisted official domains.
 */
export const internshipDiscoveryAdapters: InternshipSourceAdapter[] = apiKey
  ? companies.map((company) => ({
      name: `${company.name} · Google Jobs via SerpApi`,
      companySlug: company.slug,
      run: () => fetchCompanyListings(company, apiKey),
    }))
  : [];

export const internshipSourceCompanies = companies.map(({ slug, name }) => ({ slug, name }));
export { internshipDescription };
