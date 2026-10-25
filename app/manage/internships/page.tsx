import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, BriefcaseBusiness, Clock3, ExternalLink, Plus, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { requireManager } from "@/lib/manage/server";
import { closeInternship, createInternship, verifyAndPublishInternship } from "./actions";
import type { Tables } from "@/types/database";
import InternshipAdminForm from "@/components/internships/InternshipAdminForm";

export const metadata: Metadata = { title: "Internship listings | Society management" };

const resultMessages: Record<string, string> = {
  created_unverified: "Draft saved. It is hidden from the public directory until verified.",
  updated_unverified: "Changes saved. This listing is hidden until it is reviewed again.",
  published: "Listing verified and published.",
  closed: "Listing closed and removed from public search.",
  verification_required: "Confirm that you checked both official links before publishing.",
  expired: "This deadline has passed. Update it from the official source before publishing.",
  invalid: "Some fields need attention before this listing can be saved.",
  database_unavailable: "The internship database tables are not installed in this Supabase project. Apply the backend internship migration used by this website, then refresh before saving listings.",
  database_access_denied: "Supabase denied this save. Confirm that your Society Admin role has access to the internship tables and try again.",
  error: "We could not save this change. Check database access and try again.",
};

const invalidFieldLabels: Record<string, string> = {
  company_name: "company name",
  company_careers_url: "company careers page URL (HTTPS)",
  title: "internship title",
  description: "description",
  application_url: "official application URL (HTTPS)",
  official_source_url: "official source URL (HTTPS)",
  skills: "skills field length",
  work_arrangement: "work arrangement",
  deadline: "application deadline",
  posted_at: "posting date",
  country_code: "two-letter country code",
};

function dateLabel(value: string | null, includeTime = false) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata", ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}) }).format(new Date(value));
}

function statusTone(status: string) {
  if (status === "open") return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
  if (status === "closed" || status === "rejected") return "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200";
  if (status === "stale") return "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function loadIssue(area: "listings" | "run history", error: { code?: string } | null) {
  if (!error) return null;
  const code = error.code || "unknown";
  if (["42P01", "PGRST205", "PGRST204", "PGRST202"].includes(code)) {
    return {
      code,
      message: `The database schema for ${area} is missing or out of date. Apply the internship-management migration to the Supabase project connected to this website, then refresh and try again.`,
    };
  }
  if (["42501", "PGRST301", "PGRST302"].includes(code)) {
    return {
      code,
      message: `Supabase denied access to ${area}. Confirm your account has the Society Admin role or internships.manage permission and that the matching role policy is installed.`,
    };
  }
  return {
    code,
    message: `Supabase could not load ${area}. Check the project connection and database logs, then refresh the page.`,
  };
}

function LoadIssue({ area, issue }: { area: "listings" | "run history"; issue: NonNullable<ReturnType<typeof loadIssue>> }) {
  return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
    {issue.message} <span className="font-mono text-xs">Reference: {area} · {issue.code}</span>
  </p>;
}

export default async function ManageInternshipsPage({ searchParams }: { searchParams: Promise<{ result?: string; fields?: string }> }) {
  const [{ supabase }, params] = await Promise.all([requireManager("internships.manage"), searchParams]);
  const providerConfigured = Boolean(process.env.SERPAPI_API_KEY?.trim());
  const [listingsResult, runsResult] = await Promise.all([
    supabase.from("internships").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("internship_ingestion_runs").select("id, status, started_at, finished_at, duration_ms, results, error_summary").order("started_at", { ascending: false }).limit(10),
  ]);
  const listings = (listingsResult.data ?? []) as Tables<"internships">[];
  const listingsIssue = loadIssue("listings", listingsResult.error);
  const runsIssue = loadIssue("run history", runsResult.error);

  return <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Website & communication</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Internship listings</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Review source postings, keep eligibility structured, and publish only after checking the official application and source pages.</p></div>
      <Link href="/internships" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><ArrowUpRight aria-hidden="true" className="size-4" />Public directory</Link>
    </header>

    {!listingsIssue && params.result && resultMessages[params.result] && <p role="status" className={`mt-5 rounded-xl border p-4 text-sm ${["error", "invalid", "database_unavailable", "database_access_denied", "verification_required", "expired"].includes(params.result) ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100" : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"}`}>
      {params.result === "invalid" ? <>{resultMessages.invalid} {params.fields?.split(",").map((field) => invalidFieldLabels[field]).filter(Boolean).join(", ") || "Review the required fields, HTTPS links, supported values, and dates."}.</> : resultMessages[params.result]}
    </p>}
    {listingsIssue && <div className="mt-5"><LoadIssue area="listings" issue={listingsIssue} /></div>}
    {runsIssue && <div className="mt-5"><LoadIssue area="run history" issue={runsIssue} /></div>}

    <section className="mt-6 grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Total listings" value={listingsIssue ? "—" : String(listings.length)} icon={<BriefcaseBusiness aria-hidden="true" className="size-5" />} />
      <SummaryCard label="Public and verified" value={listingsIssue ? "—" : String(listings.filter((listing) => listing.listing_status === "open" && listing.verification_status === "verified").length)} icon={<BadgeCheck aria-hidden="true" className="size-5" />} />
      <SummaryCard label="Need review" value={listingsIssue ? "—" : String(listings.filter((listing) => listing.listing_status === "unverified" || listing.listing_status === "stale").length)} icon={<ShieldCheck aria-hidden="true" className="size-5" />} />
    </section>

    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30 sm:p-5">
      <h2 className="font-bold text-amber-950 dark:text-amber-100">Automatic discovery still needs review</h2>
      <p className="mt-1 text-sm leading-6 text-amber-950/90 dark:text-amber-100/90">{providerConfigured ? "SerpApi is configured. The daily job discovers internship postings for Google, NVIDIA, Microsoft, Amazon, and Netflix." : "Automatic discovery is not configured yet. Add the server-only SERPAPI_API_KEY to this deployment to search Google Jobs daily for Google, NVIDIA, Microsoft, Amazon, and Netflix internships."} It saves a result only when the application link is a job-specific page on that employer’s approved career domain. Provider links and descriptions are not published.</p>
      <p className="mt-2 text-xs leading-5 text-amber-950/80 dark:text-amber-100/80">Discovered opportunities stay private drafts. A Society Admin must open both official links, confirm the posting is current, and publish it before members can see it.</p>
    </section>

    <section id="add-listing" className="mt-6 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-slate-800 dark:text-sky-300"><Plus aria-hidden="true" className="size-5" /></span><div><h2 className="text-xl font-bold">Add an opportunity</h2><p className="text-sm text-slate-600 dark:text-slate-300">It will remain hidden until reviewed and published.</p></div></div>
      {listingsIssue ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Saving is temporarily unavailable because the listings database could not be loaded. Resolve the database warning above before adding or editing opportunities.</p> : <>
        <p className="mb-4 text-xs leading-5 text-slate-500">Required: company name and HTTPS careers page, title, description, and HTTPS application and source links. Optional dates must be valid; country codes use two letters.</p>
        <InternshipAdminForm action={createInternship} />
      </>}
    </section>

    <section className="mt-8" aria-labelledby="listing-records-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="listing-records-heading" className="text-2xl font-bold">All listings</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Newest changes first · up to 100 records</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Admin review queue</span></div>
      {listingsIssue ? <p className="rounded-2xl border border-dashed border-rose-200 bg-white p-6 text-center text-sm text-rose-900 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-100">The listing table is unavailable, so records are not shown. See the database warning above for the migration or permission fix.</p> : !listings.length ? <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No listings yet. Add an official opportunity above when one is ready for review.</p> : <div className="space-y-3">
        {listings.map((listing) => <article key={listing.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-sky-800 dark:text-sky-300">{listing.company_name}</p><h3 className="mt-1 text-lg font-bold">{listing.title}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{listing.city || listing.country_code || listing.location_label || "Location not listed"} · {listing.deadline ? `Deadline ${dateLabel(listing.deadline, true)} IST` : "No deadline listed"}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(listing.listing_status)}`}>{listing.listing_status}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(listing.verification_status)}`}>{listing.verification_status}</span></div></div>
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between"><div className="flex flex-wrap gap-3 text-xs text-slate-500"><a href={listing.official_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 underline underline-offset-2"><ExternalLink aria-hidden="true" className="size-3.5" />Official source</a><a href={listing.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 underline underline-offset-2"><ExternalLink aria-hidden="true" className="size-3.5" />Application link</a><span className="inline-flex min-h-9 items-center gap-1"><Clock3 aria-hidden="true" className="size-3.5" />Checked {dateLabel(listing.verified_at)} IST</span></div>
            <div className="flex flex-wrap gap-2"><Link href={`/manage/internships/${listing.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Edit</Link>
              {listing.listing_status !== "closed" && <form action={closeInternship}><input type="hidden" name="id" value={listing.id} /><button type="submit" className="min-h-10 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-800 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-200 dark:hover:bg-rose-950/30">Close</button></form>}
              {listing.listing_status !== "open" || listing.verification_status !== "verified" ? <form action={verifyAndPublishInternship} className="flex flex-col gap-2 sm:items-end"><input type="hidden" name="id" value={listing.id} /><label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" name="confirm_official_source" value="yes" required className="size-4 rounded border-slate-300 text-sky-700" />I checked both official links</label><button type="submit" className="min-h-10 rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800">Verify and publish</button></form> : null}
            </div>
          </div>
        </article>)}
      </div>}
    </section>

    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2"><Clock3 aria-hidden="true" className="size-5 text-sky-700" /><h2 className="text-lg font-bold">Scheduled verification runs</h2></div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">The daily job discovers official internship links, expires old records, and hides listings whose verification check is overdue.</p>
      {runsIssue ? <div className="mt-4"><LoadIssue area="run history" issue={runsIssue} /></div> : !runsResult.data?.length ? <p className="mt-4 text-sm text-slate-500">No scheduled runs recorded yet. Cron runs on production deployments only.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[38rem] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700"><tr><th className="py-2 pr-4">Started</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Duration</th><th className="py-2">Summary</th></tr></thead><tbody>{runsResult.data.map((run) => <tr key={run.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 pr-4">{dateLabel(run.started_at)}</td><td className="py-3 pr-4">{run.status}</td><td className="py-3 pr-4">{run.duration_ms === null ? "—" : `${run.duration_ms} ms`}</td><td className="max-w-md truncate py-3">{run.error_summary ?? JSON.stringify(run.results)}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-800 dark:bg-slate-800 dark:text-sky-200">{icon}</span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-bold">{value}</p></div></div>;
}
