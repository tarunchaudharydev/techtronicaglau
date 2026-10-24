import type { ReactNode } from "react";
import type { Tables } from "@/types/database";

type Listing = Tables<"internships">;
const categories = [
  ["software-engineering", "Software engineering"], ["hardware", "Hardware"], ["ai-ml", "AI / ML"],
  ["embedded-systems", "Embedded systems"], ["vlsi", "VLSI"], ["rtl-design", "RTL design"],
  ["verification", "Verification"], ["cybersecurity", "Cybersecurity"], ["cloud", "Cloud"],
  ["data-science", "Data science"], ["other", "Other"],
] as const;
const degrees = [["any", "Any qualification"], ["diploma", "Diploma"], ["bachelor", "Bachelor’s"], ["master", "Master’s"], ["phd", "PhD"]] as const;

function dateInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (name: string) => parts.find((entry) => entry.type === name)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function Field({ id, label, children, className = "" }: { id: string; label: string; children: ReactNode; className?: string }) {
  return <div className={className}><label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</label>{children}</div>;
}

const inputClass = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const checkClass = "size-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600";

export default function InternshipAdminForm({
  action, initial, companyName = "", careersUrl = "", submitLabel = "Save as unverified draft",
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: Listing;
  companyName?: string;
  careersUrl?: string;
  submitLabel?: string;
}) {
  return <form action={action} className="space-y-6">
    {initial && <input type="hidden" name="id" value={initial.id} />}
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="company_name" label="Company name"><input id="company_name" className={inputClass} name="company_name" required maxLength={140} defaultValue={initial?.company_name ?? companyName} placeholder="Example: Google" /></Field>
      <Field id="company_careers_url" label="Company careers page URL"><input id="company_careers_url" className={inputClass} name="company_careers_url" type="url" required maxLength={2048} defaultValue={careersUrl} placeholder="https://company.example/careers" /></Field>
      <Field id="title" label="Internship title"><input id="title" className={inputClass} name="title" required maxLength={180} defaultValue={initial?.title ?? ""} placeholder="Software Engineering Intern" /></Field>
      <Field id="work_arrangement" label="Work arrangement"><select id="work_arrangement" className={inputClass} name="work_arrangement" defaultValue={initial?.work_arrangement ?? "unknown"}><option value="unknown">Not specified</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></Field>
      <Field id="country_code" label="Country code (ISO 2-letter)"><input id="country_code" className={inputClass} name="country_code" maxLength={2} defaultValue={initial?.country_code ?? ""} placeholder="IN" autoCapitalize="characters" /></Field>
      <Field id="city" label="City"><input id="city" className={inputClass} name="city" maxLength={100} defaultValue={initial?.city ?? ""} placeholder="Mathura" /></Field>
      <Field id="location_label" label="Location details"><input id="location_label" className={inputClass} name="location_label" maxLength={160} defaultValue={initial?.location_label ?? ""} placeholder="Office, region, or additional location note" /></Field>
      <Field id="deadline" label="Application deadline (India time) "><input id="deadline" className={inputClass} name="deadline" type="datetime-local" defaultValue={dateInput(initial?.deadline)} /><span className="mt-1 block text-xs text-slate-500">Leave blank if the official page does not list a deadline.</span></Field>
      <Field id="posted_at" label="Original posting date (India time)"><input id="posted_at" className={inputClass} name="posted_at" type="datetime-local" defaultValue={dateInput(initial?.posted_at)} /></Field>
    </div>

    <Field id="description" label="Description (plain text; no HTML)"><textarea id="description" className={`${inputClass} min-h-36 py-3`} name="description" required maxLength={12000} defaultValue={initial?.description ?? ""} placeholder="Summarize the responsibilities and opportunity using information from the official listing." /></Field>
    <Field id="skills" label="Required skills (comma separated)"><input id="skills" className={inputClass} name="skills" maxLength={2000} defaultValue={initial?.skills.join(", ") ?? ""} placeholder="Python, C++, teamwork" /></Field>

    <fieldset><legend className="text-sm font-semibold">Technical domains</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{categories.map(([value, label]) => <label key={value} className="flex min-h-10 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm dark:bg-slate-800"><input className={checkClass} type="checkbox" name="technical_categories" value={value} defaultChecked={initial?.technical_categories.includes(value)} />{label}</label>)}</div></fieldset>
    <fieldset><legend className="text-sm font-semibold">Qualification requirements</legend><div className="mt-2 flex flex-wrap gap-2">{degrees.map(([value, label]) => <label key={value} className="flex min-h-10 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm dark:bg-slate-800"><input className={checkClass} type="checkbox" name="degree_requirements" value={value} defaultChecked={initial?.degree_requirements.includes(value)} />{label}</label>)}</div></fieldset>
    <fieldset><legend className="text-sm font-semibold">Eligible student years</legend><div className="mt-2 flex flex-wrap gap-2">{[1, 2, 3, 4, 5, 6, 7, 8].map((year) => <label key={year} className="flex min-h-10 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm dark:bg-slate-800"><input className={checkClass} type="checkbox" name="eligible_years" value={year} defaultChecked={initial?.eligible_years.includes(year)} />Year {year}</label>)}</div></fieldset>

    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="application_url" label="Official application URL"><input id="application_url" className={inputClass} name="application_url" type="url" required maxLength={2048} defaultValue={initial?.application_url ?? ""} placeholder="https://official-company-site/apply" /></Field>
      <Field id="official_source_url" label="Official source posting URL"><input id="official_source_url" className={inputClass} name="official_source_url" type="url" required maxLength={2048} defaultValue={initial?.official_source_url ?? ""} placeholder="https://official-company-site/jobs/…" /></Field>
    </div>
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">New and edited listings stay unpublished until a Society Admin checks the official source and explicitly verifies them. The source link and apply link must use HTTPS.</p>
    <button type="submit" className="min-h-12 w-full rounded-xl bg-sky-700 px-5 text-sm font-bold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 sm:w-auto">{submitLabel}</button>
  </form>;
}
