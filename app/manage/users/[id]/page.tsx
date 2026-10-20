import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import type { Session, User } from "@clerk/backend";
import { changeUserStatus, revokeUserSession } from "../actions";
import { requireManager } from "@/lib/manage/server";

export const metadata: Metadata = { title: "User details | Techtronica" };
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ result?: string }> };
const clerkIdPattern = /^user_[a-zA-Z0-9]+$/;

export default async function ManageUserDetailsPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase } = await requireManager("admin.manage");
  if (!clerkIdPattern.test(id)) notFound();

  let clerkUser: User | null = null;
  let sessions: Session[] = [];
  try {
    const client = await clerkClient();
    const [userResult, sessionResult] = await Promise.all([
      client.users.getUser(id),
      client.sessions.getSessionList({ userId: id, status: "active", limit: 25 }),
    ]);
    clerkUser = userResult;
    sessions = sessionResult.data;
  } catch {
    notFound();
  }
  if (!clerkUser) notFound();

  const externalProfileId = clerkUser.externalId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clerkUser.externalId)
    ? clerkUser.externalId
    : null;
  const linkedProfile = await supabase.from("profiles").select("id, full_name, department, year_of_study, clerk_user_id").eq("clerk_user_id", id).maybeSingle();
  const importedProfile = !linkedProfile.data && externalProfileId
    ? await supabase.from("profiles").select("id, full_name, department, year_of_study, clerk_user_id").eq("id", externalProfileId).maybeSingle()
    : { data: null, error: null };
  const profile = linkedProfile.data ?? importedProfile.data;
  const profileId = profile?.id ?? "";
  const [assignments, positionMemberships] = profileId
    ? await Promise.all([
      supabase.from("user_role_assignments").select("id, role_id, club_id, roles(name, scope), clubs(name)").eq("user_id", profileId).limit(100),
      supabase.from("memberships").select("id, clubs(name), positions(name, role_id, club_id, is_active, roles(name, scope))").eq("user_id", profileId).eq("status", "active").not("position_id", "is", null).limit(100),
    ])
    : [{ data: [], error: null }, { data: [], error: null }];
  const email = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "No email";
  const name = clerkUser.fullName?.trim() || clerkUser.username || email;
  const statusMessage = query.result === "saved" ? "The session was revoked or Clerk account status was updated."
    : query.result === "invalid" ? "That session does not belong to this account."
      : query.result === "error" ? "Clerk could not complete the request. Refresh and try again."
        : null;
  const positionRoleCount = (positionMemberships.data ?? []).filter((membership) => relation(membership.positions)?.is_active).length;
  const roleCount = (assignments.data?.length ?? 0) + positionRoleCount;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <Link className="text-sm font-medium text-sky-700 hover:underline" href="/manage/users">← Back to users</Link>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Clerk account</p>
          <h1 className="mt-2 break-words text-3xl font-bold tracking-tight">{name}</h1>
          <p className="mt-2 break-all text-sm text-muted">{email}</p>
          <p className="mt-2 font-mono text-xs text-slate-500">{clerkUser.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={changeUserStatus}><input name="user_id" type="hidden" value={id} /><input name="action" type="hidden" value={clerkUser.banned ? "unban" : "ban"} /><button className={clerkUser.banned ? restoreButtonClass : dangerButtonClass} type="submit">{clerkUser.banned ? "Restore account" : "Suspend account"}</button></form>
        </div>
      </header>
      {statusMessage && <p role="status" className={`mt-5 rounded-xl p-4 text-sm ${query.result === "saved" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>{statusMessage}</p>}

      <section aria-label="Account summary" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Account status" value={clerkUser.banned ? "Suspended" : clerkUser.locked ? "Locked" : "Active"} />
        <Summary label="Created" value={formatDate(clerkUser.createdAt)} />
        <Summary label="Last sign-in" value={clerkUser.lastSignInAt ? formatDate(clerkUser.lastSignInAt) : "No sign-in yet"} />
        <Summary label="App role assignments" value={String(roleCount)} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-xl font-semibold">Role assignments</h2><p className="mt-1 text-sm text-muted">Scoped app roles linked to this person.</p></div>
            {profileId && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Profile …{profileId.slice(-6)}</span>}
          </div>
          {!profile && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This account has not created or linked its Techtronica profile yet. Its app roles can be assigned after the first sign-in.</p>}
          {(assignments.error || positionMemberships.error) && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Role data could not be loaded. Check the Supabase access policies.</p>}
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Role</th><th className="px-3 py-3">Scope</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {(assignments.data ?? []).map((item) => <tr key={item.id}><td className="px-3 py-3 font-medium">{relation(item.roles)?.name ?? "Role unavailable"}</td><td className="px-3 py-3 text-muted">{item.club_id ? relation(item.clubs)?.name ?? "Club scope" : "Society-wide"}</td></tr>)}
                {(positionMemberships.data ?? []).map((membership) => {
                  const position = relation(membership.positions);
                  if (!position?.is_active || !position.role_id) return null;
                  return <tr key={`position-${membership.id}`}><td className="px-3 py-3 font-medium">{relation(position.roles)?.name ?? "Position role"}<span className="mt-0.5 block text-xs font-normal text-muted">Via {position.name}</span></td><td className="px-3 py-3 text-muted">{position.club_id ? relation(membership.clubs)?.name ?? "Club scope" : "Society-wide"}</td></tr>;
                })}
                {!assignments.error && !positionMemberships.error && !assignments.data?.length && !(positionMemberships.data ?? []).some((membership) => relation(membership.positions)?.is_active) && <tr><td className="px-3 py-6 text-muted" colSpan={2}>No scoped management roles assigned.</td></tr>}
              </tbody>
            </table>
          </div>
          <Link className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:underline" href="/manage/access">Open Roles &amp; access →</Link>
        </section>

        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><h2 className="text-xl font-semibold">Active devices and sessions</h2><p className="mt-1 text-sm text-muted">Device details and approximate region come from Clerk session activity. IP addresses are not shown.</p></div>
          <div className="mt-4 space-y-3">
            {sessions.map((session) => {
              const activity = session.latestActivity;
              const device = activity?.deviceType || (activity?.isMobile ? "Mobile" : "Device not reported");
              const browser = [activity?.browserName, activity?.browserVersion].filter(Boolean).join(" ") || "Browser not reported";
              const location = [activity?.city, activity?.country].filter(Boolean).join(", ") || "Location unavailable";
              return <article className="rounded-2xl border border-slate-200 p-4" key={session.id}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{device} · {browser}</p><p className="mt-1 text-sm text-muted">{location}</p><p className="mt-1 text-xs text-muted">Last active {formatDate(session.lastActiveAt)} · expires {formatDate(session.expireAt)}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{session.id}</p></div>
                  <form action={revokeUserSession}><input name="user_id" type="hidden" value={id} /><input name="session_id" type="hidden" value={session.id} /><button className="shrink-0 text-sm font-semibold text-rose-700 hover:underline" type="submit">Sign out</button></form>
                </div>
              </article>;
            })}
            {!sessions.length && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-muted">No active sessions were returned by Clerk.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 break-words text-lg font-semibold">{value}</p></div>;
}

function relation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

const secondaryButtonClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-sky-500 hover:text-sky-700";
const dangerButtonClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100";
const restoreButtonClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100";
