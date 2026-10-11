import type { Metadata } from "next";
import Link from "next/link";
import { FiKey, FiPlus, FiShield, FiUserPlus, FiUsers } from "react-icons/fi";
import ResultMessage from "@/components/manage/ResultMessage";
import { requireManager } from "@/lib/manage/server";
import { assignRole, createRole, deleteRole, inviteUser, revokeRole, updateRole } from "./actions";

export const metadata: Metadata = { title: "Roles and access | Techtronica management" };

type SearchParams = Promise<{ result?: string; q?: string; role_q?: string }>;
type Permission = { key: string; description: string };

const permissionOrder = [
  "Administration",
  "Clubs and positions",
  "People and memberships",
  "Events and registrations",
  "Team and alumni",
  "Website content",
  "Other permissions",
];

const permissionLabels: Record<string, string> = {
  "admin.manage": "Manage roles, invitations, and access",
  "clubs.manage": "Manage clubs",
  "positions.manage": "Manage society and club positions",
  "members.manage": "Review and manage memberships",
  "events.manage": "Create and manage events",
  "registrations.manage": "Manage event registrations",
  "team.manage": "Manage the team directory",
  "alumni.manage": "Manage alumni profiles",
  "contacts.manage": "Manage contact messages",
  "content.manage": "Manage website content and media",
};

export default async function AccessManagementPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireManager("admin.manage");
  const query = normalizeQuery(params.q);
  const roleQuery = normalizeQuery(params.role_q);

  const [rolesResult, permissionsResult, rolePermissionResult, assignmentsResult, clubsResult, profilesResult] = await Promise.all([
    supabase.from("roles").select("id, name, scope, description, is_system").order("scope").order("name").limit(100),
    supabase.from("permissions").select("key, description").order("key").limit(100),
    supabase.from("role_permissions").select("role_id, permission_key").limit(1000),
    supabase.from("user_role_assignments").select("id, user_id, role_id, club_id, created_at, profiles!user_role_assignments_user_id_fkey(full_name), roles(name, scope), clubs(name)").order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100),
    supabase.from("clubs").select("id, name").eq("is_active", true).order("display_order").limit(20),
    (() => {
      let profiles = supabase.from("profiles").select("id, full_name, department").order("full_name").order("id").limit(25);
      if (query) profiles = profiles.ilike("full_name", `%${query}%`);
      return profiles;
    })(),
  ]);

  const roles = rolesResult.data ?? [];
  const permissions = permissionsResult.data ?? [];
  const rolePermissions = rolePermissionResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const clubs = clubsResult.data ?? [];
  const profiles = profilesResult.data ?? [];
  const displayedRoles = roles.filter((role) =>
    `${role.name} ${role.description ?? ""} ${role.scope}`.toLocaleLowerCase().includes(roleQuery.toLocaleLowerCase()),
  );
  const assignedRoleCount = new Set(assignments.map((assignment) => assignment.role_id)).size;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <Link className="text-sm font-medium text-sky-700 hover:underline" href="/manage">← Back to management</Link>
      <header className="mt-5 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Administrator workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Roles and access</h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          Decide what society and club managers can do. A role is a named set of permissions; assigning it gives a person those capabilities in the selected scope.
        </p>
      </header>

      <ResultMessage result={params.result} />
      {(rolesResult.error || permissionsResult.error || rolePermissionResult.error || assignmentsResult.error || clubsResult.error || profilesResult.error) && (
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
          Some access data could not be loaded. The counts or lists below may be incomplete. Refresh the page, and check your administrator access if this continues.
        </p>
      )}

      <section aria-label="Access overview" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard icon={<FiShield aria-hidden="true" />} label="Roles" value={rolesResult.error ? "—" : roles.length} note="Up to 100 shown" />
        <OverviewCard icon={<FiKey aria-hidden="true" />} label="Available permissions" value={permissionsResult.error ? "—" : permissions.length} note="Permission keys defined by the system" />
        <OverviewCard icon={<FiUsers aria-hidden="true" />} label="People with access" value={assignmentsResult.error ? "—" : assignments.length} note={assignments.length === 100 ? "Latest 100 assignments" : "Current role assignments"} />
        <OverviewCard icon={<FiUserPlus aria-hidden="true" />} label="Roles in use" value={assignmentsResult.error ? "—" : assignedRoleCount} note={assignments.length === 100 ? "Within the latest 100 assignments" : "Different roles currently assigned"} />
      </section>

      <nav aria-label="Role administration sections" className="mt-7 flex gap-2 overflow-x-auto pb-2 text-sm">
        <SectionLink href="#invite-user">Invite a person</SectionLink>
        <SectionLink href="#role-catalog">Role catalog</SectionLink>
        <SectionLink href="#assign-role">Assign a role</SectionLink>
        <SectionLink href="#assignments">Current assignments</SectionLink>
      </nav>

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <div className="min-w-0 space-y-6">
          <section id="role-catalog" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Design access</p>
                <h2 className="mt-1 text-2xl font-semibold">Role catalog</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Review what each role allows. Open a role to update its name, description, or permissions.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{roles.length}{roles.length === 100 ? "+" : ""} roles</span>
            </div>

            <form action="#role-catalog" className="mt-5 flex flex-wrap items-end gap-3" method="get">
              {query && <input type="hidden" name="q" value={query} />}
              <label className="min-w-0 flex-1 text-sm font-medium" htmlFor="role-search">
                Find a role
                <input className={inputClass} id="role-search" name="role_q" defaultValue={roleQuery} placeholder="Search by name, scope, or description" />
              </label>
              <button className={secondaryButtonClass} type="submit">Search roles</button>
            </form>

            <details className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="grid size-9 place-items-center rounded-xl bg-white text-sky-700 shadow-sm dark:bg-slate-900"><FiPlus aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">Create a role</span>
                <span className="text-xs font-medium text-muted">Choose permissions and a scope</span>
              </summary>
              <div className="border-t border-sky-200 p-4 dark:border-sky-900 sm:p-5">
                <p className="mb-4 text-sm leading-6 text-muted">Give the role a clear name, select the actions it should allow, and choose whether it applies across the society or inside one club.</p>
                <form action={createRole} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium" htmlFor="new-role-name">Role name
                      <input className={inputClass} id="new-role-name" maxLength={80} minLength={2} name="name" placeholder="For example, Club Events Manager" required />
                    </label>
                    <label className="text-sm font-medium" htmlFor="new-role-scope">Where can this role work?
                      <select className={inputClass} id="new-role-scope" name="scope" defaultValue="club">
                        <option value="club">One club (club-scoped)</option>
                        <option value="society">All of Techtronica (society-wide)</option>
                      </select>
                    </label>
                    <p className="text-xs leading-5 text-muted sm:col-span-2">Club-scoped roles need a club selected when assigned. Society-wide roles always apply to the whole society.</p>
                    <label className="text-sm font-medium sm:col-span-2" htmlFor="new-role-description">Description
                      <textarea className={inputClass} id="new-role-description" maxLength={500} name="description" placeholder="Explain the responsibilities this role should have." rows={3} />
                    </label>
                  </div>
                  <PermissionChecklist permissions={permissions} name="permission_keys" />
                  <button className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`} disabled={!permissions.length} type="submit">Create role</button>
                </form>
              </div>
            </details>

            <div className="mt-5 space-y-4">
              {displayedRoles.map((role) => {
                const keys = rolePermissions.filter((entry) => entry.role_id === role.id).map((entry) => entry.permission_key);
                const selected = permissions.filter((permission) => keys.includes(permission.key));
                return (
                  <article className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:p-5" key={role.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-semibold">{role.name}</h3>
                          <ScopeBadge scope={role.scope} />
                          {role.is_system && <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">System role</span>}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted">{role.description || "No description has been added yet."}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted">{keys.length} {keys.length === 1 ? "permission" : "permissions"}</span>
                    </div>

                    {selected.length ? (
                      <ul aria-label={`Permissions in ${role.name}`} className="mt-4 flex flex-wrap gap-2">
                        {selected.map((permission) => (
                          <li className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200" key={permission.key} title={permission.description}>
                            {permissionLabels[permission.key] ?? permission.description}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">No permissions are assigned. This role does not grant management capabilities.</p>
                    )}

                    <details className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <summary className="cursor-pointer text-sm font-semibold text-sky-700 hover:underline">Edit role and permissions</summary>
                      <form action={updateRole} className="mt-4 space-y-5">
                        <input type="hidden" name="id" value={role.id} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="text-sm font-medium" htmlFor={`role-name-${role.id}`}>Role name
                            <input className={`${inputClass} read-only:opacity-70`} defaultValue={role.name} id={`role-name-${role.id}`} maxLength={80} name="name" readOnly={role.is_system} required />
                          </label>
                          <div>
                            <span className="text-sm font-medium">Scope</span>
                            <div className="mt-1 flex h-[43px] items-center"><ScopeBadge scope={role.scope} /></div>
                            <p className="mt-1 text-xs text-muted">Scope cannot be changed after role creation.</p>
                          </div>
                          <label className="text-sm font-medium sm:col-span-2" htmlFor={`role-description-${role.id}`}>Description
                            <textarea className={`${inputClass} read-only:opacity-70`} defaultValue={role.description ?? ""} id={`role-description-${role.id}`} maxLength={500} name="description" readOnly={role.is_system} rows={2} />
                          </label>
                        </div>
                        {role.is_system && <p className="text-xs leading-5 text-muted">This protected system role keeps its name and description. Its permissions can still be reviewed and configured.</p>}
                        <PermissionChecklist permissions={permissions} name="permission_keys" selectedKeys={keys} />
                        <button className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`} disabled={!permissions.length} type="submit">Save role changes</button>
                      </form>
                      {!role.is_system && (
                        <details className="mt-5 rounded-xl border border-rose-200 p-4 dark:border-rose-900">
                          <summary className="cursor-pointer text-sm font-semibold text-rose-700">Delete this role</summary>
                          <p className="mt-2 text-sm leading-6 text-muted">Deletion is allowed only when no user assignment or position uses this role.</p>
                          <form action={deleteRole} className="mt-3">
                            <input type="hidden" name="id" value={role.id} />
                            <button className={dangerButtonClass} type="submit">Confirm delete {role.name}</button>
                          </form>
                        </details>
                      )}
                    </details>
                  </article>
                );
              })}
              {!displayedRoles.length && !rolesResult.error && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-muted">{roleQuery ? "No roles match that search." : "No roles are available yet."}</p>}
            </div>
          </section>

          <section id="assignments" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Review access</p>
                <h2 className="mt-1 text-2xl font-semibold">Current assignments</h2>
                <p className="mt-1 text-sm leading-6 text-muted">Role assignments take effect immediately and are checked by the database on every protected action.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Latest {assignments.length}{assignments.length === 100 ? "+" : ""}</span>
            </div>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.map((assignment) => {
                const profile = one(assignment.profiles);
                const role = one(assignment.roles);
                const club = one(assignment.clubs);
                const displayName = profile?.full_name?.trim() || "Unnamed account";
                return (
                  <article className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between" key={assignment.id}>
                    <div className="flex min-w-0 items-start gap-3">
                      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]?.toLocaleUpperCase()).join("") || "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words font-semibold">{displayName}</p>
                        <p className="mt-1 text-sm text-muted">{role?.name ?? "Role unavailable"} · {club?.name ?? "Society-wide"}</p>
                        <p className="mt-1 text-xs text-muted">Granted {formatDate(assignment.created_at)} · account …{assignment.user_id.slice(-6)}</p>
                      </div>
                    </div>
                    <details className="shrink-0 rounded-xl border border-rose-200 px-3 py-2 dark:border-rose-900">
                      <summary className="cursor-pointer text-sm font-semibold text-rose-700">Remove access</summary>
                      <div className="mt-3 max-w-xs">
                        <p className="text-xs leading-5 text-muted">This removes {role?.name ?? "this role"} from {displayName} in this scope.</p>
                        <form action={revokeRole} className="mt-2">
                          <input type="hidden" name="id" value={assignment.id} />
                          <button aria-label={`Confirm removal of ${role?.name ?? "role"} from ${displayName}`} className={dangerButtonClass} type="submit">Confirm remove</button>
                        </form>
                      </div>
                    </details>
                  </article>
                );
              })}
              {!assignments.length && !assignmentsResult.error && <p className="py-6 text-sm text-muted">No role assignments have been made yet.</p>}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <section id="invite-user" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-sky-50 text-xl text-sky-700 dark:bg-sky-950 dark:text-sky-300"><FiUserPlus aria-hidden="true" /></span>
            <h2 className="mt-4 text-xl font-semibold">Invite a person</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Send an email invitation so someone can create their account. An invitation does not make them a society member or grant a role.</p>
            <form action={inviteUser} className="mt-5 space-y-4">
              <label className="block text-sm font-medium" htmlFor="invite-full-name">Full name
                <input autoComplete="name" className={inputClass} id="invite-full-name" maxLength={120} name="full_name" placeholder="Their name" />
              </label>
              <label className="block text-sm font-medium" htmlFor="invite-email">Email address
                <input autoComplete="email" className={inputClass} id="invite-email" maxLength={254} name="email" placeholder="person@example.com" required type="email" />
              </label>
              <button className={`${buttonClass} w-full`} type="submit">Send invitation</button>
            </form>
          </section>

          <section id="assign-role" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><FiUsers aria-hidden="true" /></span>
            <h2 className="mt-4 text-xl font-semibold">Assign a role</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Choose an existing account, role, and matching scope. Society roles apply everywhere; club roles require one specific club.</p>
            <form action="#assign-role" className="mt-5 flex flex-wrap items-end gap-3" method="get">
              {roleQuery && <input type="hidden" name="role_q" value={roleQuery} />}
              <label className="min-w-0 flex-1 text-sm font-medium" htmlFor="profile-search">Search accounts by name
                <input autoComplete="off" className={inputClass} defaultValue={query} id="profile-search" maxLength={80} name="q" placeholder="Start with a person's name" />
              </label>
              <button className={secondaryButtonClass} type="submit">Find</button>
            </form>
            {profilesResult.error && <p className="mt-3 text-sm text-amber-800" role="status">Accounts could not be loaded. Refresh to try again.</p>}
            {!profilesResult.error && query && profiles.length === 0 && <p className="mt-3 text-sm text-muted">No accounts matched. Try a shorter part of the person&apos;s name.</p>}
            {!profilesResult.error && !query && profiles.length === 25 && <p className="mt-3 text-xs text-muted">Showing the first 25 accounts. Search by name to find someone else.</p>}
            <form action={assignRole} className="mt-4 space-y-4">
              <label className="block text-sm font-medium" htmlFor="assignment-user">Person
                <select className={inputClass} id="assignment-user" name="user_id" required defaultValue="">
                  <option disabled value="">Choose an account</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {(profile.full_name || "Unnamed account").slice(0, 80)}{profile.department ? ` · ${profile.department}` : ""} · …{profile.id.slice(-6)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium" htmlFor="assignment-role">Role
                <select className={inputClass} id="assignment-role" name="role_id" required defaultValue="">
                  <option disabled value="">Choose a role</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name} · {role.scope === "society" ? "Society-wide" : "Club-scoped"}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium" htmlFor="assignment-club">Club scope
                <select className={inputClass} id="assignment-club" name="club_id" defaultValue="">
                  <option value="">Entire society (for society-wide roles)</option>
                  {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
                </select>
              </label>
              <p className="text-xs leading-5 text-muted">For a club-scoped role, choose the club where this person should have access. The database rejects mismatched role and scope choices.</p>
              <button className={`${buttonClass} w-full`} type="submit">Assign role</button>
            </form>
          </section>

          <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900 dark:bg-sky-950/30 sm:p-6">
            <h2 className="font-semibold">How access works</h2>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li><strong className="text-foreground">1.</strong> Create or review a role and choose its permissions.</li>
              <li><strong className="text-foreground">2.</strong> Find the person’s verified account. Invite them first if they have not signed up.</li>
              <li><strong className="text-foreground">3.</strong> Assign the role at the correct society or club scope.</li>
            </ol>
            <p className="mt-4 border-t border-sky-200 pt-4 text-xs leading-5 text-muted dark:border-sky-900">This page helps administrators manage access. Supabase policies still verify every protected database operation.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function OverviewCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: number | string; note: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg text-sky-700 dark:bg-slate-800 dark:text-sky-300">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">{note}</p>
      </div>
    </div>
  );
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="shrink-0 rounded-full border border-slate-300 bg-white px-3.5 py-2 font-medium transition hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900" href={href}>{children}</a>;
}

function ScopeBadge({ scope }: { scope: string }) {
  const isSociety = scope === "society";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isSociety ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"}`}>
    {isSociety ? "Society-wide" : "Club-scoped"}
  </span>;
}

function PermissionChecklist({ permissions, name, selectedKeys = [] }: { permissions: Permission[]; name: string; selectedKeys?: string[] }) {
  const groups = groupPermissions(permissions);
  if (!permissions.length) {
    return <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">No permission definitions were loaded. Refresh before saving this role.</p>;
  }

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold">Permissions this role grants</legend>
      <p className="mb-3 mt-1 text-xs leading-5 text-muted">Select every capability this role should have. A person receives only the checked capabilities.</p>
      <div className="space-y-4">
        {groups.map(([group, items]) => (
          <fieldset className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:p-4" key={group}>
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{group}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((permission) => (
                <label className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl p-2.5 transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-sky-500 dark:hover:bg-slate-800/70" key={permission.key}>
                  <input
                    className="mt-0.5 size-4 shrink-0 accent-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                    defaultChecked={selectedKeys.includes(permission.key)}
                    name={name}
                    type="checkbox"
                    value={permission.key}
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold">{permissionLabels[permission.key] ?? permission.description}</span>
                    <span className="mt-0.5 block break-words font-mono text-[11px] text-muted">{permission.key}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">{permission.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </fieldset>
  );
}

function groupPermissions(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const prefix = permission.key.split(".")[0];
    const group = prefix === "admin" ? "Administration"
      : prefix === "clubs" || prefix === "positions" ? "Clubs and positions"
      : prefix === "members" ? "People and memberships"
      : prefix === "events" || prefix === "registrations" ? "Events and registrations"
      : prefix === "team" || prefix === "alumni" ? "Team and alumni"
      : prefix === "contacts" || prefix === "content" ? "Website content"
      : "Other permissions";
    groups.set(group, [...(groups.get(group) ?? []), permission]);
  }
  return [...groups.entries()].sort(([a], [b]) => permissionOrder.indexOf(a) - permissionOrder.indexOf(b));
}

function normalizeQuery(value?: string) {
  return (value ?? "").replace(/[%_,.()]/g, " ").trim().slice(0, 80);
}

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

const inputClass = "mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
const secondaryButtonClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900";
const dangerButtonClass = "inline-flex min-h-10 items-center justify-center rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2";
