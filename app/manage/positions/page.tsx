import type { Metadata } from "next";
import Link from "next/link";
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
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Positions</h1>
    <p className="mt-2 text-sm text-muted">Create society or club positions, connect them to permission roles, and deactivate old positions while keeping history.</p>
    <ResultMessage result={result} />
    {(positionResult.error || roleResult.error || clubResult.error) && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">Some management data could not be loaded. Refresh and check your assigned scope.</p>}
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Add a position</h2>
      <form action={createPosition} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Position name<input name="name" required minLength={2} maxLength={100} className={inputClass} placeholder="President" /></label>
        <label className="text-sm font-medium">Scope<select name="club_id" className={inputClass}><option value="">Society-wide</option>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
        <label className="text-sm font-medium">Permission role<select name="role_id" required className={inputClass}><option value="">Choose a role</option>{roles.map((role) => <option value={role.id} key={role.id}>{role.name} · {role.scope}</option>)}</select></label>
        <label className="text-sm font-medium">Display order<input name="display_order" type="number" min="-9999" max="9999" defaultValue="0" className={inputClass} /></label>
        <label className="text-sm font-medium md:col-span-2">Description<textarea name="description" maxLength={500} rows={2} className={inputClass} /></label>
        <button className={buttonClass} type="submit">Add position</button>
      </form>
    </section>
    <section className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Existing positions <span className="text-sm font-normal text-muted">({positions.length}{positions.length === 200 ? "+" : ""})</span></h2>
      {positions.map((position) => <article key={position.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <form action={updatePosition} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={position.id} />
          <label className="text-sm font-medium">Position name<input name="name" required maxLength={100} defaultValue={position.name} className={inputClass} /></label>
          <label className="text-sm font-medium">Scope<select name="club_id" defaultValue={position.club_id ?? ""} className={inputClass}><option value="">Society-wide</option>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
          <label className="text-sm font-medium">Role<select name="role_id" required defaultValue={position.role_id} className={inputClass}>{roles.map((role) => <option value={role.id} key={role.id}>{role.name} · {role.scope}</option>)}</select></label>
          <label className="text-sm font-medium">Display order<input name="display_order" type="number" min="-9999" max="9999" defaultValue={position.display_order} className={inputClass} /></label>
          <label className="text-sm font-medium md:col-span-2">Description<textarea name="description" maxLength={500} rows={2} defaultValue={position.description ?? ""} className={inputClass} /></label>
          <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={position.is_active} /> Active</label>
          <div className="flex flex-wrap gap-3"><button className={buttonClass} type="submit">Save</button></div>
        </form>
        <form action={deletePosition} className="mt-3">
          <input type="hidden" name="id" value={position.id} />
          <button className="text-sm font-medium text-rose-700 underline" type="submit">Delete position</button>
        </form>
      </article>)}
      {!positions.length && !positionResult.error && <p className="rounded-xl border border-slate-200 p-5 text-sm text-muted">No positions are visible in your assigned scope yet.</p>}
    </section>
  </main>;
}

const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
