import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BadgeCheck, CalendarDays, MapPin } from "lucide-react";
import { getPublicInternshipById } from "@/lib/data/internships";

export const metadata: Metadata = { title: "Internship details | Techtronica" };

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export default async function InternshipDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) notFound();
  const { listing, error } = await getPublicInternshipById(id);
  if (!listing && !error) notFound();
  if (error) return <main className="mx-auto max-w-3xl px-4 py-16"><div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"><h1 className="font-bold">This opportunity couldn’t be loaded</h1><p className="mt-2 text-sm">Return to the directory and try again.</p><Link className="mt-4 inline-flex min-h-10 items-center gap-2 underline" href="/internships"><ArrowLeft aria-hidden="true" className="size-4" />Back to internships</Link></div></main>;
  if (!listing) notFound();
  const location = [listing.city, listing.country_code].filter(Boolean).join(", ") || listing.location_label || "Location not specified";

  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
    <Link href="/internships" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />All internships</Link>
    <article className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-6 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold text-sky-800 dark:text-sky-300">{listing.company_name}</p><span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"><BadgeCheck aria-hidden="true" className="size-4" />Verified open</span></div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{listing.title}</h1>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-300"><span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" className="size-4" />{location}</span><span>{listing.work_arrangement === "unknown" ? "Work arrangement not specified" : listing.work_arrangement}</span>{listing.deadline ? <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4" />Apply by {formatDate(listing.deadline)} IST</span> : <span>Deadline not listed by source</span>}</div>
      </div>
      <div className="space-y-8 p-6 sm:p-9">
        <section><h2 className="text-lg font-bold">About this opportunity</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{listing.description}</p></section>
        {listing.technical_categories.length > 0 && <section><h2 className="text-lg font-bold">Technical areas</h2><ul className="mt-3 flex flex-wrap gap-2">{listing.technical_categories.map((category) => <li key={category} className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900 dark:bg-slate-800 dark:text-sky-200">{category.replaceAll("-", " ")}</li>)}</ul></section>}
        {listing.skills.length > 0 && <section><h2 className="text-lg font-bold">Skills</h2><ul className="mt-3 flex flex-wrap gap-2">{listing.skills.map((skill) => <li key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{skill}</li>)}</ul></section>}
        {(listing.degree_requirements.length > 0 || listing.eligible_years.length > 0) && <section><h2 className="text-lg font-bold">Eligibility</h2><p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{listing.degree_requirements.length ? `Qualifications: ${listing.degree_requirements.join(", ")}. ` : "Qualification not specified. "}{listing.eligible_years.length ? `Eligible student years: ${listing.eligible_years.join(", ")}.` : "Eligible year not specified."}</p></section>}
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100"><p className="font-semibold">Verified by Techtronica</p><p className="mt-1">Official listing checked {formatDate(listing.verified_at)} IST. Recheck the company page for the latest eligibility and availability.</p></div>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row"><a href={listing.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-6 text-sm font-bold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">Apply on official site<ArrowUpRight aria-hidden="true" className="size-4" /><span className="sr-only"> (opens in a new tab)</span></a><a href={listing.official_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">View source posting<span className="sr-only"> (opens in a new tab)</span></a></div>
      </div>
    </article>
  </main>;
}
