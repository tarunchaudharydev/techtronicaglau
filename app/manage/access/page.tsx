import type { Metadata } from "next";
import Link from "next/link";
import ResultMessage from "@/components/manage/ResultMessage";
import { requireManager } from "@/lib/manage/server";
import { assignRole, createRole, deleteRole, inviteUser, revokeRole, updateRole } from "./actions";

export const metadata: Metadata = { title: "Roles and access | Techtronica management" };

export default async function AccessManagementPage({ searchParams }: { searchParams: Promise<{ result?: string; q?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireManager("admin.manage");
  const query = (params.q || "").replace(/[%_,.()]/g, " ").trim().slice(0, 80);
  const [rolesResult, permissionsResult, rolePermissionResult, assignmentsResult, clubsResult, profilesResult] = await Promise.all([
    supabase.from("roles").select("id, name, scope, description, is_system").order("scope").order("name").limit(100),
    supabase.from("permissions").select("key, description").order("key").limit(100),
    supabase.from("role_permissions").select("role_id, permission_key").limit(1000),
    supabase.from("user_role_assignments").select("id, user_id, role_id, club_id, created_at, profiles!user_role_assignments_user_id_fkey(full_name), roles(name, scope), clubs(name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("clubs").select("id, name").eq("is_active", true).order("display_order").limit(20),
    (() => { let profiles = supabase.from("profiles").select("id, full_name, department").order("full_name").order("id").limit(25); if (query) profiles = profiles.ilike("full_name", `%${query}%`); return profiles; })(),
  ]);
  const roles = rolesResult.data ?? [];
  const permissions = permissionsResult.data ?? [];
  const rolePermissions = rolePermissionResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const clubs = clubsResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const loadError = rolesResult.error || permissionsResult.error || rolePermissionResult.error || assignmentsResult.error || clubsResult.error || profilesResult.error;
  return <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <Link href="/manage" className="text-sm font-medium text-sky-700 hover:underline">← Management</Link>
    <h1 className="mt-4 text-3xl font-bold">Roles and access</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Create permission bundles, connect users to roles, and send invitations. Society and club scopes are checked again by database policies and transactional functions.</p>
    <ResultMessage result={params.result} />
    {loadError && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">Some access data could not be loaded. Refresh and verify your admin role.</p>}

    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Invite a society user</h2>
      <p className="mt-1 text-sm text-muted">The invitation goes through the protected Supabase Edge Function. The user receives no management role until an admin explicitly assigns one.</p>
      <form action={inviteUser} className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">Full name<input name="full_name" maxLength={120} className={inputClass} /></label>
        <label className="text-sm font-medium">Email<input name="email" type="email" required maxLength={254} className={inputClass} /></label>
        <div className="self-end"><button className={buttonClass} type="submit">Send invitation</button></div>
      </form>
    </section>

    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Create a role</h2>
      <form action={createRole} className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Role name<input name="name" required minLength={2} maxLength={80} className={inputClass} /></label>
        <label className="text-sm font-medium">Scope<select name="scope" className={inputClass}><option value="society">Society-wide</option><option value="club">Club-scoped</option></select></label>
        <label className="text-sm font-medium md:col-span-2">Description<textarea name="description" maxLength={500} rows={2} className={inputClass} /></label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 md:col-span-2">{permissions.map((permission) => <label key={permission.key} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"><input type="checkbox" name="permission_keys" value={permission.key} className="mt-1" /><span><span className="block font-semibold">{permission.key}</span><span className="text-xs text-muted">{permission.description}</span></span></label>)}</div>
        <button className={buttonClass} type="submit">Create role</button>
      </form>
    </section>

    <section className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Role catalog <span className="text-sm font-normal text-muted">({roles.length}{roles.length === 100 ? "+" : ""})</span></h2>
      {roles.map((role) => {
        const keys = rolePermissions.filter((entry) => entry.role_id === role.id).map((entry) => entry.permission_key);
        return <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" key={role.id}>
          <form action={updateRole} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={role.id} />
            <label className="text-sm font-medium">Role name<input name="name" required maxLength={80} readOnly={role.is_system} defaultValue={role.name} className={`${inputClass} read-only:opacity-70`} /></label>
            <label className="text-sm font-medium">Scope<input readOnly value={role.scope === "society" ? "Society-wide" : "Club-scoped"} className={`${inputClass} opacity-70`} /></label>
            <label className="text-sm font-medium md:col-span-2">Description<textarea name="description" maxLength={500} rows={2} readOnly={role.is_system} defaultValue={role.description ?? ""} className={`${inputClass} read-only:opacity-70`} /></label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 md:col-span-2">{permissions.map((permission) => <label key={permission.key} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"><input type="checkbox" name="permission_keys" value={permission.key} defaultChecked={keys.includes(permission.key)} className="mt-1" /><span><span className="block font-semibold">{permission.key}</span><span className="text-xs text-muted">{permission.description}</span></span></label>)}</div>
            <button type="submit" className={buttonClass}>Save role permissions</button>
          </form>
          {!role.is_system && <form action={deleteRole} className="mt-3"><input type="hidden" name="id" value={role.id} /><button type="submit" className="text-sm font-medium text-rose-700 underline">Delete role (only if no user or position uses it)</button></form>}
        </article>;
      })}
    </section>

    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold">Assign a role to a user</h2>
      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">Find user by name<input name="q" defaultValue={query} maxLength={80} className={inputClass} /></label>
        <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:border-sky-500" type="submit">Search</button>
      </form>
      <form action={assignRole} className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">User (first 25 matches)<select name="user_id" required className={inputClass}><option value="">Choose user</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name || "Unnamed user"} · {profile.id.slice(0, 8)}{profile.department ? ` · ${profile.department}` : ""}</option>)}</select></label>
        <label className="text-sm font-medium">Role<select name="role_id" required className={inputClass}><option value="">Choose role</option>{roles.map((role) => <option value={role.id} key={role.id}>{role.name} · {role.scope}</option>)}</select></label>
        <label className="text-sm font-medium">Club scope<select name="club_id" className={inputClass}><option value="">Society-wide</option>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
        <button type="submit" className={buttonClass}>Assign role</button>
      </form>
      {query && !profiles.length && <p className="mt-3 text-sm text-muted">No matching profiles found; search by a shorter part of the name.</p>}
    </section>

    <section className="mt-8 space-y-3">
      <h2 className="text-xl font-semibold">Current role assignments <span className="text-sm font-normal text-muted">(latest {assignments.length}{assignments.length === 100 ? "+" : ""})</span></h2>
      {assignments.map((assignment) => {
        const profile = one(assignment.profiles);
        const role = one(assignment.roles);
        const club = one(assignment.clubs);
        return <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" key={assignment.id}>
          <div><p className="font-semibold">{profile?.full_name || "User"} <span className="font-normal text-muted">· {role?.name || "Role"}</span></p><p className="text-xs text-muted">{club?.name || "Society-wide"} · User ID {assignment.user_id}</p></div>
          <form action={revokeRole}><input type="hidden" name="id" value={assignment.id} /><button type="submit" className="text-sm font-medium text-rose-700 underline">Revoke</button></form>
        </article>;
      })}
      {!assignments.length && !assignmentsResult.error && <p className="rounded-xl border border-slate-200 p-5 text-sm text-muted">No role assignments were found.</p>}
    </section>
  </main>;
}

function one<T>(value: T | T[] | null) { return Array.isArray(value) ? value[0] ?? null : value; }
const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
