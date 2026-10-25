import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, CalendarDays, MapPin, Search } from "lucide-react";
import type { InternshipCompany, InternshipListing } from "@/lib/data/internships";
import type { InternshipFilters } from "@/lib/internships/core.mjs";

const categoryLabels: Record<string, string> = {
  "software-engineering": "Software engineering", hardware: "Hardware", "ai-ml": "AI / ML",
  "embedded-systems": "Embedded systems", vlsi: "VLSI", "rtl-design": "RTL design",
  verification: "Verification", cybersecurity: "Cybersecurity", cloud: "Cloud",
  "data-science": "Data science", other: "Other",
};
const degreeLabels: Record<string, string> = {
  any: "Any qualification", diploma: "Diploma", bachelor: "Bachelor’s", master: "Master’s", phd: "PhD",
};
const arrangementLabels: Record<string, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };

function formatDate(value: string | null, includeTime = false) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function queryHref(filters: InternshipFilters, cursor?: string) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (filters.companyId) params.set("company", filters.companyId);
  if (filters.city) params.set("city", filters.city);
  if (filters.countryCode) params.set("country", filters.countryCode);
  if (filters.arrangement) params.set("arrangement", filters.arrangement);
  if (filters.degree) params.set("degree", filters.degree);
  if (filters.year) params.set("year", String(filters.year));
  if (filters.deadlineWindow) params.set("deadline", filters.deadlineWindow);
  if (filters.sort !== "deadline") params.set("sort", filters.sort);
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return query ? `/internships?${query}` : "/internships";
}

export default function InternshipDirectory({
  filters, companies, listings, nextCursor, error, companyError,
}: {
  filters: InternshipFilters;
  companies: InternshipCompany[];
  listings: InternshipListing[];
  nextCursor: string | null;
  error: string | null;
  companyError: string | null;
}) {
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
    <section className="overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Techtronica careers</p>
      <div className="mt-3 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div><h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">Find an opportunity to build what’s next.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">Browse opportunities discovered from Google Jobs and admin-submitted listings. Automated results appear only after the employer and a job-specific official career link pass our checks; applications always open on the employer’s site.</p></div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"><BadgeCheck aria-hidden="true" className="size-5 text-emerald-600" />Official employer links</div>
      </div>
    </section>

    <section aria-labelledby="internship-results-heading" className="mt-8 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <form action="/internships" method="get" className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2"><Search aria-hidden="true" className="size-4 text-sky-700" /><h2 className="text-base font-bold">Search and filter</h2></div>
        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-query">Search roles</label>
        <input id="internship-query" name="q" defaultValue={filters.query} maxLength={80} placeholder="Title, skill, company…" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-category">Technical domain</label>
        <select id="internship-category" name="category" defaultValue={filters.category} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="">All domains</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-company">Company</label>
        <select id="internship-company" name="company" defaultValue={filters.companyId} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="">All companies</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-city">City</label>
        <input id="internship-city" name="city" defaultValue={filters.city} maxLength={100} placeholder="Exact city name" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-country">Country code</label>
        <input id="internship-country" name="country" defaultValue={filters.countryCode} maxLength={2} pattern="[A-Za-z]{2}" placeholder="IN" autoCapitalize="characters" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <p className="mt-1 text-xs text-slate-500">Use the two-letter country code, such as IN or US.</p>

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-arrangement">Work arrangement</label>
        <select id="internship-arrangement" name="arrangement" defaultValue={filters.arrangement} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="">Any arrangement</option>{Object.entries(arrangementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-degree">Qualification</label>
        <select id="internship-degree" name="degree" defaultValue={filters.degree} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="">Any qualification</option>{Object.entries(degreeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-year">Eligible student year</label>
        <select id="internship-year" name="year" defaultValue={filters.year ?? ""} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="">Any year</option>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>Year {index + 1}</option>)}
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-deadline">Application deadline</label>
        <select id="internship-deadline" name="deadline" defaultValue={filters.deadlineWindow} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="">Any upcoming deadline</option><option value="7">Within 7 days</option><option value="30">Within 30 days</option><option value="90">Within 90 days</option><option value="none">No deadline listed</option>
        </select>

        <label className="mt-4 block text-sm font-semibold" htmlFor="internship-sort">Sort by</label>
        <select id="internship-sort" name="sort" defaultValue={filters.sort} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="deadline">Soonest deadline</option><option value="newest">Recently posted</option><option value="verified">Recently verified</option>
        </select>

        <button type="submit" className="mt-5 min-h-11 w-full rounded-xl bg-sky-700 px-4 text-sm font-bold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">Apply filters</button>
        <Link href="/internships" className="mt-2 flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-slate-600 underline-offset-4 hover:text-sky-800 hover:underline dark:text-slate-300">Clear all filters</Link>
      </form>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><h2 id="internship-results-heading" className="text-xl font-bold text-slate-950 dark:text-white">Open internships</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Open roles with checked employer links · {listings.length}{nextCursor ? "+" : ""} shown</p></div>
          <p className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"><BadgeCheck aria-hidden="true" className="mr-1 inline size-4" />Employer career links checked</p>
        </div>
        {companyError && !error && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Company filter options are temporarily unavailable. You can still browse listings or refresh to retry.</p>}
        {error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"><h3 className="font-bold">We couldn’t load internships</h3><p className="mt-1 text-sm">The directory is temporarily unavailable. Your filters are preserved so you can retry.</p><Link href={queryHref(filters)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-rose-900 ring-1 ring-rose-200 dark:bg-slate-900 dark:text-white"><ArrowRight aria-hidden="true" className="size-4" />Retry</Link></div>
          : listings.length ? <div className="space-y-4">{listings.map((listing) => <InternshipCard key={listing.id} listing={listing} />)}</div>
            : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900"><BriefcaseBusiness aria-hidden="true" className="mx-auto size-8 text-sky-700" /><h3 className="mt-3 text-lg font-bold">No matching verified opportunities yet</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Try different filters or check back later. Automated discovery runs daily when configured, and listings are hidden if a fresh check is overdue. Confirm current availability and eligibility on the employer’s page.</p><Link href="/internships" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700"><ArrowLeft aria-hidden="true" className="size-4" />Reset search</Link></div>}

        {!error && nextCursor && <div className="mt-6 flex justify-end"><Link href={queryHref(filters, nextCursor)} rel="next" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:bg-sky-700 dark:hover:bg-sky-600">Next page<ArrowRight aria-hidden="true" className="size-4" /></Link></div>}
      </div>
    </section>
  </main>;
}

function InternshipCard({ listing }: { listing: InternshipListing }) {
  const deadline = formatDate(listing.deadline, true);
  const posted = formatDate(listing.posted_at);
  const locations = [listing.city, listing.country_code].filter(Boolean).join(", ") || listing.location_label || "Location not specified";
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-sm font-semibold text-sky-800 dark:text-sky-300">{listing.company_name}</p><h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-white"><Link className="focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" href={`/internships/${listing.id}`}>{listing.title}</Link></h3></div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"><BadgeCheck aria-hidden="true" className="size-4" />{listing.source_name === "serpapi-google-jobs" ? "Auto checked" : "Reviewed"}</span>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4 text-slate-400" />{locations}</span>
      <span>{arrangementLabels[listing.work_arrangement] ?? "Arrangement not specified"}</span>
      {deadline ? <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4 text-slate-400" />Deadline {deadline} IST</span> : <span>Deadline not listed by source</span>}
    </div>
    <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{listing.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">{listing.technical_categories.slice(0, 4).map((category) => <span key={category} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900 dark:bg-slate-800 dark:text-sky-200">{categoryLabels[category] ?? category}</span>)}{listing.eligible_years.slice(0, 4).map((year) => <span key={year} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">Year {year}</span>)}</div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"><p className="text-xs text-slate-500">{posted ? `Posted ${posted} · ` : ""}Checked {formatDate(listing.verified_at)} (IST)</p><div className="flex items-center gap-2"><Link href={`/internships/${listing.id}`} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">Details</Link><a href={listing.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">Apply<ArrowUpRight aria-hidden="true" className="size-4" /><span className="sr-only"> at {listing.company_name} (opens in a new tab)</span></a></div></div>
  </article>;
}
