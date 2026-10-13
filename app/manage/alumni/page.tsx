import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Tables } from "@/types/database";
import ResultMessage from "@/components/manage/ResultMessage";
import { requireManager } from "@/lib/manage/server";
import { createAlumnus, deleteAlumnus, updateAlumnus } from "./actions";
import StorageImageUpload from "@/components/manage/StorageImageUpload";

export const metadata: Metadata = { title: "Alumni directory | Techtronica management" };

export default async function ManageAlumniPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const { supabase } = await requireManager("alumni.manage");
  const [alumniResult, clubsResult] = await Promise.all([
    supabase.from("alumni").select("id, display_name, cohort, society_role, avatar_url, linkedin_url, current_role, current_company, current_location, achievements, message, display_order, is_featured, is_active, club_id").order("is_featured", { ascending: false }).order("display_order").limit(200),
    supabase.from("clubs").select("id, name, slug").eq("is_active", true).order("display_order").limit(20),
  ]);
  const alumni = alumniResult.data ?? [];
  const clubs = clubsResult.data ?? [];
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Alumni directory</h1>
    <p className="mt-2 text-sm text-muted">Maintain public alumni profiles, cohorts, achievements, and featured stories.</p>
    <ResultMessage result={result} />
    {(alumniResult.error || clubsResult.error) && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">Some alumni data could not be loaded. Refresh and check your access.</p>}
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-xl font-semibold">Add an alumnus</h2><AlumniForm action={createAlumnus} clubs={clubs} /></section>
    <section className="mt-8 space-y-4"><h2 className="text-xl font-semibold">Profiles <span className="text-sm font-normal text-muted">({alumni.length}{alumni.length === 200 ? "+" : ""})</span></h2>
      {alumni.map((person) => <article key={person.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><p className="mb-4 text-sm font-semibold">{person.display_name} <span className="font-normal text-muted">· {person.cohort} · {person.is_active ? "Active" : "Inactive"}</span></p><AlumniForm person={person} action={updateAlumnus} clubs={clubs} /><form action={deleteAlumnus} className="mt-3"><input type="hidden" name="id" value={person.id} /><PendingSubmitButton type="submit" className="text-sm font-medium text-rose-700 underline">Delete profile</PendingSubmitButton></form></article>)}
      {!alumni.length && !alumniResult.error && <p className="rounded-xl border border-slate-200 p-5 text-sm text-muted">No alumni profiles found.</p>}
    </section>
  </main>;
}

type Club = { id: string; name: string; slug: string };
type Person = Pick<Tables<"alumni">, "id" | "display_name" | "cohort" | "society_role" | "avatar_url" | "linkedin_url" | "current_role" | "current_company" | "current_location" | "achievements" | "message" | "display_order" | "is_featured" | "is_active" | "club_id">;
function AlumniForm({ action, clubs, person }: { action: (formData: FormData) => void | Promise<void>; clubs: Club[]; person?: Person }) {
  return <form action={action} className="grid gap-4 md:grid-cols-2">{person && <input type="hidden" name="id" value={person.id} />}
    <Field label="Name"><input name="display_name" required maxLength={120} defaultValue={person?.display_name ?? ""} className={inputClass} /></Field>
    <Field label="Cohort / year"><input name="cohort" required maxLength={60} defaultValue={person?.cohort ?? ""} className={inputClass} placeholder="2022–2024" /></Field>
    <Field label="Society role"><input name="society_role" required maxLength={120} defaultValue={person?.society_role ?? ""} className={inputClass} /></Field>
    <Field label="Club"><select name="club_id" defaultValue={person?.club_id ?? ""} className={inputClass}><option value="">Society-wide</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></Field>
    <Field label="Current role"><input name="current_role" maxLength={120} defaultValue={person?.current_role ?? ""} className={inputClass} /></Field>
    <Field label="Current company"><input name="current_company" maxLength={120} defaultValue={person?.current_company ?? ""} className={inputClass} /></Field>
    <Field label="Current location"><input name="current_location" maxLength={120} defaultValue={person?.current_location ?? ""} className={inputClass} /></Field>
    <Field label="Avatar URL"><input name="avatar_url" type="url" maxLength={2048} defaultValue={person?.avatar_url ?? ""} className={inputClass} /></Field>
    <div><StorageImageUpload name="uploaded_asset_url" folder="alumni" folderScopeField="club_id" folderScopeOptions={Object.fromEntries(clubs.map((club) => [club.id, club.slug]))} label="Upload one alumni image" /></div>
    <Field label="LinkedIn URL"><input name="linkedin_url" type="url" maxLength={2048} defaultValue={person?.linkedin_url ?? ""} className={inputClass} /></Field>
    <Field label="Display order"><input name="display_order" type="number" min="-9999" max="9999" defaultValue={person?.display_order ?? 0} className={inputClass} /></Field>
    <Field label="Achievements (one per line)"><textarea name="achievements" maxLength={3000} rows={3} defaultValue={person?.achievements.join("\n") ?? ""} className={inputClass} /></Field>
    <Field label="Message"><textarea name="message" maxLength={2000} rows={3} defaultValue={person?.message ?? ""} className={inputClass} /></Field>
    <div className="flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={person?.is_featured ?? false} /> Featured</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={person?.is_active ?? true} /> Active</label></div>
    <PendingSubmitButton type="submit" className={buttonClass}>{person ? "Save profile" : "Add alumnus"}</PendingSubmitButton>
  </form>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="text-sm font-medium">{label}{children}</label>; }
const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
