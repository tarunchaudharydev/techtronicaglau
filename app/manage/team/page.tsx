import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Tables } from "@/types/database";
import ResultMessage from "@/components/manage/ResultMessage";
import { requireManager } from "@/lib/manage/server";
import { createTeamMember, deleteTeamMember, updateTeamMember } from "./actions";
import StorageImageUpload from "@/components/manage/StorageImageUpload";

export const metadata: Metadata = { title: "Team directory | Techtronica management" };

export default async function ManageTeamPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const { supabase } = await requireManager("team.manage");
  const [membersResult, clubsResult] = await Promise.all([
    supabase.from("team_members").select("id, display_name, title, member_type, roles, categories, summary, biography, avatar_url, linkedin_url, public_contact_url, birthday_month, birthday_day, club_id, display_order, is_active, is_public").order("display_order").order("display_name").limit(200),
    supabase.from("clubs").select("id, name, slug").eq("is_active", true).order("display_order").limit(20),
  ]);
  const members = membersResult.data ?? [];
  const clubs = clubsResult.data ?? [];
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Team directory</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Public profiles are visible to everyone by default. Private profiles are readable only by signed-in users with an active society or club membership. Every visibility check is enforced by database RLS.</p>
    <ResultMessage result={result} />
    {(membersResult.error || clubsResult.error) && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">Some directory data could not be loaded. Refresh and check your team permissions.</p>}
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Add a team profile</h2>
      <TeamForm action={createTeamMember} clubs={clubs} />
    </section>
    <section className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Profiles <span className="text-sm font-normal text-muted">({members.length}{members.length === 200 ? "+" : ""})</span></h2>
      {members.map((member) => <article key={member.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-4 text-sm font-semibold">{member.display_name} <span className="font-normal text-muted">· {member.is_public ? "Public" : "Members only"} · {member.is_active ? "Active" : "Inactive"}</span></p>
        <TeamForm action={updateTeamMember} clubs={clubs} member={member} />
        <form action={deleteTeamMember} className="mt-3"><input type="hidden" name="id" value={member.id} /><button type="submit" className="text-sm font-medium text-rose-700 underline">Delete profile</button></form>
      </article>)}
      {!members.length && !membersResult.error && <p className="rounded-xl border border-slate-200 p-5 text-sm text-muted">No profiles are visible in your assigned scope yet.</p>}
    </section>
  </main>;
}

type Club = { id: string; name: string; slug: string };
type TeamRecord = Pick<Tables<"team_members">, "id" | "display_name" | "title" | "member_type" | "roles" | "categories" | "summary" | "biography" | "avatar_url" | "linkedin_url" | "public_contact_url" | "birthday_month" | "birthday_day" | "club_id" | "display_order" | "is_active" | "is_public">;

function TeamForm({ action, clubs, member }: { action: (formData: FormData) => void | Promise<void>; clubs: Club[]; member?: TeamRecord }) {
  return <form action={action} className="grid gap-4 md:grid-cols-2">
    {member && <input type="hidden" name="id" value={member.id} />}
    <Field label="Display name"><input name="display_name" required maxLength={120} defaultValue={member?.display_name ?? ""} className={inputClass} /></Field>
    <Field label="Title or position"><input name="title" required maxLength={120} defaultValue={member?.title ?? ""} className={inputClass} /></Field>
    <Field label="Profile type"><select name="member_type" defaultValue={member?.member_type ?? "team"} className={inputClass}><option value="team">Team</option><option value="mentor">Mentor</option><option value="faculty">Faculty</option></select></Field>
    <Field label="Club scope"><select name="club_id" defaultValue={member?.club_id ?? ""} className={inputClass}><option value="">Society-wide</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></Field>
    <Field label="Roles (comma separated)"><input name="roles" maxLength={500} defaultValue={member?.roles.join(", ") ?? ""} className={inputClass} /></Field>
    <Field label="Categories (comma separated)"><input name="categories" maxLength={500} defaultValue={member?.categories.join(", ") ?? ""} className={inputClass} /></Field>
    <Field label="Short bio"><textarea name="summary" maxLength={500} rows={2} defaultValue={member?.summary ?? ""} className={inputClass} /></Field>
    <Field label="Biography (one paragraph per line)"><textarea name="biography" maxLength={5000} rows={3} defaultValue={biographyText(member?.biography)} className={inputClass} /></Field>
    <Field label="Avatar image URL or private storage reference"><input name="avatar_url" type="text" maxLength={2048} defaultValue={member?.avatar_url ?? ""} className={inputClass} /></Field>
    <div><StorageImageUpload name="uploaded_asset_url" folder="team" folderScopeField="club_id" folderScopeOptions={Object.fromEntries(clubs.map((club) => [club.id, club.slug]))} privateWhenUnchecked label="Upload one profile image" /></div>
    <Field label="LinkedIn URL"><input name="linkedin_url" type="url" maxLength={2048} defaultValue={member?.linkedin_url ?? ""} className={inputClass} /></Field>
    <Field label="Public contact URL (HTTPS)"><input name="public_contact_url" type="url" maxLength={2048} defaultValue={member?.public_contact_url ?? ""} className={inputClass} /></Field>
    <Field label="Birthday month"><input name="birthday_month" type="number" min="1" max="12" defaultValue={member?.birthday_month ?? ""} className={inputClass} /></Field>
    <Field label="Birthday day"><input name="birthday_day" type="number" min="1" max="31" defaultValue={member?.birthday_day ?? ""} className={inputClass} /></Field>
    <Field label="Display order"><input name="display_order" type="number" min="-9999" max="9999" defaultValue={member?.display_order ?? 0} className={inputClass} /></Field>
    <div className="flex flex-wrap gap-5 md:col-span-2">
      <label className="flex items-center gap-2 text-sm"><input name="is_public" type="checkbox" defaultChecked={member?.is_public ?? true} /> Public by default</label>
      <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={member?.is_active ?? true} /> Active</label>
    </div>
    <button className={buttonClass} type="submit">{member ? "Save profile" : "Add profile"}</button>
  </form>;
}

function biographyText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.flatMap((part) => part && typeof part === "object" && "text" in part && typeof part.text === "string" ? [part.text] : []).join("\n");
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="text-sm font-medium">{label}{children}</label>; }
const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
