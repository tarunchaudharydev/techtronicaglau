import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  Layers3,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { Tables } from "@/types/database";
import { requireManager } from "@/lib/manage/server";
import ResultMessage from "@/components/manage/ResultMessage";
import { createPosition, deletePosition, updatePosition } from "./actions";

export const metadata: Metadata = { title: "Positions | Techtronica management" };

export default async function PositionsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const { result } = await searchParams;
  const { supabase } = await requireManager("positions.manage");
  const [positionResult, roleResult, clubResult] = await Promise.all([
    supabase.from("positions").select("id, name, description, club_id, role_id, display_order, is_active, clubs(name), roles(name, scope)").order("display_order").order("name").limit(200),
    supabase.from("roles").select("id, name, scope").order("scope").order("name").limit(100),
    supabase.from("clubs").select("id, name").eq("is_active", true).order("display_order").limit(20),
  ]);
  const positions = positionResult.data ?? [];
  const roles = roleResult.data ?? [];
  const clubs = clubResult.data ?? [];
  const hasLookupError = Boolean(roleResult.error || clubResult.error);
  const hasError = Boolean(positionResult.error || hasLookupError);

  return <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-sky-50/70 via-slate-50 to-white px-4 py-6 sm:px-6 sm:py-10">
    <div className="mx-auto max-w-7xl">
      <Link href="/manage" className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-2 text-sm font-semibold text-slate-600 transition hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><ArrowLeft aria-hidden="true" className="size-4" /> Management</Link>

      <header className="relative isolate mt-4 overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-violet-100/80 p-5 shadow-[0_18px_60px_-35px_rgba(14,116,144,0.3)] sm:p-8 lg:p-10">
        <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-fuchsia-200/35 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-24 right-1/3 -z-10 size-64 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-sky-800 shadow-sm"><BriefcaseBusiness aria-hidden="true" className="size-3.5" /> Society structure</span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Positions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">Define who serves where, and connect each position to the right access role. Society-wide and club positions stay easy to tell apart.</p>
          </div>
          <a href="#add-position" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"><Plus aria-hidden="true" className="size-4" /> Add position</a>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-sky-200/70 pt-4">
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3 text-xs font-semibold text-slate-700"><Building2 aria-hidden="true" className="size-4 text-sky-700" /> Society-wide</span>
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3 text-xs font-semibold text-slate-700"><Layers3 aria-hidden="true" className="size-4 text-violet-700" /> Club-specific</span>
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3 text-xs font-semibold text-slate-700"><ShieldCheck aria-hidden="true" className="size-4 text-emerald-700" /> Linked to a permission role</span>
        </div>
      </header>

      <ResultMessage result={result} />
      {hasError && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700"><CircleAlert aria-hidden="true" className="size-4" /></span>
        <div><p className="font-semibold">Some position data did not load</p><p className="mt-1 text-rose-900">Refresh the page and check your assigned scope. Save controls are unavailable if roles or clubs could not be loaded.</p></div>
      </div>}

      <section id="add-position" className="mt-7 scroll-mt-5 overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-[0_12px_40px_-30px_rgba(14,116,144,0.35)]">
        <details>
          <summary className="group flex min-h-[84px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden sm:px-7">
            <span className="flex min-w-0 items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-100 to-violet-100 text-sky-800"><Plus aria-hidden="true" className="size-5" /></span>
              <span className="min-w-0"><span className="block truncate text-base font-bold text-slate-900">Add a position</span><span className="mt-1 block text-sm text-slate-500">Set its scope, permission role, and display order.</span></span>
            </span>
            <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-100 bg-gradient-to-br from-white to-sky-50/50 px-5 py-5 sm:px-7 sm:py-7">
            {roles.length === 0 && !roleResult.error && <LookupNotice>There are no permission roles available yet. Add a role in Roles &amp; access before creating a position.</LookupNotice>}
            <PositionForm action={createPosition} clubs={clubs} roles={roles} disabled={hasLookupError || roles.length === 0} mode="create" />
          </div>
        </details>
      </section>

      <section aria-labelledby="position-list-heading" className="mt-9">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Your assigned scope</p>
            <h2 id="position-list-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Position directory</h2>
          </div>
          <p className="text-sm text-slate-500">{positionResult.error ? "Position count unavailable" : `${positions.length}${positions.length === 200 ? "+" : ""} ${positions.length === 1 ? "position" : "positions"}`}</p>
        </div>

        <div className="space-y-3">
          {positions.map((position) => <PositionCard key={position.id} position={position} clubs={clubs} roles={roles} disabled={hasLookupError} />)}
          {!positions.length && !positionResult.error && <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-5 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Sparkles aria-hidden="true" className="size-5" /></span>
            <h3 className="mt-4 font-bold text-slate-900">No positions in your scope yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Add the first society or club position to make your team structure clear.</p>
            <a href="#add-position" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white hover:bg-sky-800">Create a position <ArrowUpRight aria-hidden="true" className="size-4" /></a>
          </div>}
        </div>
      </section>
    </div>
  </main>;
}

type Club = Pick<Tables<"clubs">, "id" | "name">;
type Role = Pick<Tables<"roles">, "id" | "name" | "scope">;
type Position = Pick<Tables<"positions">, "id" | "name" | "description" | "club_id" | "role_id" | "display_order" | "is_active"> & {
  clubs: Pick<Tables<"clubs">, "name"> | null;
  roles: Pick<Tables<"roles">, "name" | "scope"> | null;
};

function PositionCard({ position, clubs, roles, disabled }: { position: Position; clubs: Club[]; roles: Role[]; disabled: boolean }) {
  const roleName = position.roles?.name ?? "Role unavailable";
  const roleScope = position.roles?.scope;
  const location = position.clubs?.name ?? "Society-wide";
  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_-26px_rgba(15,23,42,0.28)] transition hover:border-sky-200 hover:shadow-md">
    <details>
      <summary className="group cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden sm:px-6 sm:py-5">
        <span className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex min-w-0 items-start gap-3 sm:items-center">
            <span className={`mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl ${position.club_id ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>
              {position.club_id ? <Layers3 aria-hidden="true" className="size-5" /> : <Building2 aria-hidden="true" className="size-5" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold text-slate-900 sm:text-lg">{position.name}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                <span>{location}</span><span aria-hidden="true" className="text-slate-300">·</span><span className="truncate">{roleName}</span>
              </span>
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-2 pl-14 sm:justify-end sm:pl-0">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-800">{roleScope ?? "role"} role</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${position.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{position.is_active ? "Active" : "Inactive"}</span>
            <span className="inline-flex min-h-9 items-center gap-1 pl-1 text-sm font-semibold text-sky-700">Edit <ChevronDown aria-hidden="true" className="size-4 transition group-open:rotate-180" /></span>
          </span>
        </span>
      </summary>
      <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-6">
        {disabled && <LookupNotice>Role or club choices could not be loaded. Refresh before editing this position.</LookupNotice>}
        <PositionForm action={updatePosition} clubs={clubs} roles={roles} position={position} disabled={disabled} mode="edit" />
        <form action={deletePosition} className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">Delete only if this position should no longer exist. Deactivation keeps its history.</p>
          <input type="hidden" name="id" value={position.id} />
          <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 sm:w-auto" type="submit"><Trash2 aria-hidden="true" className="size-4" /> Delete position</button>
        </form>
      </div>
    </details>
  </article>;
}

function PositionForm({ action, clubs, roles, position, disabled, mode }: { action: (formData: FormData) => void | Promise<void>; clubs: Club[]; roles: Role[]; position?: Position; disabled: boolean; mode: "create" | "edit" }) {
  const societyRoles = roles.filter((role) => role.scope === "society");
  const clubRoles = roles.filter((role) => role.scope === "club");
  return <form action={action} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
    {position && <input type="hidden" name="id" value={position.id} />}
    <Field label="Position name"><input name="name" required minLength={2} maxLength={100} defaultValue={position?.name ?? ""} className={inputClass} placeholder="e.g. President" disabled={disabled} /></Field>
    <Field label="Scope">
      <select name="club_id" defaultValue={position?.club_id ?? ""} className={inputClass} disabled={disabled}>
        <option value="">Society-wide</option>
        {clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
      </select>
    </Field>
    <Field label="Permission role">
      <select name="role_id" required defaultValue={position?.role_id ?? ""} className={inputClass} disabled={disabled}>
        <option value="">Choose the matching role</option>
        {societyRoles.length > 0 && <optgroup label="Society roles">{societyRoles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</optgroup>}
        {clubRoles.length > 0 && <optgroup label="Club roles">{clubRoles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}</optgroup>}
        {position && !roles.some((role) => role.id === position.role_id) && <option value={position.role_id}>Currently linked role (unavailable)</option>}
      </select>
      <span className="mt-1 block text-xs leading-5 text-slate-500">Match a society role with society-wide scope, or a club role with a club scope.</span>
    </Field>
    <Field label="Display order"><input name="display_order" type="number" min="-9999" max="9999" defaultValue={position?.display_order ?? 0} className={inputClass} disabled={disabled} /><span className="mt-1 block text-xs text-slate-500">Lower numbers appear first.</span></Field>
    <Field label="Description"><textarea name="description" maxLength={500} rows={3} defaultValue={position?.description ?? ""} className={inputClass} placeholder="What this position is responsible for" disabled={disabled} /></Field>
    {mode === "edit" && <label className="flex min-h-12 items-center gap-3 self-start rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 sm:mt-6" aria-disabled={disabled}><input name="is_active" type="checkbox" defaultChecked={position?.is_active ?? true} disabled={disabled} className="size-4 accent-emerald-600" /><span className="flex items-center gap-2">Active{position?.is_active && <Check aria-hidden="true" className="size-4 text-emerald-600" />}</span></label>}
    <div className="sm:col-span-2">
      <button className={`${buttonClass} min-h-11 w-full sm:w-auto`} type="submit" disabled={disabled}>{mode === "create" ? <><Plus aria-hidden="true" className="size-4" /> Create position</> : <><Check aria-hidden="true" className="size-4" /> Save changes</>}</button>
      {disabled && <p className="mt-2 text-xs text-amber-800">This form is disabled until the role and club options load.</p>}
    </div>
  </form>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>;
}

function LookupNotice({ children }: { children: ReactNode }) {
  return <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{children}</p>;
}

const inputClass = "mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400";
