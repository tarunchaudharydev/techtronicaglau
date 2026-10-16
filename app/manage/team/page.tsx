import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Tables } from "@/types/database";
import ResultMessage from "@/components/manage/ResultMessage";
import { requireManager } from "@/lib/manage/server";
import { createTeamMember, deleteTeamMember, updateTeamMember } from "./actions";
import StorageImageUpload from "@/components/manage/StorageImageUpload";
import AdminDataTable from "@/components/manage/AdminDataTable";

export const metadata: Metadata = { title: "Team directory | Techtronica management" };

const PAGE_SIZE = 25;
const MEMBER_COLUMNS = "id, display_name, title, member_type, roles, categories, summary, biography, avatar_url, linkedin_url, public_contact_url, birthday_month, birthday_day, club_id, display_order, is_active, is_public";

type TeamSearchParams = {
  result?: string;
  search?: string;
  page?: string;
};

export default async function ManageTeamPage({ searchParams }: { searchParams: Promise<TeamSearchParams> }) {
  const params = await searchParams;
  const search = normalizeSearch(params.search);
  const requestedPage = parsePage(params.page);
  const { supabase } = await requireManager("team.manage");

  const createMembersCountQuery = () => {
    let query = supabase.from("team_members").select("id", { count: "exact", head: true });
    if (search) query = query.ilike("display_name", `%${search}%`);
    return query;
  };

  const [countResult, clubsResult] = await Promise.all([
    createMembersCountQuery(),
    supabase.from("clubs").select("id, name, slug").eq("is_active", true).order("display_order").limit(20),
  ]);

  const total = countResult.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  let membersQuery = supabase.from("team_members").select(MEMBER_COLUMNS).order("display_order").order("display_name").order("id");
  if (search) membersQuery = membersQuery.ilike("display_name", `%${search}%`);
  const membersResult = countResult.error
    ? { data: null, error: countResult.error }
    : await membersQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const members = membersResult.data ?? [];
  const clubs = clubsResult.data ?? [];
  const hasError = Boolean(countResult.error || membersResult.error || clubsResult.error);
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  const teamColumns = [
    { key: "name", label: "Name" }, { key: "title", label: "Title" }, { key: "type", label: "Type" },
    { key: "club", label: "Club scope" }, { key: "status", label: "Status" }, { key: "visibility", label: "Visibility" },
    { key: "roles", label: "Roles", defaultVisible: false },
  ];
  const tableRows = !hasError ? members.map((member) => {
    const club = clubs.find((item) => item.id === member.club_id);
    const values = {
      name: member.display_name, title: member.title, type: member.member_type,
      club: club?.name ?? "Society-wide", status: member.is_active ? "Active" : "Inactive",
      visibility: member.is_public ? "Public" : "Members only", roles: member.roles.join(", ") || "—",
    };
    return {
      id: member.id, values, cells: values, searchText: Object.values(values).join(" "),
      actions: <a href={`#team-member-${member.id}`} className="font-semibold text-sky-700 underline underline-offset-2">Edit</a>,
      card: <article id={`team-member-${member.id}`} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <details>
          <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden sm:p-5">
            <span className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className="min-w-0"><span className="block truncate text-base font-semibold">{member.display_name}</span><span className="mt-1 block truncate text-sm text-muted">{member.title} · {member.member_type}</span></span>
              <span className="flex flex-wrap items-center gap-2 sm:justify-end"><StatusBadge active={member.is_active} /><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.is_public ? "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200" : "bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-200"}`}>{values.visibility}</span><span aria-hidden="true" className="ml-1 text-sm font-medium text-sky-700">Edit ↓</span></span>
            </span>
          </summary>
          <div className="border-t border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <TeamForm action={updateTeamMember} clubs={clubs} member={member} search={search} page={page} />
            <form action={deleteTeamMember} className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800"><input type="hidden" name="id" value={member.id} /><input type="hidden" name="search" value={search} /><input type="hidden" name="page" value={page} /><PendingSubmitButton type="submit" className="min-h-10 rounded-lg px-2 text-sm font-semibold text-rose-700 underline underline-offset-2 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950">Delete profile</PendingSubmitButton></form>
          </div>
        </details>
      </article>,
    };
  }) : [];

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Team directory</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Find and manage team profiles. Public profiles are visible to everyone by default; private profiles follow the database access rules for active society and club members.</p>
      </div>
      <a href="#add-profile" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">Add a profile</a>
    </div>

    <ResultMessage result={params.result} />
    {hasError && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">The directory could not be fully loaded. Refresh and check your team permissions.</p>}

    <section id="add-profile" className="mt-7 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <details>
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-lg font-semibold">Add a team profile</span>
              <span className="mt-1 block text-sm text-muted">Create a team, mentor, or faculty profile.</span>
            </span>
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl text-slate-700 dark:bg-slate-800 dark:text-slate-200">+</span>
          </span>
        </summary>
        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
          <TeamForm action={createTeamMember} clubs={clubs} search={search} page={page} />
        </div>
      </details>
    </section>

    <section aria-labelledby="profiles-heading" className="mt-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="profiles-heading" className="text-xl font-semibold">Profiles</h2>
          <p className="mt-1 text-sm text-muted">{hasError ? "Profile count unavailable" : `Showing ${start}–${end} of ${total.toLocaleString()} profiles`}</p>
        </div>
        <form action="/manage/team" method="get" role="search" className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
          <label htmlFor="team-search" className="sr-only">Search profiles by name</label>
          <input id="team-search" name="search" type="search" maxLength={80} defaultValue={search} placeholder="Search by name" autoComplete="off" className={`${inputClass} mt-0 min-h-11 min-w-0 flex-1`} />
          <button type="submit" className={`${buttonClass} min-h-11 w-full sm:w-auto`}>Search</button>
          {search && <Link href="/manage/team" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Clear</Link>}
        </form>
      </div>

      <AdminDataTable id="manage-team" columns={teamColumns} rows={tableRows} emptyMessage={search ? "No matching profiles on this page." : "No team profiles yet. Add a profile to get the directory started."} />

      {!hasError && pageCount > 1 && <nav aria-label="Team profile pages" className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Page {page} of {pageCount.toLocaleString()}</p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {page > 1
            ? <Link rel="prev" href={pageHref(search, page - 1)} className={paginationClass}>← Previous</Link>
            : <span aria-disabled="true" className={`${paginationClass} cursor-not-allowed opacity-50`}>← Previous</span>}
          {page < pageCount
            ? <Link rel="next" href={pageHref(search, page + 1)} className={paginationClass}>Next →</Link>
            : <span aria-disabled="true" className={`${paginationClass} cursor-not-allowed opacity-50`}>Next →</span>}
        </div>
      </nav>}
    </section>
  </main>;
}

type Club = { id: string; name: string; slug: string };
type TeamRecord = Pick<Tables<"team_members">, "id" | "display_name" | "title" | "member_type" | "roles" | "categories" | "summary" | "biography" | "avatar_url" | "linkedin_url" | "public_contact_url" | "birthday_month" | "birthday_day" | "club_id" | "display_order" | "is_active" | "is_public">;

function TeamForm({ action, clubs, member, search, page }: { action: (formData: FormData) => void | Promise<void>; clubs: Club[]; member?: TeamRecord; search: string; page: number }) {
  return <form action={action} className="grid gap-4 sm:grid-cols-2">
    {member && <input type="hidden" name="id" value={member.id} />}
    <input type="hidden" name="search" value={search} />
    <input type="hidden" name="page" value={page} />
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
    <div className="flex flex-wrap gap-x-6 gap-y-3 sm:col-span-2">
      <label className="flex min-h-10 items-center gap-2 text-sm"><input name="is_public" type="checkbox" defaultChecked={member?.is_public ?? true} /> Public by default</label>
      <label className="flex min-h-10 items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={member?.is_active ?? true} /> Active</label>
    </div>
    <PendingSubmitButton className={`${buttonClass} min-h-11 w-full sm:w-auto`} type="submit">{member ? "Save profile" : "Add profile"}</PendingSubmitButton>
  </form>;
}

function normalizeSearch(value?: string) {
  if (!value) return "";
  // ILIKE treats these as wildcard operators; keep the search literal and bounded.
  return value.replace(/[%_]/g, " ").trim().replace(/\s+/g, " ").slice(0, 80);
}

function parsePage(value?: string) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1_000_000) : 1;
}

function pageHref(search: string, page: number) {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  query.set("page", String(page));
  return `/manage/team?${query.toString()}`;
}

function biographyText(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.flatMap((part) => part && typeof part === "object" && "text" in part && typeof part.text === "string" ? [part.text] : []).join("\n");
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-medium">{label}{children}</label>; }

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{active ? "Active" : "Inactive"}</span>;
}

const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
const paginationClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";
